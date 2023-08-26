<script lang="ts">
    import type NDK from '@nostr-dev-kit/ndk';
    import { Avatar, Name } from '@nostr-dev-kit/ndk-svelte-components';
    import type { RoomMember, StageMember } from '$lib/utils/constants';

    export let ndk: NDK;
    export let profile: RoomMember | undefined;
    export let stage: StageMember | undefined = undefined; // Doesnt need to be provided by default.
</script>

{#if profile}
    <div class="flex flex-col">
        <div class="w-14 aspect-square">
            <Avatar {ndk} npub={profile.user.npub} />
        </div>
        <div>
            <Name {ndk} npub={profile.user.npub} />
        </div>
        {profile.user.npub} - {profile.present ? 'present' : 'not present'} - {profile.handRaised
            ? 'hand raised'
            : 'not raised'}
    </div>
{/if}
