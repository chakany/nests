import ndkStore from '$lib/stores/ndk';
import { get } from 'svelte/store';
import { browser } from '$app/environment';

export async function load() {
    const ndk = get(ndkStore);
    ndk.connect()
        .then(() => {
            // console.log('connected');
        })
        .catch((e) => {
            console.error(e);
        });

    return {};
}

export const prerender = false;
export const ssr = false;
