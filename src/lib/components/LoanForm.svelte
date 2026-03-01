<script lang="ts">
	import type { LoanProject } from '$lib/types';
	import { updateProject } from '$lib/stores/projects.svelte';
	import { calculateEMI } from '$lib/utils/calculations';
	import { formatCurrency } from '$lib/utils/formatters';
	import { untrack } from 'svelte';

	let { project }: { project: LoanProject } = $props();

	let editing = $state(false);

	let name = $state(untrack(() => project.name));
	let principal = $state(untrack(() => project.principal));
	let annualRate = $state(untrack(() => project.annualRate));
	let tenureYears = $state(untrack(() => project.tenureYears));
	let startDate = $state(untrack(() => `${project.startYear}-${String(project.startMonth).padStart(2, '0')}`));
	let emiMode = $state<'calculate' | 'manual'>(untrack(() => project.emiOverride ? 'manual' : 'calculate'));
	let emiOverrideStr = $state(untrack(() => project.emiOverride?.toString() ?? ''));

	let calculatedEmi = $derived(calculateEMI(Number(principal) || 0, Number(annualRate) || 0, Number(tenureYears) || 1));
	let displayEmi = $derived(project.emiOverride || calculateEMI(project.principal, project.annualRate, project.tenureYears));

	$effect(() => {
		name = project.name;
		principal = project.principal;
		annualRate = project.annualRate;
		tenureYears = project.tenureYears;
		startDate = `${project.startYear}-${String(project.startMonth).padStart(2, '0')}`;
		emiMode = project.emiOverride ? 'manual' : 'calculate';
		emiOverrideStr = project.emiOverride?.toString() ?? '';
	});

	function startEdit() {
		editing = true;
	}

	function save() {
		if (emiMode === 'manual' && !emiOverrideStr) return;
		const emiOverride = emiMode === 'manual' && emiOverrideStr ? Number(emiOverrideStr) : undefined;
		const [sYear, sMonth] = startDate.split('-').map(Number);
		updateProject(project.id, {
			name,
			principal: Number(principal),
			annualRate: Number(annualRate),
			tenureYears: Number(tenureYears),
			startMonth: sMonth,
			startYear: sYear,
			emiOverride
		});
		editing = false;
	}

	function cancel() {
		name = project.name;
		principal = project.principal;
		annualRate = project.annualRate;
		tenureYears = project.tenureYears;
		startDate = `${project.startYear}-${String(project.startMonth).padStart(2, '0')}`;
		emiMode = project.emiOverride ? 'manual' : 'calculate';
		emiOverrideStr = project.emiOverride?.toString() ?? '';
		editing = false;
	}

	const formatStartDate = (m: number, y: number) => {
		const date = new Date(y, m - 1);
		return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
	};
</script>

<div class="form-card">
	<div class="form-header">
		<h3 class="form-heading">Loan Details</h3>
		{#if !editing}
			<button type="button" class="btn-edit" onclick={startEdit}>Edit</button>
		{/if}
	</div>

	{#if editing}
		<form onsubmit={(e) => { e.preventDefault(); save(); }}>
			<div class="form-grid">
				<div class="field full">
					<label for="edit-name">Project Name</label>
					<input id="edit-name" type="text" bind:value={name} required />
				</div>
				<div class="field">
					<label for="edit-principal">Loan Amount</label>
					<input id="edit-principal" type="number" bind:value={principal} min="1" required />
				</div>
				<div class="field">
					<label for="edit-rate">Interest Rate (%)</label>
					<input id="edit-rate" type="number" bind:value={annualRate} step="0.01" min="0.01" required />
				</div>
				<div class="field">
					<label for="edit-tenure">Tenure (Years)</label>
					<input id="edit-tenure" type="number" bind:value={tenureYears} min="1" max="40" required />
				</div>
				<div class="field">
					<label for="edit-start-date">Start Month</label>
					<input id="edit-start-date" type="month" bind:value={startDate} min="2000-01" max="2050-12" />
				</div>
			</div>

			<div class="emi-mode-section">
				<span class="emi-mode-label">Monthly EMI</span>
				<div class="emi-toggle">
					<button
						type="button"
						class="emi-option"
						class:active={emiMode === 'calculate'}
						onclick={() => emiMode = 'calculate'}
					>Calculate for me</button>
					<button
						type="button"
						class="emi-option"
						class:active={emiMode === 'manual'}
						onclick={() => emiMode = 'manual'}
					>I know my EMI</button>
				</div>
				{#if emiMode === 'manual'}
					<input
						id="edit-emi-override"
						type="number"
						bind:value={emiOverrideStr}
						step="1"
						min="1"
						placeholder="Enter your bank's EMI amount"
						required
					/>
				{:else}
					<div class="calculated-emi">{formatCurrency(calculatedEmi)}</div>
				{/if}
			</div>

			<div class="form-actions">
				<button type="button" class="btn btn-cancel" onclick={cancel}>Cancel</button>
				<button type="submit" class="btn btn-save">Save</button>
			</div>
		</form>
	{:else}
		<div class="details-grid">
			<div class="detail">
				<span class="detail-label">Loan Amount</span>
				<span class="detail-value">{formatCurrency(project.principal)}</span>
			</div>
			<div class="detail">
				<span class="detail-label">Interest Rate</span>
				<span class="detail-value">{project.annualRate}%</span>
			</div>
			<div class="detail">
				<span class="detail-label">Tenure</span>
				<span class="detail-value">{project.tenureYears} years</span>
			</div>
			<div class="detail">
				<span class="detail-label">Start Date</span>
				<span class="detail-value">{formatStartDate(project.startMonth, project.startYear)}</span>
			</div>
			<div class="detail">
				<span class="detail-label">Monthly EMI</span>
				<span class="detail-value">
					{formatCurrency(displayEmi)}
					{#if project.emiOverride}
						<span class="emi-badge">Bank EMI</span>
					{:else}
						<span class="emi-badge calculated">Calculated</span>
					{/if}
				</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.form-card {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		box-shadow: var(--shadow-sm);
	}

	.form-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.form-heading {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.btn-edit {
		padding: 0.375rem 0.875rem;
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-primary);
		border: 1px solid var(--color-primary);
		background: transparent;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-edit:hover {
		background: var(--color-primary);
		color: white;
	}

	/* Read-only details */
	.details-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.detail {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.detail-label {
		font-size: 0.6875rem;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 700;
	}

	.detail-value {
		font-size: 0.875rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.emi-badge {
		font-size: 0.625rem;
		font-weight: 700;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		background: var(--color-primary);
		color: white;
		text-transform: uppercase;
		letter-spacing: 0.3px;
	}

	.emi-badge.calculated {
		background: var(--color-text-secondary);
	}

	/* Edit form */
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.field.full {
		grid-column: 1 / -1;
	}

	.field label {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		font-weight: 700;
	}

	.field input,
	.field select {
		padding: 0.625rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg);
		font-size: 0.875rem;
		transition: border-color 0.15s;
	}

	.field input:focus,
	.field select:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.emi-mode-section {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.emi-mode-label {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		font-weight: 700;
	}

	.emi-toggle {
		display: flex;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.emi-option {
		flex: 1;
		padding: 0.5rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 600;
		background: var(--color-bg);
		color: var(--color-text-secondary);
		border: none;
		cursor: pointer;
		transition: all 0.15s;
	}

	.emi-option:first-child {
		border-right: 1px solid var(--color-border);
	}

	.emi-option.active {
		background: var(--color-primary);
		color: white;
	}

	.emi-mode-section input {
		padding: 0.625rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg);
		font-size: 0.875rem;
		transition: border-color 0.15s;
	}

	.emi-mode-section input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.calculated-emi {
		font-size: 0.875rem;
		font-weight: 700;
		padding: 0.625rem 0.75rem;
		background: var(--color-surface);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
	}

	.form-actions {
		margin-top: 1.25rem;
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.btn {
		padding: 0.625rem 1.25rem;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-weight: 700;
		transition: all 0.15s;
	}

	.btn-save {
		background: var(--color-primary);
		color: white;
	}

	.btn-save:hover {
		background: var(--color-primary-hover);
	}

	.btn-cancel {
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border);
	}

	.btn-cancel:hover {
		border-color: var(--color-text-secondary);
	}

	@media (max-width: 640px) {
		.form-grid,
		.details-grid {
			grid-template-columns: 1fr;
		}

		.field.full {
			grid-column: 1;
		}
	}
</style>
