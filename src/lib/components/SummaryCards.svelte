<script lang="ts">
	import type { LoanProject } from '$lib/types';
	import { calculateEMI, generateAmortization, getPaidEMIs } from '$lib/utils/calculations';
	import { formatCurrency, formatMonthYear } from '$lib/utils/formatters';
	import { onMount } from 'svelte';

	let { project }: { project: LoanProject } = $props();

	let calculatedEmi = $derived(calculateEMI(project.principal, project.annualRate, project.tenureYears));
	let emi = $derived(project.emiOverride || calculatedEmi);
	let schedule = $derived(generateAmortization(project, true));
	let totalInterest = $derived(schedule.reduce((s, r) => s + r.interest, 0));
	let totalPayment = $derived(schedule.reduce((s, r) => s + r.emi + r.partPayment, 0));
	let paidEMIs = $derived(getPaidEMIs(project));
	let totalMonths = $derived(schedule.length);
	let remainingEMIs = $derived(Math.max(totalMonths - paidEMIs, 0));
	let lastRow = $derived(schedule[schedule.length - 1]);
	let endDate = $derived(lastRow ? formatMonthYear(lastRow.month, lastRow.year) : '—');

	type Card = { label: string; target: number; format: (n: number) => string; suffix?: string };

	const cards: Card[] = $derived([
		{ label: 'Monthly EMI', target: emi, format: formatCurrency },
		{ label: 'Total Interest', target: totalInterest, format: formatCurrency },
		{ label: 'Total Payment', target: totalPayment, format: formatCurrency },
		{ label: 'Paid EMIs', target: paidEMIs, format: (n: number) => String(Math.round(n)) },
		{ label: 'Remaining', target: remainingEMIs, format: (n: number) => String(Math.round(n)), suffix: ' months' },
		{ label: 'End Date', target: 0, format: () => endDate }
	]);

	let progress = $state(0);
	let hasAnimated = false;

	onMount(() => {
		if (hasAnimated) return;
		hasAnimated = true;
		const duration = 800;
		const start = performance.now();
		function tick(now: number) {
			const t = Math.min((now - start) / duration, 1);
			progress = t < 1 ? t * (2 - t) : 1; // easeOut
			if (t < 1) requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
	});

	function displayValue(card: Card): string {
		if (card.label === 'End Date') return card.format(0);
		const val = card.target * progress;
		return card.format(val) + (card.suffix ?? '');
	}
</script>

<div class="summary-grid">
	{#each cards as card}
		<div class="summary-card">
			<span class="label">{card.label}</span>
			<span class="value">{displayValue(card)}</span>
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
