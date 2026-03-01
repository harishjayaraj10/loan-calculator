<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title = 'Loan Calculator',
		showBack = false,
		hideTitle = false,
		onback,
		children
	}: {
		title?: string;
		showBack?: boolean;
		hideTitle?: boolean;
		onback?: () => void;
		children?: Snippet;
	} = $props();
</script>

<header class="header">
	<div class="header-left">
		{#if showBack}
			<button class="back-btn" onclick={onback}>
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
					<path
						d="M12.5 15L7.5 10L12.5 5"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				Back
			</button>
		{/if}
	</div>
	{#if !hideTitle}
		<h1 class="header-title">{title}</h1>
	{/if}
	<div class="header-right">
		{#if children}{@render children()}{/if}
	</div>
</header>

<style>
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 0;
		gap: 1rem;
		position: relative;
	}

	.header-left {
		min-width: 0;
	}

	.header-title {
		font-size: 1.125rem;
		font-weight: 700;
		text-align: center;
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		pointer-events: none;
		white-space: nowrap;
	}

	.header-right {
		margin-left: auto;
		display: flex;
		justify-content: flex-end;
	}

	.back-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--color-text-secondary);
		font-size: 0.875rem;
		transition: color 0.15s;
	}

	.back-btn:hover {
		color: var(--color-text);
	}
</style>
