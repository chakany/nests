<script lang="ts">
    export let borderColor = 'border-[#4F4F4F]';
    export let padding: string = '';
</script>

<div class="flex w-12 h-12 rounded-full border-2 {borderColor} text-2xl items-center {padding}">
    <slot />
</div>
