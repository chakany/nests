<script lang="ts">
    import Modal from "$lib/components/Modal.svelte"
    import { page } from "$app/stores";
    import { browser } from "$app/environment";
    import ndkStore from '$lib/stores/ndk';
    import { get } from 'svelte/store';
    import {NDKEvent, NDKUser} from "@nostr-dev-kit/ndk";
    import { nip19 } from "nostr-tools";
    import {Kinds} from "$lib/utils/constants";
    const ndk = get(ndkStore)

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

    // make sure that the presence is rebroadcasted if a signer is added.
    async function startPresence() {
        const broadcast = async () => {
            try {
                console.log("attempting to rebroadcast presence");
                if (!ndk.assertSigner()) return // I think this should be awaited? but when I do await it the app doesn't try to sign even if one is present.
                const presEv = new NDKEvent(ndk)
                presEv.kind = Kinds.NEST_PRESENCE
                presEv.tags = [
                    ["d", `${Kinds.NEST_INFO}:${baseRoomEv?.pubkey}:${baseRoomEv?.getMatchingTags("d")[0][1]}`],
                    ["present", "true"],
                    ["hand_raised", "false"]
                ]

                console.log("rebroadcasting our presence")
                await presEv.publish()
            } catch (error) {
                console.error(error)
            }
        }
        broadcast();
        setInterval(async () => {
            broadcast();
        }, 25000)
    }

    $: if (baseRoomEv)
        startPresence();

    interface RoomMember {
        user: NDKUser,
        present: boolean,
        handRaised: boolean,
        lastUpdated: Date
    }

    let presentMembers: Map<string, RoomMember> = new Map();
    // TODO: MAKE THIS EFFICIENT, AND CLEAN!
    function baseRoomPresent() {
        const currentTime = new Date();
        currentTime.setSeconds(currentTime.getSeconds() - 30);
        const unixTimestamp = Math.floor(currentTime.getTime() / 1000);
        const roomPresenceSub = ndk.subscribe({ since: unixTimestamp, kinds: [Kinds.NEST_PRESENCE], "#d": [`${Kinds.NEST_INFO}:${baseRoomEv?.pubkey}:${baseRoomEv?.getMatchingTags("d")[0][1]}`] }, { closeOnEose: false });
        roomPresenceSub.on("event", (ev: NDKEvent) => {
            presentMembers.set(ev.author.hexpubkey(), { user: ev.author, present: ev.getMatchingTags("present")[0][1] === "true", handRaised: ev.getMatchingTags("hand_raised")[0][1] === "true", lastUpdated: new Date() });
            for (const [id, mem] of presentMembers) {
                const currentTime = new Date();
                currentTime.setSeconds(currentTime.getSeconds() - 30);
                const unixTimestamp = Math.floor(currentTime.getTime() / 1000);
                if (Math.floor(mem.lastUpdated.getTime() / 1000) < unixTimestamp) {
                    presentMembers.delete(id);
                }
            }
            presentMembers = presentMembers; // reassign for bullshit svelte reactivity
            console.log("got presence event", ev)
        });
    }
</script>

{#if baseRoomEv}
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

    <h2>Present Users</h2>
    {#each [...presentMembers] as [id, mem]}
        {mem.user.npub} - {mem.present ? "present" : "not present"} - {mem.handRaised ? "hand raised" : "not raised"}
    {/each}
{/if}