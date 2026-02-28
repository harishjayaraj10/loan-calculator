<script lang="ts">
	import type { LoanProject } from '$lib/types';
	import { updateProject } from '$lib/stores/projects.svelte';
	import { calculateEMI } from '$lib/utils/calculations';
	import { untrack } from 'svelte';

	let { project }: { project: LoanProject } = $props();

	let name = $state(untrack(() => project.name));
	let principal = $state(untrack(() => project.principal));
	let annualRate = $state(untrack(() => project.annualRate));
	let tenureYears = $state(untrack(() => project.tenureYears));
	let startMonth = $state(untrack(() => project.startMonth));
	let startYear = $state(untrack(() => project.startYear));
	let emiOverrideStr = $state(untrack(() => project.emiOverride?.toString() ?? ''));
	let preEmiInterestStr = $state(untrack(() => project.preEmiInterest?.toString() ?? ''));
	let preEmiMonth = $state(untrack(() => project.preEmiMonth ?? 1));
	let preEmiYear = $state(untrack(() => project.preEmiYear ?? new Date().getFullYear()));
	let showAdvanced = $state(false);

	let calculatedEmi = $derived(calculateEMI(Number(principal) || 0, Number(annualRate) || 0, Number(tenureYears) || 1));

	$effect(() => {
		name = project.name;
		principal = project.principal;
		annualRate = project.annualRate;
		tenureYears = project.tenureYears;
		startMonth = project.startMonth;
		startYear = project.startYear;
		emiOverrideStr = project.emiOverride?.toString() ?? '';
		preEmiInterestStr = project.preEmiInterest?.toString() ?? '';
		preEmiMonth = project.preEmiMonth ?? 1;
		preEmiYear = project.preEmiYear ?? new Date().getFullYear();
	});

	function save() {
		const emiOverride = emiOverrideStr ? Number(emiOverrideStr) : undefined;
		const preEmiInterest = preEmiInterestStr ? Number(preEmiInterestStr) : undefined;
		updateProject(project.id, {
			name,
			principal: Number(principal),
			annualRate: Number(annualRate),
			tenureYears: Number(tenureYears),
			startMonth: Number(startMonth),
			startYear: Number(startYear),
			emiOverride,
			preEmiInterest,
			preEmiMonth: preEmiInterest ? Number(preEmiMonth) : undefined,
			preEmiYear: preEmiInterest ? Number(preEmiYear) : undefined
		});
	}

	const months = [
		{ value: 1, label: 'Jan' }, { value: 2, label: 'Feb' },
		{ value: 3, label: 'Mar' }, { value: 4, label: 'Apr' },
		{ value: 5, label: 'May' }, { value: 6, label: 'Jun' },
		{ value: 7, label: 'Jul' }, { value: 8, label: 'Aug' },
		{ value: 9, label: 'Sep' }, { value: 10, label: 'Oct' },
		{ value: 11, label: 'Nov' }, { value: 12, label: 'Dec' }
	];
</script>

<div class="form-card">
	<h3 class="form-heading">Loan Details</h3>
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
				<label for="edit-start-month">Start Month</label>
				<select id="edit-start-month" bind:value={startMonth}>
					{#each months as m}
						<option value={m.value}>{m.label}</option>
					{/each}
				</select>
			</div>
			<div class="field">
				<label for="edit-start-year">Start Year</label>
				<input id="edit-start-year" type="number" bind:value={startYear} min="2000" max="2050" />
			</div>
		</div>

		<button type="button" class="advanced-toggle" onclick={() => showAdvanced = !showAdvanced}>
			{showAdvanced ? 'Hide' : 'Show'} Advanced Options
		</button>

		{#if showAdvanced}
			<div class="form-grid" style="margin-top: 1rem;">
				<div class="field full">
					<label for="edit-emi-override">EMI Override</label>
					<input id="edit-emi-override" type="number" bind:value={emiOverrideStr} step="1" min="0" placeholder="Calculated: {Math.round(calculatedEmi)}" />
					<span class="field-hint">Leave empty to use calculated EMI</span>
				</div>
				<div class="field full">
					<label for="edit-pre-emi">Pre-EMI Interest</label>
					<input id="edit-pre-emi" type="number" bind:value={preEmiInterestStr} step="1" min="0" placeholder="Optional" />
					<span class="field-hint">Partial-month interest before regular EMIs began</span>
				</div>
				{#if preEmiInterestStr}
					<div class="field">
						<label for="edit-pre-emi-month">Pre-EMI Month</label>
						<select id="edit-pre-emi-month" bind:value={preEmiMonth}>
							{#each months as m}
								<option value={m.value}>{m.label}</option>
							{/each}
						</select>
					</div>
					<div class="field">
						<label for="edit-pre-emi-year">Pre-EMI Year</label>
						<input id="edit-pre-emi-year" type="number" bind:value={preEmiYear} min="2000" max="2050" />
					</div>
				{/if}
			</div>
		{/if}

		<div class="form-actions">
			<button type="submit" class="btn btn-primary">Save Changes</button>
		</div>
	</form>
</div>

<style>
	.form-card {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		box-shadow: var(--shadow-sm);
	}

	.form-heading {
		font-size: 0.875rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

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

	.advanced-toggle {
		display: block;
		margin-top: 1rem;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-primary);
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
	}

	.advanced-toggle:hover {
		text-decoration: underline;
	}

	.field-hint {
		font-size: 0.6875rem;
		color: var(--color-text-secondary);
	}

	.form-actions {
		margin-top: 1.25rem;
		display: flex;
		justify-content: flex-end;
	}

	.btn-primary {
		padding: 0.625rem 1.25rem;
		border-radius: var(--radius-sm);
		background: var(--color-primary);
		color: white;
		font-size: 0.8125rem;
		font-weight: 700;
		transition: background 0.15s;
	}

	.btn-primary:hover {
		background: var(--color-primary-hover);
	}

	@media (max-width: 640px) {
		.form-grid {
			grid-template-columns: 1fr;
		}

		.field.full {
			grid-column: 1;
		}
	}
</style>
