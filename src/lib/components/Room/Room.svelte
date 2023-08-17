<script lang="ts">
    import Modal from "$lib/components/Modal.svelte"
    import { page } from "$app/stores";
    import { onDestroy } from "svelte"
    import ndkStore from '$lib/stores/ndk';
    import { get } from 'svelte/store';
    import {NDKEvent, NDKSubscription} from "@nostr-dev-kit/ndk";
    import { nip19 } from "nostr-tools";
    import {Kinds, type RoomMember, type StageMember} from "$lib/utils/constants";
    import Profile from "$lib/components/Room/Profile.svelte";
    import { RelayList } from "@nostr-dev-kit/ndk-svelte-components";

    const ndk = get(ndkStore)
    const loadedDate = new Date(); // see StageMember

    const decoded = nip19.decode($page.params.roomid);

    const roomAddr = decoded.data as nip19.AddressPointer

    let editDialog: any;
    let baseRoomEv: NDKEvent | null;
    let metaRoomEv: NDKEvent | null;
    const baseRoomSub = ndk.subscribe({ kinds: [Kinds.NEST_INFO], authors: [roomAddr.pubkey], "#d": [roomAddr.identifier]}, { closeOnEose: false });
    baseRoomSub.on("event", (ev) => {
        baseRoomEv = ev;
        baseRoomPresent()
    });
    // TODO: allow mods to have valid events lol
    const metaRoomSub = ndk.subscribe({ kinds: [Kinds.NEST_METADATA], authors: [roomAddr.pubkey], "#d": [roomAddr.identifier] }, { closeOnEose: false });
    metaRoomSub.on("event", (ev) => {
        metaRoomEv = ev;
        roomTitle = ev.getMatchingTags("title")[0][1] || ""
        roomDesc = ev.getMatchingTags("desc")[0][1] || ""
        const permittedSpeakers = ev.getMatchingTags("stage")
        const oldStage = new Map(stageMembers)
        stageMembers.clear() // to clearout everyone that should be there
        for (const entry of permittedSpeakers) {
            const oldEntry = oldStage.get(entry[1]);
            const perms = entry[2]?.join(",")
            stageMembers.set(entry[1], {
                lastSeen: loadedDate,
                lastOnStageTime: oldEntry?.lastOnStageTime || new Date(),
                lastOnStage: oldEntry?.lastOnStage || false,
                hasPersistentAccess: oldEntry?.hasPersistentAccess || perms.contains("persistent")
            })
        }
        stageMembers = stageMembers
    });

    // meta values
    let roomTitle = ""
    let roomDesc = ""

    async function publishRoomMeta() {
        try {
            await ndk.assertSigner();
        } catch (error) {
            alert('log in first jackass');
            return;
        }
        const ev = new NDKEvent(ndk);
        ev.kind = Kinds.NEST_METADATA
        ev.tags = [
            ["d", roomAddr.identifier],
            ["title", roomTitle],
            ["desc", roomDesc],
            ["stage", roomAddr.pubkey],
            ["status", "open"]
        ]

        await ev.publish()
    }

    let onStage = false;
    let handRaised = false;
    let ourPubkey = ""; // A little hackey? TODO: FIX
    async function broadcastPresence() {
        try {
            console.log("attempting to rebroadcast presence");
            if (!ndk.assertSigner()) return // I think this should be awaited? but when I do await it the app doesn't try to sign even if one is present.
            const presEv = new NDKEvent(ndk)
            presEv.kind = Kinds.NEST_PRESENCE
            presEv.tags = [
                ["d", `${Kinds.NEST_INFO}:${baseRoomEv?.pubkey}:${baseRoomEv?.getMatchingTags("d")[0][1]}`],
                ["present", "true"],
                ["hand_raised", handRaised.toString()],
                ["on_stage", onStage.toString()]
            ]

            console.log("rebroadcasting our presence")
            await presEv.publish()
            ourPubkey = presEv.pubkey;
        } catch (error) {
            console.error(error)
        }
    }

    // make sure that the presence is rebroadcasted if a signer is added.
    async function startPresence() {
        broadcastPresence();
        setInterval(async () => {
            broadcastPresence();
        }, 25000)
    }

    $: if (baseRoomEv)
        startPresence();

    let roomMembers: Map<string, RoomMember> = new Map();
    let stageMembers: Map<string, StageMember> = new Map();
    let roomPresenceSub: NDKSubscription | null = null
    // TODO: MAKE THIS EFFICIENT, AND CLEAN!
    function baseRoomPresent() {
        const currentTime = new Date();
        currentTime.setSeconds(currentTime.getSeconds() - 30);
        const unixTimestamp = Math.floor(currentTime.getTime() / 1000);
        roomPresenceSub = ndk.subscribe({since: unixTimestamp - 30, kinds: [Kinds.NEST_PRESENCE], "#d": [`${Kinds.NEST_INFO}:${baseRoomEv?.pubkey}:${baseRoomEv?.getMatchingTags("d")[0][1]}`]}, {closeOnEose: false});
        roomPresenceSub.on("event", (ev: NDKEvent) => {
            if (ev.pubkey == ourPubkey) {
                onStage = ev.getMatchingTags("on_stage")[0][1] == "true"
                handRaised = ev.getMatchingTags("hand_raised")[0][1] == "true"
            }
            const pubkey = ev.author.hexpubkey()
            roomMembers.set(pubkey,
                {
                    user: ev.author,
                    present: ev.getMatchingTags("present")[0][1] === "true",
                    handRaised: ev.getMatchingTags("hand_raised")[0][1] === "true",
                    lastUpdated: new Date(),
                }
            );
            const memberStage = metaRoomEv?.getMatchingTags("stage").filter((value) => value[1] == pubkey);
            if (memberStage && memberStage.length > 0) {
                const joinedStagePerms = memberStage[2]?.join(",") || ""
                stageMembers.set(pubkey, {
                    lastSeen: new Date(),
                    lastOnStageTime: new Date(), // TODO: get this proper working
                    lastOnStage: ev.getMatchingTags("on_stage")[0][1] == "true",
                    hasPersistentAccess: joinedStagePerms.includes("persistent")
                })
            }
            cleanPresenceList()
            console.log("got presence event", ev)
        })
    }

    let interval = setInterval(cleanPresenceList, 5000);

    function cleanPresenceList() {
        const currentTime = new Date();
        currentTime.setSeconds(currentTime.getSeconds() - 30);
        const unixTimestamp = Math.floor(currentTime.getTime() / 1000);
        for (const [id, mem] of roomMembers) {
            if (Math.floor(mem.lastUpdated.getTime() / 1000) < unixTimestamp) {
                roomMembers.delete(id);
            }
        }
        for (const [id, mem] of stageMembers)

        roomMembers = roomMembers; // reassign for bullshit svelte reactivity
    }

    // unsub on destroy
    onDestroy(() => {
        baseRoomSub.stop();
        metaRoomSub.stop();
        roomPresenceSub.stop();
        // TODO: set presence to not present
        // TODO: also clear the broadcast interval
        clearInterval(interval);
    });
</script>

{#if baseRoomEv}
    <RelayList ndk={ndk} />
    <div class="flex flex-col">
        <span>ROOM TITLE: {roomTitle}</span>
        <span>ROOM DESC: {roomDesc}</span>
        <span>ROOM ALIAS: {baseRoomEv.getMatchingTags("alias")[0][1]}</span>
        <span>AUDIO SERVER: {baseRoomEv.getMatchingTags("audio_server")[0][1]}</span>
        <span>
        MODERATORS:
            {#each baseRoomEv.getMatchingTags("moderator") as mod}
            {mod[1]},
        {/each}
    </span>
    </div>
    <Modal bind:dialog={editDialog}>
        <div class="flex flex-col gap-1">
            <div class="flex flex-col">
                <h1>Room Settings</h1>
                <span>All fields are optional</span>
            </div>
            <div class="flex flex-col gap-5">
                <div class="flex flex-col">
                    <h3>Pick a topic to talk about</h3>
                    <input bind:value={roomTitle} class="text-black" />
                </div>
                <div class="flex flex-col">
                    <h3>Describe the room (supports markdown)</h3>
                    <input bind:value={roomDesc} class="text-black" />
                </div>
            </div>
        </div>
        <div class="flex gap-2">
            <button class="button-secondary" on:click={editDialog.close()}>Cancel</button>
            <button class="button-primary"   on:click={() => {editDialog.close(); publishRoomMeta()}}>Done</button>
        </div>
    </Modal>
    <button class="button-primary" on:click={() => editDialog.showModal()}>Edit Room</button>

    <span on:click={broadcastPresence}>
        {#if onStage}
            <button class="button-primary" on:click={() => onStage = false}>Leave Stage</button>
        {:else}
            <button class="button-primary" on:click={() => onStage = true}>Go on Stage</button>
        {/if}
        {#if handRaised}
            <button class="button-primary" on:click={() => handRaised = false}>Lower Hand</button>
        {:else}
            <button class="button-primary" on:click={() => handRaised = true}>Raise Hand</button>
        {/if}
    </span>

    <h2>Stage</h2>
    {#each [...stageMembers] as [id, mem]}
        {#if mem.lastOnStage}
            <Profile ndk={ndk} profile={roomMembers.get(id)} stage={mem} />
        {/if}
    {/each}
    <h2>Audience</h2>
    {#each [...roomMembers] as [id, mem]}
        {#if !(!!stageMembers.get(id)?.lastOnStage)}
            <Profile ndk={ndk} profile={mem} />
        {/if}
    {/each}
{/if}