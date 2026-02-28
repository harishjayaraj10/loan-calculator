<script lang="ts">
	import type { LoanProject } from '$lib/types';
	import { calculateEMI, getPaidEMIs } from '$lib/utils/calculations';
	import { formatCurrency } from '$lib/utils/formatters';

	let { project, onclick, ondelete }: {
		project: LoanProject;
		onclick: () => void;
		ondelete: () => void;
	} = $props();

	let calculatedEmi = $derived(calculateEMI(project.principal, project.annualRate, project.tenureYears));
	let emi = $derived(project.emiOverride || calculatedEmi);
	let totalMonths = $derived(project.tenureYears * 12);
	let paidMonths = $derived(getPaidEMIs(project));
	let progress = $derived(Math.min((paidMonths / totalMonths) * 100, 100));
</script>

<div class="card" role="button" tabindex="0" onclick={onclick} onkeydown={(e) => e.key === 'Enter' && onclick()}>
	<div class="card-header">
		<h3 class="card-title">{project.name}</h3>
		<button class="delete-btn" onclick={(e) => { e.stopPropagation(); ondelete(); }} title="Delete project">
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
				<path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			</svg>
		</button>
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
