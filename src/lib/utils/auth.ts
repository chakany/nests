import { currentUser } from '$lib/stores/currentUser';
import ndkStore from '$lib/stores/ndk';
import { dateTomorrow } from './helpers';
import { NDKNip07Signer } from '@nostr-dev-kit/ndk';
import { get } from 'svelte/store';

export async function authenticate(e: Event) {
    const ndk = get(ndkStore);
    let signer;
    try {
        signer = new NDKNip07Signer();
        ndk.signer = signer;
        ndkStore.set(ndk);
        signer.user().then(async (ndkUser) => {
            if (!!ndkUser.npub) {
                ndkUser.ndk = ndk;
                currentUser.set(ndkUser);
                window.sessionStorage.setItem('nestsCurrentUser', JSON.stringify(ndkUser));
                document.cookie = `userNpub=${ndkUser.npub};
                    expires=${dateTomorrow()}; SameSite=Lax; Secure`;
            }
        });
    } catch (error: any) {
        // Do more useful stuff here in the future
        console.error(error.message);
    }
}

export function clearSession(e: Event) {
    e.preventDefault();
    currentUser.set(undefined);
    window.sessionStorage.removeItem('nestsCurrentUser');
    document.cookie = 'userNpub=';
}
