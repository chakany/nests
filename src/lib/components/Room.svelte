<script lang="ts">
    import Modal from "$lib/components/Modal.svelte"
    import { page } from "$app/stores";
    import ndkStore from '$lib/stores/ndk';
    import { get } from 'svelte/store';
    import {NDKEvent} from "@nostr-dev-kit/ndk";
    import { nip19 } from "nostr-tools";
    const ndk = get(ndkStore)

    const decoded = nip19.decode($page.params.roomid);

    let editDialog;
    let baseRoomEv: NDKEvent | null;
    let metaRoomEv: NDKEvent | null;
    const baseRoomSub = ndk.subscribe({ kinds: [38001], authors: [decoded.data.pubkey], "#d": [decoded.data.identifier]}, { closeOnEose: false });
    baseRoomSub.on("event", (ev) => {
        baseRoomEv = ev;
    });
    // TODO: allow mods to have valid events lol
    const metaRoomSub = ndk.subscribe({ kinds: [38002], authors: [decoded.data.pubkey], "#d": [decoded.data.identifier] }, { closeOnEose: false });
    metaRoomSub.on("event", (ev) => {
        metaRoomEv = ev;
    });

    // meta values
    $: roomTitle = metaRoomEv?.getMatchingTags("title")[0][1] || ""
    $: roomDesc = metaRoomEv?.getMatchingTags("desc")[0][1] || ""

    async function publishRoomMeta() {
        try {
            await ndk.assertSigner();
        } catch (error) {
            alert('log in first jackass');
            return;
        }
        const ev = new NDKEvent(ndk);
        ev.kind = 38002
        ev.tags = [
            ["d", decoded.data.identifier],
            ["title", roomTitle],
            ["desc", roomDesc],
            ["stage", decoded.data.pubkey],
            ["status", "open"]
        ]

        await ev.publish()
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
{/if}