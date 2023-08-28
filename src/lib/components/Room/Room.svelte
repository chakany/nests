<script lang="ts">
    import Modal from '$lib/components/Modal.svelte';
    import { page } from '$app/stores';
    import { onDestroy } from 'svelte';
    import ndkStore from '$lib/stores/ndk';
    import { get } from 'svelte/store';
    import { NDKEvent, NDKSubscription } from '@nostr-dev-kit/ndk';
    import { nip19 } from 'nostr-tools';
    import { Kinds, type RoomMember, type StageMember } from '$lib/utils/constants';
    import Profile from '$lib/components/Room/Profile.svelte';
    import ProfileGrid from '$lib/components/Room/ProfileGrid.svelte';
    import { Name, RelayList } from '@nostr-dev-kit/ndk-svelte-components';
    import Fa from 'svelte-fa';
    import { faGear } from '@fortawesome/free-solid-svg-icons';
    import showdown from 'showdown';

    const ndk = get(ndkStore);
    const loadedDate = new Date(); // see StageMember

    const decoded = nip19.decode($page.params.roomid);

    const roomAddr = decoded.data as nip19.AddressPointer;

    let editDialog: any;
    let stageDialog: any;
    let moderatorDialog: any;
    let baseRoomEv: NDKEvent | null;
    $: isModerator =
        (baseRoomEv?.getMatchingTags('moderator').filter((t) => t[1] == ourPubkey)?.length || 0) >
        0;
    let metaRoomEv: NDKEvent | null;
    const baseRoomSub = ndk.subscribe(
        { kinds: [Kinds.NEST_INFO], authors: [roomAddr.pubkey], '#d': [roomAddr.identifier] },
        { closeOnEose: false }
    );
    baseRoomSub.on('event', (ev) => {
        baseRoomEv = ev;
        const authedKeys: string[] = [];
        baseRoomEv!.getMatchingTags('moderator')?.filter((t) => authedKeys.push(t[1]));
        console.log(authedKeys);
        if (metaRoomSub) metaRoomSub.stop();
        subToMetaEvents(authedKeys);
        baseRoomPresent();
    });
    const converter = new showdown.Converter();
    let metaRoomSub: NDKSubscription | null = null;
    function subToMetaEvents(authors: string[]) {
        metaRoomSub = ndk.subscribe(
            { kinds: [Kinds.NEST_METADATA], authors, '#d': [roomAddr.identifier] },
            { closeOnEose: false }
        );
        metaRoomSub.on('event', (ev) => {
            metaRoomEv = ev;
            roomTitle = ev.getMatchingTags('title')[0][1] || '';
            roomDesc = converter.makeHtml(ev.getMatchingTags('desc')[0][1] || '');
            const permittedSpeakers = ev.getMatchingTags('stage');
            const oldStage = new Map(stageMembers);
            stageMembers.clear(); // to clearout everyone that should be there
            for (const entry of permittedSpeakers) {
                const oldEntry = oldStage.get(entry[1]);
                const perms = entry[2]?.join(',');
                stageMembers.set(entry[1], {
                    lastSeen: loadedDate,
                    lastOnStageTime: oldEntry?.lastOnStageTime || new Date(),
                    lastOnStage: oldEntry?.lastOnStage || false,
                    hasPersistentAccess:
                        oldEntry?.hasPersistentAccess || perms.contains('persistent')
                });
            }
            stageMembers = stageMembers;
        });
    }

    // meta values
    let roomTitle = '';
    let roomDesc = '';

    async function toggleMod(id: string) {
        try {
            const ev = new NDKEvent(ndk);
            ev.kind = Kinds.NEST_INFO;
            // filter out the id if it's there or add it in if it isn't there
            const mods = baseRoomEv?.getMatchingTags('moderator').filter((t) => t[1] != id) || [];
            if (mods.length == baseRoomEv?.getMatchingTags('moderator').length) {
                mods.push(['moderator', id]);
            }
            ev.tags = [
                ['d', roomAddr.identifier],
                ['alias', baseRoomEv?.getMatchingTags('alias')[0][1] || ''],
                ['audio_server', baseRoomEv?.getMatchingTags('audio_server')[0][1] || ''],
                ...mods
            ];
            await ev.publish();
            metaRoomSub?.stop();
            const authedKeys: string[] = [];
            mods.filter((t) => authedKeys.push(t[1]));
            subToMetaEvents(authedKeys);
        } catch (error) {
            console.error(error);
        }
    }

    async function toggleStage(id: string) {
        try {
            const ev = new NDKEvent(ndk);
            ev.kind = Kinds.NEST_METADATA;
            // filter out the id if it's there or add it in if it isn't there
            const speakers = metaRoomEv?.getMatchingTags('stage').filter((t) => t[1] != id) || [];
            if (speakers.length == metaRoomEv?.getMatchingTags('stage').length) {
                speakers.push(['stage', id]);
            }
            ev.tags = [
                ['d', metaRoomEv?.getMatchingTags('d')[0][1] || ''],
                ['title', metaRoomEv?.getMatchingTags('title')[0][1] || ''],
                ['desc', metaRoomEv?.getMatchingTags('desc')[0][1] || ''],
                ['status', metaRoomEv?.getMatchingTags('status')[0][1] || 'open'],
                ...speakers
            ];
            await ev.publish();
        } catch (error) {
            console.error(error);
        }
    }

    async function publishRoomMeta() {
        try {
            await ndk.assertSigner();
        } catch (error) {
            alert('log in first jackass');
            return;
        }
        const ev = new NDKEvent(ndk);
        ev.kind = Kinds.NEST_METADATA;
        ev.tags = [
            ['d', roomAddr.identifier],
            ['title', roomTitle],
            ['desc', roomDesc],
            ['stage', roomAddr.pubkey],
            ['status', 'open']
        ];

        await ev.publish();
    }

    let onStage = false;
    let handRaised = false;
    let ourPubkey = ''; // A little hackey? TODO: FIX
    async function broadcastPresence() {
        try {
            console.log('attempting to rebroadcast presence');
            if (!ndk.assertSigner()) return; // I think this should be awaited? but when I do await it the app doesn't try to sign even if one is present.
            const presEv = new NDKEvent(ndk);
            presEv.kind = Kinds.NEST_PRESENCE;
            presEv.tags = [
                [
                    'd',
                    `${Kinds.NEST_INFO}:${baseRoomEv?.pubkey}:${
                        baseRoomEv?.getMatchingTags('d')[0][1]
                    }`
                ],
                ['present', 'true'],
                ['hand_raised', handRaised.toString()],
                ['on_stage', onStage.toString()]
            ];

            console.log('rebroadcasting our presence');
            await presEv.publish();
            ourPubkey = presEv.pubkey;
        } catch (error) {
            console.error(error);
        }
    }

    // make sure that the presence is rebroadcasted if a signer is added.
    async function startPresence() {
        broadcastPresence();
        setInterval(async () => {
            broadcastPresence();
        }, 25000);
    }

    $: if (baseRoomEv) startPresence();

    let roomMembers: Map<string, RoomMember> = new Map();
    let stageMembers: Map<string, StageMember> = new Map();
    let roomPresenceSub: NDKSubscription | null = null;
    // TODO: MAKE THIS EFFICIENT, AND CLEAN!
    function baseRoomPresent() {
        const currentTime = new Date();
        currentTime.setSeconds(currentTime.getSeconds() - 30);
        const unixTimestamp = Math.floor(currentTime.getTime() / 1000);
        roomPresenceSub = ndk.subscribe(
            {
                since: unixTimestamp - 30,
                kinds: [Kinds.NEST_PRESENCE],
                '#d': [
                    `${Kinds.NEST_INFO}:${baseRoomEv?.pubkey}:${
                        baseRoomEv?.getMatchingTags('d')[0][1]
                    }`
                ]
            },
            { closeOnEose: false }
        );
        roomPresenceSub.on('event', (ev: NDKEvent) => {
            if (ev.pubkey == ourPubkey) {
                onStage = ev.getMatchingTags('on_stage')[0][1] == 'true';
                handRaised = ev.getMatchingTags('hand_raised')[0][1] == 'true';
            }
            const pubkey = ev.author.hexpubkey();
            roomMembers.set(pubkey, {
                user: ev.author,
                present: ev.getMatchingTags('present')[0][1] === 'true',
                handRaised: ev.getMatchingTags('hand_raised')[0][1] === 'true',
                lastUpdated: new Date()
            });
            const memberStage = metaRoomEv
                ?.getMatchingTags('stage')
                .filter((value) => value[1] == pubkey);
            if (memberStage && memberStage.length > 0) {
                const joinedStagePerms = memberStage[2]?.join(',') || '';
                stageMembers.set(pubkey, {
                    lastSeen: new Date(),
                    lastOnStageTime: new Date(), // TODO: get this proper working
                    lastOnStage: ev.getMatchingTags('on_stage')[0][1] == 'true',
                    hasPersistentAccess: joinedStagePerms.includes('persistent')
                });
            }
            cleanPresenceList();
            console.log('got presence event', ev);
        });
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
        for (const [id, mem] of stageMembers) roomMembers = roomMembers; // reassign for bullshit svelte reactivity
    }

    // unsub on destroy
    onDestroy(() => {
        baseRoomSub.stop();
        metaRoomSub?.stop();
        roomPresenceSub?.stop();
        // TODO: set presence to not present
        // TODO: also clear the broadcast interval
        clearInterval(interval);
    });
</script>

{#if baseRoomEv}
    <RelayList {ndk} />
    <div class="flex flex-col gap-8 px-4">
        <div class="flex flex-col px-6 py-4 rounded-2xl border-accent-dark bg-accent-dark gap-2">
            <div class="flex">
                <span class="font-semibold my-auto">{roomTitle}</span>
                {#if isModerator}
                    <span class="my-auto ml-auto" on:click={() => editDialog.showModal()}
                        ><Fa icon={faGear} /></span
                    >
                {/if}
            </div>
            <span class="text-gray-400">
                {@html roomDesc}
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
                <button
                    class="button-primary"
                    on:click={() => {
                        editDialog.close();
                        publishRoomMeta();
                    }}>Done</button
                >
            </div>
        </Modal>
        <div class="flex flex-col gap-4">
            <ProfileGrid>
                {#each Array.from(stageMembers).sort((a, b) => {
                    if (a[0] === ourPubkey) return -1; // Move the specific key to the front
                    if (b[0] === ourPubkey) return 1;
                    return 0;
                }) as [id, mem]}
                    {#if mem.lastOnStage}
                        <Profile {ourPubkey} {ndk} profile={roomMembers.get(id)} stage={mem} />
                    {/if}
                {/each}
            </ProfileGrid>
            <span class="text-center text-gray-500 font-semibold uppercase">Audience</span>
            <ProfileGrid>
                {#each Array.from(roomMembers).sort((a, b) => {
                    if (a[0] === ourPubkey) return -1; // Move the specific key to the front
                    if (b[0] === ourPubkey) return 1;
                    return 0;
                }) as [id, mem]}
                    {#if !!!stageMembers.get(id)?.lastOnStage}
                        <Profile {ourPubkey} {ndk} profile={mem} />
                    {/if}
                {/each}
            </ProfileGrid>
        </div>
        <span on:click={broadcastPresence}>
            {#if metaRoomEv?.getMatchingTags('stage').filter((t) => t[1] === ourPubkey).length > 0}
                {#if onStage}
                    <button class="button-primary" on:click={() => (onStage = false)}
                        >Leave Stage</button
                    >
                {:else}
                    <button class="button-primary" on:click={() => (onStage = true)}
                        >Join Stage</button
                    >
                {/if}
            {/if}
            {#if handRaised}
                <button class="button-primary" on:click={() => (handRaised = false)}
                    >Lower Hand</button
                >
            {:else}
                <button class="button-primary" on:click={() => (handRaised = true)}
                    >Raise Hand</button
                >
            {/if}
        </span>

        {#if isModerator}
            <button class="button-primary" on:click={() => stageDialog.showModal()}
                >Stage Settings</button
            >
            <Modal bind:dialog={stageDialog}>
                <div class="flex flex-col">
                    {#each [...roomMembers] as [id, mem]}
                        <div class="flex gap-3">
                            <Name {ndk} npub={mem.user.npub} />
                            {#if metaRoomEv && metaRoomEv
                                    .getMatchingTags('stage')
                                    .filter((t) => t[1] === id).length > 0}
                                <button class="button-primary" on:click={() => toggleStage(id)}
                                    >Remove Stage Permission</button
                                >
                            {:else}
                                <button class="button-primary" on:click={() => toggleStage(id)}
                                    >Give Stage Permission</button
                                >
                            {/if}
                        </div>
                    {/each}
                </div>
                <div class="flex gap-2">
                    <button
                        class="button-primary"
                        on:click={() => {
                            stageDialog.close();
                        }}>Done</button
                    >
                </div>
            </Modal>
        {/if}

        {#if baseRoomEv?.pubkey === ourPubkey}
            <button class="button-primary" on:click={() => moderatorDialog.showModal()}
                >Appoint Moderator</button
            >
            <Modal bind:dialog={moderatorDialog}>
                <div class="flex flex-col">
                    {#each [...roomMembers] as [id, mem]}
                        <div class="flex gap-3">
                            <Name {ndk} npub={mem.user.npub} />
                            {#if baseRoomEv && baseRoomEv
                                    .getMatchingTags('moderator')
                                    .filter((t) => t[1] === id).length > 0}
                                <button class="button-primary" on:click={() => toggleMod(id)}
                                    >Remove Moderator</button
                                >
                            {:else}
                                <button class="button-primary" on:click={() => toggleMod(id)}
                                    >Add Moderator</button
                                >
                            {/if}
                        </div>
                    {/each}
                </div>
                <div class="flex gap-2">
                    <button
                        class="button-primary"
                        on:click={() => {
                            moderatorDialog.close();
                        }}>Done</button
                    >
                </div>
            </Modal>
        {/if}
    </div>
{/if}
