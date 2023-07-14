<script lang="ts">
    import { page } from "$app/stores";
    import ndkStore from '$lib/stores/ndk';
    import { get } from 'svelte/store';
    import type {NDKEvent} from "@nostr-dev-kit/ndk";
    const ndk = get(ndkStore)

    let ev: NDKEvent | null
    (async () => { // can't figure out how to enable top level await, honestly don't care right now
        ev = await ndk.fetchEvent($page.params.roomid)
    })()
</script>

{#if ev}
    <div class="flex flex-col">
        <span>ROOM ALIAS: {ev.getMatchingTags("alias")[0][1]}</span>
        <span>AUDIO SERVER: {ev.getMatchingTags("audio_server")[0][1]}</span>
        <span>
        MODERATORS:
            {#each ev.getMatchingTags("moderator") as mod}
            {mod[1]},
        {/each}
    </span>
    </div>
{/if}