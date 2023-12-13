<script lang="ts">
    import { goto } from '$app/navigation';
    import { currentUser } from '$lib/stores/currentUser';
    import ndk from '$lib/stores/ndk';
    import { authenticate, clearSession } from '$lib/utils/auth';
    import { Avatar } from '@nostr-dev-kit/ndk-svelte-components';
    import { Popover, PopoverButton, PopoverPanel } from '@rgossiaux/svelte-headlessui';

    function login(e: Event) {
        authenticate(e);
    }

    function logout(e: Event) {
        clearSession(e);
        goto('/');
    }
</script>

<div class="flex flex-row items-center justify-end p-8">
    {#if $currentUser}
        <Popover style="position: relative;" class="h-10 w-10">
            <PopoverButton class="h-10 w-10">
                <Avatar ndk={$ndk} npub={$currentUser.npub} class="w-10 h-10 rounded-full" />
            </PopoverButton>

            <PopoverPanel
                style="position: absolute; z-index: 10;"
                class="
                w-48 right-0 flex flex-col
                bg-slate-900 p-2 rounded-lg shadow-md
                border border-slate-600
            "
            >
                <div class="panel-contents flex flex-col gap-2">
                    <PopoverButton
                        on:click={logout}
                        class="w-full p-2 rounded-md hover:bg-slate-800 font-semibold text-white"
                    >
                        Log out
                    </PopoverButton>
                </div>
            </PopoverPanel>
        </Popover>
    {:else}
        <button class="button-secondary" on:click={login}>Login with extension</button>
    {/if}
</div>
