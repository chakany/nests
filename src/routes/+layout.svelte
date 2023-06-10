<script>
    import '../app.css';
    import Header from '$lib/components/Header.svelte';
    import { currentUser } from '$lib/stores/currentUser';
    import { onMount } from 'svelte';
    import { dateTomorrow } from '$lib/utils/helpers';

    let savestore = false;

    $: if (savestore && $currentUser) {
        window.sessionStorage.setItem('nestsCurrentUser', JSON.stringify($currentUser));
    }

    onMount(async () => {
        const storedUser = window.sessionStorage.getItem('nestsCurrentUser');
        if (storedUser) {
            currentUser.set(JSON.parse(storedUser));
            document.cookie = `userNpub=${
                $currentUser?.npub
            }; expires=${dateTomorrow()}; SameSite=Lax; Secure`;
        }
        savestore = true;
    });
</script>

<div>
    <Header />
    <slot />
</div>
