<script lang="ts">
    import type { RoomMember, StageMember } from '$lib/utils/constants';
    import { faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
    import type NDK from '@nostr-dev-kit/ndk';
    import { Avatar, Name } from '@nostr-dev-kit/ndk-svelte-components';
    import Fa from 'svelte-fa';

    export let ndk: NDK;
    export let profile: RoomMember | undefined;
    export let stage: StageMember | undefined; // doesn't need to be provided by default.
    export let ourPubkey: string = '';

    $: onStage = stage && stage!.lastOnStage === true;
    $: handRaised = profile && profile.handRaised === true;
</script>

{#if profile && profile.present}
    <div class="flex flex-col items-center gap-4">
        <div class="flex flex-col {handRaised ? '-mt-8' : ''}">
            {#if handRaised}
                <div
                    class="flex relative right-[20px] top-[25px] w-8 h-8 bg-accent-dark rounded-full content-center items-center p-2"
                >
                    ✋
                </div>
            {/if}
            <Avatar
                class="{profile.user.hexpubkey() === ourPubkey
                    ? 'border-4 border-white'
                    : ''} w-14 rounded-full aspect-square"
                {ndk}
                npub={profile.user.npub}
            />
            {#if onStage}
                <div
                    class="flex relative left-[35px] bottom-[25px] w-9 h-9 bg-accent-dark rounded-full content-center items-center p-2 text-red-600"
                >
                    <Fa icon={faMicrophoneSlash} />
                </div>
            {/if}
        </div>
        <div class={onStage ? '-mt-8' : ''}>
            <Name {ndk} npub={profile.user.npub} />
        </div>
    </div>
{/if}
