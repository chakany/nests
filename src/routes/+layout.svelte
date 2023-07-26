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

    onMount(async () => {
        const storedUser = window.sessionStorage.getItem('nestsCurrentUser');
        if (storedUser) {
            const ndk = get(ndkStore)

            const newUser = new NDKUser({ npub: JSON.parse(storedUser).npub })
            newUser.ndk = ndk;
            currentUser.set(newUser);
            // @ts-expect-error SHUT THE FUCK UP!
            // why the fuck do i need to do this hacky bullshit? just add a pubkey field and use that to check if
            // the user is authenticated, not this "promise" function async await bs. I honestly can't tell if there's a good reason for this
            // or the ndk developer that wrote this wanted to accomplish this in a clever manner but it doesn't make
            // any sense when it could have just been 85 times simpler to add a pubkey property to the class.
            // TODO: Migrate this to it's own function! This doesn't feel right, but it should works.
            ndk.signer = new NDKNip07Signer();
            // this property wants the value of the output, not the function lmfao. took me a minute to figure that out.
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
