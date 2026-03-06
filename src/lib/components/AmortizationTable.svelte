<script lang="ts">
	import type { LoanProject } from '$lib/types';
	import { generateAmortization, getPaidEMIs } from '$lib/utils/calculations';
	import { formatCurrency, formatMonthYear } from '$lib/utils/formatters';

	let { project }: { project: LoanProject } = $props();

	let schedule = $derived(generateAmortization(project, true));
	let paidCount = $derived(getPaidEMIs(project));

	let stepUpMonths = $derived(
		new Set((project.stepUpEmis || []).map((s) => `${s.year}-${s.month}`))
	);
</script>

<div class="table-wrapper">
	<table>
		<thead>
			<tr>
				<th>#</th>
				<th>Month</th>
				<th>Opening Bal.</th>
				<th>EMI</th>
				<th>Interest</th>
				<th>Principal</th>
				<th>Part Pmt.</th>
				<th>Step Up</th>
				<th>Closing Bal.</th>
			</tr>
		</thead>
		<tbody>
			{#each schedule as row, i}
				{@const isStepUp = stepUpMonths.has(`${row.year}-${row.month}`)}
				<tr class:paid={i < paidCount} class:has-part-payment={row.partPayment > 0} class:has-step-up={isStepUp}>
					<td class="num">{row.monthIndex + 1}</td>
					<td class="month">{formatMonthYear(row.month, row.year)}</td>
					<td class="amount">{formatCurrency(row.openingBalance)}</td>
					<td class="amount">{formatCurrency(row.emi)}</td>
					<td class="amount">{formatCurrency(row.interest)}</td>
					<td class="amount">{formatCurrency(row.principal)}</td>
					<td class="amount part-payment">{row.partPayment > 0 ? formatCurrency(row.partPayment) : '—'}</td>
					<td class="amount step-up">{isStepUp ? formatCurrency(row.emi) : '—'}</td>
					<td class="amount">{formatCurrency(row.closingBalance)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-wrapper {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-bg);
		box-shadow: var(--shadow-sm);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.75rem;
		white-space: nowrap;
	}

	th {
		text-align: left;
		padding: 0.75rem 0.625rem;
		background: var(--color-surface);
		color: var(--color-text-secondary);
		font-weight: 700;
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border-bottom: 1px solid var(--color-border);
		position: sticky;
		top: 0;
		z-index: 1;
	}

	td {
		padding: 0.5rem 0.625rem;
		border-bottom: 1px solid var(--color-border);
	}

	tr:last-child td {
		border-bottom: none;
	}

	.num {
		color: var(--color-text-secondary);
		width: 3rem;
	}

	.month {
		font-weight: 700;
	}

	.amount {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.part-payment {
		color: var(--color-primary);
		font-weight: 700;
	}

	.paid {
		background: var(--color-primary-light);
	}

	.has-part-payment {
		border-left: 3px solid var(--color-primary);
	}

	.has-step-up {
		border-left: 3px solid var(--color-warning);
	}

	.has-part-payment.has-step-up {
		border-left: 3px solid var(--color-primary);
		border-right: 3px solid var(--color-warning);
	}

	.step-up {
		color: var(--color-warning);
		font-weight: 700;
	}

	@media (max-width: 640px) {
		table {
			font-size: 0.625rem;
		}

		th {
			padding: 0.5rem 0.375rem;
			font-size: 0.5625rem;
		}

		td {
			padding: 0.375rem 0.375rem;
		}

		.num {
			width: 2rem;
		}
	}
</style>
