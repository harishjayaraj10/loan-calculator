<script lang="ts">
	import type { LoanProject } from '$lib/types';
	import { calculateSavings } from '$lib/utils/calculations';
	import { formatCurrency, formatMonthYear } from '$lib/utils/formatters';
	import ChartContainer from './ChartContainer.svelte';
	import * as d3 from 'd3';
	import { onMount } from 'svelte';

	let { project }: { project: LoanProject } = $props();

	let savings = $derived(calculateSavings(project));

	let svgEl: SVGSVGElement;
	let wrapperEl: HTMLDivElement;
	let chartWidth = $state(0);
	const chartHeight = 300;

	onMount(() => {
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				chartWidth = entry.contentRect.width;
			}
		});
		observer.observe(wrapperEl);
		return () => observer.disconnect();
	});

	$effect(() => {
		if (!svgEl || chartWidth <= 0 || !savings) return;
		const width = chartWidth;
		const height = chartHeight;

		const margin = { top: 20, right: 20, bottom: 40, left: 70 };
		const w = width - margin.left - margin.right;
		const h = height - margin.top - margin.bottom;

		const sel = d3.select(svgEl);
		sel.selectAll('*').remove();
		sel.attr('width', width).attr('height', height);

		const g = sel.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

		const data = [
			{ label: 'Tenure (months)', original: savings.originalTenureMonths, reduced: savings.reducedTenureMonths },
			{ label: 'Total Interest', original: savings.originalTotalInterest, reduced: savings.reducedTotalInterest }
		];

		const x0 = d3.scaleBand().domain(data.map((d) => d.label)).range([0, w]).padding(0.3);
		const x1 = d3.scaleBand().domain(['original', 'reduced']).range([0, x0.bandwidth()]).padding(0.1);

		const yMax = d3.max(data, (d) => Math.max(d.original, d.reduced)) || 0;
		const y = d3.scaleLinear().domain([0, yMax]).nice().range([h, 0]);

		g.append('g')
			.attr('transform', `translate(0,${h})`)
			.call(d3.axisBottom(x0))
			.selectAll('text')
			.style('font-size', '10px')
			.style('font-family', 'var(--font)');

		g.append('g')
			.call(d3.axisLeft(y).ticks(5).tickFormat((d) => {
				const val = d as number;
				if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
				if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
				if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
				return String(val);
			}))
			.selectAll('text')
			.style('font-size', '10px')
			.style('font-family', 'var(--font)');

		const groups = g.selectAll('.group')
			.data(data)
			.join('g')
			.attr('transform', (d) => `translate(${x0(d.label)},0)`);

		groups.append('rect')
			.attr('x', x1('original')!)
			.attr('y', (d) => y(d.original))
			.attr('width', x1.bandwidth())
			.attr('height', (d) => h - y(d.original))
			.attr('fill', '#e5e7eb')
			.attr('rx', 4);

		groups.append('rect')
			.attr('x', x1('reduced')!)
			.attr('y', (d) => y(d.reduced))
			.attr('width', x1.bandwidth())
			.attr('height', (d) => h - y(d.reduced))
			.attr('fill', '#00c4c5')
			.attr('rx', 4);

		const legend = g.append('g').attr('transform', `translate(${w - 140}, 0)`);
		legend.append('rect').attr('width', 12).attr('height', 12).attr('rx', 2).attr('fill', '#e5e7eb');
		legend.append('text').attr('x', 18).attr('y', 10).text('Original')
			.style('font-size', '10px').style('font-family', 'var(--font)').attr('fill', '#6b7280');

		legend.append('rect').attr('y', 18).attr('width', 12).attr('height', 12).attr('rx', 2).attr('fill', '#00c4c5');
		legend.append('text').attr('x', 18).attr('y', 28).text('With Part Pmts')
			.style('font-size', '10px').style('font-family', 'var(--font)').attr('fill', '#6b7280');
	});
</script>

<ChartContainer title="Savings Comparison">
	<div bind:this={wrapperEl}>
		<svg bind:this={svgEl}></svg>
	</div>
</ChartContainer>

{#if savings.monthsSaved > 0 || savings.interestSaved > 0}
	<div class="savings-summary">
		<div class="savings-card highlight">
			<span class="savings-label">Interest Saved</span>
			<span class="savings-value">{formatCurrency(savings.interestSaved)}</span>
		</div>
		<div class="savings-card">
			<span class="savings-label">Months Saved</span>
			<span class="savings-value">{savings.monthsSaved}</span>
		</div>
		<div class="savings-card">
			<span class="savings-label">New End Date</span>
			<span class="savings-value">{formatMonthYear(savings.reducedEndDate.month, savings.reducedEndDate.year)}</span>
		</div>
		<div class="savings-card">
			<span class="savings-label">Original End Date</span>
			<span class="savings-value">{formatMonthYear(savings.originalEndDate.month, savings.originalEndDate.year)}</span>
		</div>
	</div>
{/if}

<style>
	.savings-summary {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.savings-card {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		box-shadow: var(--shadow-sm);
	}

	.savings-card.highlight {
		border-color: var(--color-primary);
		background: var(--color-primary-light);
	}

	.savings-label {
		font-size: 0.6875rem;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 700;
	}

	.savings-value {
		font-size: 1rem;
		font-weight: 700;
	}

	@media (max-width: 480px) {
		.savings-summary {
			grid-template-columns: 1fr;
		}
	}
</style>
