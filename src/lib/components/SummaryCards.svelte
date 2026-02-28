<script lang="ts">
	import type { LoanProject } from '$lib/types';
	import { calculateEMI, generateAmortization, getPaidEMIs } from '$lib/utils/calculations';
	import { formatCurrency, formatMonthYear } from '$lib/utils/formatters';

	let { project }: { project: LoanProject } = $props();

	let emi = $derived(calculateEMI(project.principal, project.annualRate, project.tenureYears));
	let schedule = $derived(generateAmortization(project, true));
	let totalInterest = $derived(schedule.reduce((s, r) => s + r.interest, 0));
	let totalPayment = $derived(schedule.reduce((s, r) => s + r.emi + r.partPayment, 0));
	let paidEMIs = $derived(getPaidEMIs(project));
	let totalMonths = $derived(schedule.length);
	let remainingEMIs = $derived(Math.max(totalMonths - paidEMIs, 0));
	let lastRow = $derived(schedule[schedule.length - 1]);
	let endDate = $derived(lastRow ? formatMonthYear(lastRow.month, lastRow.year) : '—');

	const cards = $derived([
		{ label: 'Monthly EMI', value: formatCurrency(emi) },
		{ label: 'Total Interest', value: formatCurrency(totalInterest) },
		{ label: 'Total Payment', value: formatCurrency(totalPayment) },
		{ label: 'Paid EMIs', value: `${paidEMIs}` },
		{ label: 'Remaining', value: `${remainingEMIs} months` },
		{ label: 'End Date', value: endDate }
	]);
</script>

<div class="summary-grid">
	{#each cards as card}
		<div class="summary-card">
			<span class="label">{card.label}</span>
			<span class="value">{card.value}</span>
		</div>
	{/each}
</div>

<style>
	.summary-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.summary-card {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		box-shadow: var(--shadow-sm);
	}

	.label {
		font-size: 0.6875rem;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 700;
	}

	.value {
		font-size: 0.9375rem;
		font-weight: 700;
	}

	@media (max-width: 640px) {
		.summary-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
