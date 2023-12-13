<script lang="ts">
    export let dialog: any;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<dialog class="bg-[#212121] text-white" bind:this={dialog} on:click|self={() => dialog.close()}>
    <slot />
</dialog>

<style lang="postcss">
    dialog::backdrop {
    }
</style>
