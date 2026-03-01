<script lang="ts">
	let {
		tabs,
		activeTab,
		onchange
	}: {
		tabs: { id: string; label: string }[];
		activeTab: string;
		onchange: (id: string) => void;
	} = $props();
</script>

<nav class="tab-bar">
	{#each tabs as tab}
		<button class="tab" class:active={activeTab === tab.id} onclick={() => onchange(tab.id)}>
			{tab.label}
		</button>
	{/each}
</nav>

<style>
	.tab-bar {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid var(--color-border);
		margin-bottom: 1.5rem;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.tab {
		padding: 0.625rem 1rem;
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
		border-bottom: 2px solid transparent;
		transition: all 0.15s;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.tab:hover {
		color: var(--color-text);
	}

	.tab.active {
		color: var(--color-primary);
		border-bottom-color: var(--color-primary);
		font-weight: 700;
	}
</style>
