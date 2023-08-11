<script>
    import '../app.css';
    import Header from '$lib/components/Header.svelte';
    import { currentUser } from '$lib/stores/currentUser';
    import {NDKNip07Signer, NDKUser} from "@nostr-dev-kit/ndk";
    import ndkStore from "$lib/stores/ndk"
    import { get } from "svelte/store"
    import { onMount } from 'svelte';
    import { dateTomorrow } from '$lib/utils/helpers';

    let savestore = false;

    $: if (savestore && $currentUser) {
        window.sessionStorage.setItem('nestsCurrentUser', JSON.stringify($currentUser));
    }
    localStorage.debug = 'ndk:*'

    onMount(async () => {
        const storedUser = window.sessionStorage.getItem('nestsCurrentUser');
        if (storedUser) {
            const ndk = get(ndkStore)
            const newUser = new NDKUser({ npub: JSON.parse(storedUser).npub })
            newUser.ndk = ndk;
            currentUser.set(newUser);
            // TODO: Migrate this to it's own function! This doesn't feel right, but it should work.
            ndk.signer = new NDKNip07Signer();
            // FYI: if authentication breaks after an ndk update this should be suspect no. 1
            // @ts-expect-error this property wants the value of the output, not the function. took me a minute to figure that out.
            ndk.signer._userPromise = (async () => {
                return newUser;
            })()
            ndkStore.set(ndk)
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
