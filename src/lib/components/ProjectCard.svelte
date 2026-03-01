<script lang="ts">
	import type { LoanProject } from '$lib/types';
	import { calculateEMI, getPaidEMIs } from '$lib/utils/calculations';
	import { formatCurrency } from '$lib/utils/formatters';

	let {
		project,
		onclick,
		ondelete,
		selectMode = false,
		deleteMode = false,
		selected = false
	}: {
		project: LoanProject;
		onclick: () => void;
		ondelete: () => void;
		selectMode?: boolean;
		deleteMode?: boolean;
		selected?: boolean;
	} = $props();

	let calculatedEmi = $derived(calculateEMI(project.principal, project.annualRate, project.tenureYears));
	let emi = $derived(project.emiOverride || calculatedEmi);
	let totalMonths = $derived(project.tenureYears * 12);
	let paidMonths = $derived(getPaidEMIs(project));
	let progress = $derived(Math.min((paidMonths / totalMonths) * 100, 100));
</script>

<div
	class="card"
	class:floating={selectMode}
	class:selected={selectMode && selected}
	class:delete-mode={deleteMode}
	role="button"
	tabindex="0"
	{onclick}
	onkeydown={(e) => e.key === 'Enter' && onclick()}
>
	{#if selectMode}
		<div class="checkbox" class:checked={selected} class:checkbox-danger={deleteMode}>
			{#if selected}
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
					<path d="M3 7L6 10L11 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			{/if}
		</div>
	{/if}
	<div class="card-header">
		<h3 class="card-title">{project.name}</h3>
		{#if !selectMode}
			<button
				class="delete-btn"
				onclick={(e) => {
					e.stopPropagation();
					ondelete();
				}}
				title="Delete project"
			>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
				</svg>
			</button>
		{/if}
	</div>
	<div class="card-body">
		<div class="stat">
			<span class="stat-label">Principal</span>
			<span class="stat-value">{formatCurrency(project.principal)}</span>
		</div>
		<div class="stat">
			<span class="stat-label">EMI</span>
			<span class="stat-value">{formatCurrency(emi)}</span>
		</div>
		<div class="stat">
			<span class="stat-label">Rate</span>
			<span class="stat-value">{project.annualRate}%</span>
		</div>
	</div>
	<div class="progress-section">
		<div class="progress-header">
			<span class="progress-label">{paidMonths}/{totalMonths} EMIs paid</span>
			<span class="progress-pct">{progress.toFixed(0)}%</span>
		</div>
		<div class="progress-bar">
			<div class="progress-fill" style="width: {progress}%"></div>
		</div>
	</div>
</div>

<style>
	.card {
		position: relative;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.25rem;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: var(--shadow-sm);
	}

	.card:hover {
		box-shadow: var(--shadow-md);
		border-color: var(--color-primary);
	}

	.card.delete-mode:hover {
		border-color: var(--color-danger);
	}

	.card.selected {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.card.selected.delete-mode {
		border-color: var(--color-danger);
		box-shadow: 0 0 0 2px var(--color-danger);
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0) rotate(0deg);
		}
		33% {
			transform: translateY(-6px) rotate(0.5deg);
		}
		66% {
			transform: translateY(3px) rotate(-0.5deg);
		}
	}

	.card.floating {
		animation: float 3s ease-in-out infinite;
		animation-delay: var(--float-delay, 0s);
	}

	.checkbox {
		position: absolute;
		top: -8px;
		left: -8px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 2px solid var(--color-border);
		background: var(--color-bg);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		z-index: 1;
		box-shadow: var(--shadow-sm);
	}

	.checkbox.checked {
		background: var(--color-primary);
		border-color: var(--color-primary);
	}

	.checkbox.checked.checkbox-danger {
		background: var(--color-danger);
		border-color: var(--color-danger);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.card-title {
		font-size: 0.9375rem;
		font-weight: 700;
	}

	.delete-btn {
		color: var(--color-text-secondary);
		padding: 0.25rem;
		border-radius: var(--radius-sm);
		transition: all 0.15s;
		flex-shrink: 0;
	}

	.delete-btn:hover {
		color: var(--color-danger);
		background: #fef2f2;
	}

	.card-body {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.stat-label {
		font-size: 0.6875rem;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.stat-value {
		font-size: 0.8125rem;
		font-weight: 700;
	}

	.progress-section {
		margin-top: 0.5rem;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.375rem;
	}

	.progress-label,
	.progress-pct {
		font-size: 0.6875rem;
		color: var(--color-text-secondary);
	}

	.progress-bar {
		height: 4px;
		background: var(--color-border);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-primary);
		border-radius: 2px;
		transition: width 0.3s ease;
	}
</style>
