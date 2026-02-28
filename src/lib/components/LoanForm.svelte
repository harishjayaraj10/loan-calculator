<script lang="ts">
	import type { LoanProject } from '$lib/types';
	import { updateProject } from '$lib/stores/projects.svelte';
	import { untrack } from 'svelte';

	let { project }: { project: LoanProject } = $props();

	let name = $state(untrack(() => project.name));
	let principal = $state(untrack(() => project.principal));
	let annualRate = $state(untrack(() => project.annualRate));
	let tenureYears = $state(untrack(() => project.tenureYears));
	let startMonth = $state(untrack(() => project.startMonth));
	let startYear = $state(untrack(() => project.startYear));

	$effect(() => {
		name = project.name;
		principal = project.principal;
		annualRate = project.annualRate;
		tenureYears = project.tenureYears;
		startMonth = project.startMonth;
		startYear = project.startYear;
	});

	function save() {
		updateProject(project.id, {
			name,
			principal: Number(principal),
			annualRate: Number(annualRate),
			tenureYears: Number(tenureYears),
			startMonth: Number(startMonth),
			startYear: Number(startYear)
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
