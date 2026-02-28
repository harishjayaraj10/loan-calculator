<script lang="ts">
	import '@fontsource/cascadia-mono/400.css';
	import '@fontsource/cascadia-mono/700.css';
	import { initStore } from '$lib/stores/projects.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		initStore();
	});
</script>

<svelte:head>
	<title>Loan Calculator</title>
	<link rel="icon" href="/favicon.svg" />
	<meta name="description" content="Home loan calculator with amortization and part payment analysis" />
</svelte:head>

<div class="app">
	{@render children()}
</div>

<style>
	:global(*) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(:root) {
		--color-primary: #00c4c5;
		--color-primary-hover: #00a8a9;
		--color-primary-light: #e6fafa;
		--color-bg: #ffffff;
		--color-surface: #f9fafb;
		--color-text: #1a1a1a;
		--color-text-secondary: #6b7280;
		--color-border: #e5e7eb;
		--color-danger: #ef4444;
		--color-danger-hover: #dc2626;
		--color-success: #10b981;
		--color-warning: #f59e0b;
		--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
		--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
		--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
		--radius-sm: 6px;
		--radius-md: 10px;
		--radius-lg: 14px;
		--font: 'Cascadia Mono', monospace;
	}

	:global(body) {
		font-family: var(--font);
		background: var(--color-surface);
		color: var(--color-text);
		line-height: 1.6;
		-webkit-font-smoothing: antialiased;
	}

	:global(input, select, button, textarea) {
		font-family: var(--font);
		font-size: 0.875rem;
	}

	:global(button) {
		cursor: pointer;
		border: none;
		background: none;
	}

	:global(a) {
		color: var(--color-primary);
		text-decoration: none;
	}

	.app {
		min-height: 100vh;
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 1rem;
	}
</style>
