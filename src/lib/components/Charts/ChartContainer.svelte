<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	let { title = '', children }: {
		title?: string;
		children?: Snippet;
	} = $props();
</script>

<div class="chart-container">
	{#if title}
		<h3 class="chart-title">{title}</h3>
	{/if}
	<div class="chart-body">
		{#if children}{@render children()}{/if}
	</div>
</div>

<style>
	.chart-container {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.25rem;
		box-shadow: var(--shadow-sm);
	}

	.chart-title {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 1rem;
	}

	.chart-body {
		width: 100%;
		overflow: hidden;
	}
</style>
