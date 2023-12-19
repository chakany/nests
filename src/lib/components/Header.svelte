<script lang="ts">
    import { goto } from '$app/navigation';
    import { currentUser } from '$lib/stores/currentUser';
    import ndk from '$lib/stores/ndk';
    import { authenticate, clearSession } from '$lib/utils/auth';
    import { Avatar, Name } from '@nostr-dev-kit/ndk-svelte-components';
    import { expoInOut } from 'svelte/easing';
    import { scale } from 'svelte/transition';

    let profileMenuVisible: boolean = false;

    function login(e: Event) {
        authenticate(e);
    }

    function logout(e: Event) {
        clearSession(e);
        goto('/');
    }

    function toggleProfileMenu() {
        profileMenuVisible = !profileMenuVisible;
    }
</script>

<div class="flex flex-row items-center justify-end p-8">
    <!-- Profile dropdown -->
    {#if $currentUser}
        <div class="relative">
            <button
                on:click={toggleProfileMenu}
                type="button"
                class="-m-1.5 flex items-center p-1.5"
                id="user-menu-button"
                aria-expanded="false"
                aria-haspopup="true"
            >
                <span class="sr-only">Open user menu</span>
                <Avatar ndk={$ndk} user={$currentUser} class="w-8 h-8 rounded-full" />
                <span class="hidden lg:flex lg:items-center">
                    <span
                        class="ml-4 text-sm font-semibold leading-6 text-slate-900 dark:text-slate-50"
                        aria-hidden="true"
                    >
                        <Name
                            ndk={$ndk}
                            user={$currentUser}
                            npubMaxLength={9}
                            on:click={toggleProfileMenu}
                        />
                    </span>
                    <!-- Chevron pointing down -->
                    <svg
                        class="ml-2 h-5 w-5 text-slate-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </span>
            </button>

            {#if profileMenuVisible}
                <!-- Dropdown profile menu -->
                <div
                    on:pointerleave={toggleProfileMenu}
                    in:scale={{ duration: 100, easing: expoInOut, start: 0.95 }}
                    out:scale={{ duration: 75, easing: expoInOut, start: 0.95 }}
                    class="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white dark:bg-slate-800 dark:text-slate-50 py-0 shadow-lg ring-1 ring-slate-900/5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    tabindex="-1"
                >
                    <button
                        on:click={() => logout}
                        on:touchend={() => logout}
                        class="block w-full text-left px-3 py-1 text-sm leading-6 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md"
                        role="menuitem"
                        tabindex="-1"
                        id="user-menu-item-1"
                    >
                        Log out
                    </button>
                </div>
            {/if}
        </div>
    {:else}
        <button class="button-secondary" on:click={login}>Log in</button>
    {/if}
</div>
