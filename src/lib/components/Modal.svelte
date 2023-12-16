<script lang="ts">
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    export let dialog: any;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<dialog class="bg-[#212121] text-white" bind:this={dialog} on:click|self={() => dialog.close()}>
    <slot />
</dialog>

<style lang="postcss">
    dialog::backdrop {
    }
</style>
