<script lang="ts">
    import Icon from '$lib/components/Room/MenuBarIcon.svelte';
    import {
        faArrowRightFromBracket,
        faCog,
        faMicrophoneSlash,
        faMicrophone,
        faHand,
        faFaceSmile,
        faWalkieTalkie
    } from '@fortawesome/free-solid-svg-icons';
    import Fa from 'svelte-fa';

    // TODO: hook into audio server
    export let muted = true;
    export let handRaised = false;
    export let onStage = false;
    export let broadcastPresence: () => void;

    function toggleHand() {
        handRaised = !handRaised;
        broadcastPresence();
    }
    function toggleStage() {
        onStage = !onStage;
        broadcastPresence();
    }
</script>

<div class="flex px-4 py-2 rounded-3xl border-accent-dark bg-accent-dark gap-4">
    <Icon padding="p-2" borderColor="border-red-600">
        <Fa flip="horizontal" icon={faArrowRightFromBracket} />
    </Icon>
    <Icon padding="p-2.5">
        <Fa icon={faCog} />
    </Icon>
    <Icon
        borderColor={muted
            ? 'border-red-600 p-[0.400rem]'
            : 'border-nests-gradient border-transparent p-3'}
    >
        {#if muted}
            <Fa icon={faMicrophoneSlash} />
        {:else}
            <Fa icon={faMicrophone} />
        {/if}
    </Icon>
    <!-- TODO: make this obey permissions -->
    <Icon
        on:click={toggleStage}
        padding="p-3"
        borderColor={handRaised ? 'border-nests-gradient border-transparent' : 'border-[#4F4F4F]'}
    >
        <Fa icon={faWalkieTalkie} />
    </Icon>
    <Icon
        on:click={toggleHand}
        padding="p-2.5"
        borderColor={handRaised ? 'border-nests-gradient border-transparent' : 'border-[#4F4F4F]'}
    >
        <Fa icon={faHand} />
    </Icon>
    <Icon padding="p-2.5" borderColor={'border-[#4F4F4F]'}>
        <Fa icon={faFaceSmile} />
    </Icon>
</div>
