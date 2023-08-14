<script lang="ts">
    import NDK, { type NDKUser } from "@nostr-dev-kit/ndk";
    import { Avatar, Name } from "@nostr-dev-kit/ndk-svelte-components";
    import { RoomMember } from "$lib/utils/constants";

    export let ndk: NDK
    export let profile: RoomMember
</script>

<div class="flex flex-col">
    <div class="w-14 aspect-square">
        <Avatar ndk={ndk} npub={profile.user.npub} />
    </div>
    <div>
        <Name ndk={ndk} npub={profile.user.npub} />
    </div>
    {profile.user.npub} - {profile.present ? "present" : "not present"} - {profile.handRaised ? "hand raised" : "not raised"}
</div>