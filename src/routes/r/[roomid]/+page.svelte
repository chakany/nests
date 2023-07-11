<script lang="ts">
    import { page } from "$app/stores";
    import ndkStore from '$lib/stores/ndk';
    import { get } from 'svelte/store';
    const ndk = get(ndkStore)

    const ev = await ndk.fetchEvent($page.params.roomid)
</script>

Room ID
