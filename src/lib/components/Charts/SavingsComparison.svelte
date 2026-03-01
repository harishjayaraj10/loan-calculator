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
	let tooltipEl: HTMLDivElement;
	let chartWidth = $state(0);
	const chartHeight = 300;

	let hasAnimated = false;
	let isVisible = $state(false);

	onMount(() => {
		const resizeObs = new ResizeObserver((entries) => {
			for (const entry of entries) {
				chartWidth = entry.contentRect.width;
			}
		});
		resizeObs.observe(wrapperEl);

		const intersectObs = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) {
				isVisible = true;
				intersectObs.disconnect();
			}
		}, { rootMargin: '100px' });
		intersectObs.observe(wrapperEl);

		return () => {
			resizeObs.disconnect();
			intersectObs.disconnect();
		};
	});

	function formatVal(label: string, val: number): string {
		if (label.includes('Interest')) return formatCurrency(val);
		return String(val);
	}

	$effect(() => {
		if (!svgEl || chartWidth <= 0 || !savings || !isVisible) return;
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

		const tooltip = d3.select(tooltipEl);

		const groups = g.selectAll('.group')
			.data(data)
			.join('g')
			.attr('transform', (d) => `translate(${x0(d.label)},0)`);

		const animate = !hasAnimated;

		// Original bars
		const origBars = groups.append('rect')
			.attr('x', x1('original')!)
			.attr('y', animate ? h : (d) => y(d.original))
			.attr('width', x1.bandwidth())
			.attr('height', animate ? 0 : (d) => h - y(d.original))
			.attr('fill', '#e5e7eb')
			.attr('rx', 4)
			.style('cursor', 'pointer')
			.on('mouseenter', function(event: MouseEvent, d) {
				d3.select(this).transition('hover').duration(150).attr('opacity', 0.8);
				tooltip.html(`<strong>${d.label}</strong><br>Original: ${formatVal(d.label, d.original)}`)
					.style('opacity', '1');
				const barX = margin.left + (x0(d.label) || 0) + (x1('original') || 0) + x1.bandwidth() / 2;
				const barTop = margin.top + y(d.original);
				const tooltipH = tooltipEl.offsetHeight;
				const topPos = barTop - tooltipH - 8 < 0 ? barTop + 8 : barTop - tooltipH - 8;
				tooltip.style('left', `${barX}px`)
					.style('top', `${topPos}px`)
					.style('transform', 'translateX(-50%)');
			})
			.on('mouseleave', function() {
				d3.select(this).transition('hover').duration(150).attr('opacity', 1);
				tooltip.style('opacity', '0');
			});

		if (animate) {
			origBars.transition('grow')
				.duration(600)
				.delay(100)
				.ease(d3.easeCubicOut)
				.attr('y', (d) => y(d.original))
				.attr('height', (d) => h - y(d.original));
		}

		// Reduced bars
		const reducedBars = groups.append('rect')
			.attr('x', x1('reduced')!)
			.attr('y', animate ? h : (d) => y(d.reduced))
			.attr('width', x1.bandwidth())
			.attr('height', animate ? 0 : (d) => h - y(d.reduced))
			.attr('fill', '#00c4c5')
			.attr('rx', 4)
			.style('cursor', 'pointer')
			.on('mouseenter', function(event: MouseEvent, d) {
				d3.select(this).transition('hover').duration(150).attr('opacity', 0.8);
				tooltip.html(`<strong>${d.label}</strong><br>With Part Pmts: ${formatVal(d.label, d.reduced)}`)
					.style('opacity', '1');
				const barX = margin.left + (x0(d.label) || 0) + (x1('reduced') || 0) + x1.bandwidth() / 2;
				const barTop = margin.top + y(d.reduced);
				const tooltipH = tooltipEl.offsetHeight;
				const topPos = barTop - tooltipH - 8 < 0 ? barTop + 8 : barTop - tooltipH - 8;
				tooltip.style('left', `${barX}px`)
					.style('top', `${topPos}px`)
					.style('transform', 'translateX(-50%)');
			})
			.on('mouseleave', function() {
				d3.select(this).transition('hover').duration(150).attr('opacity', 1);
				tooltip.style('opacity', '0');
			});

		if (animate) {
			reducedBars.transition('grow')
				.duration(600)
				.delay(250)
				.ease(d3.easeCubicOut)
				.attr('y', (d) => y(d.reduced))
				.attr('height', (d) => h - y(d.reduced));
		}

		hasAnimated = true;
	});
</script>

<ChartContainer title="Savings Comparison">
	<div class="chart-wrapper" bind:this={wrapperEl}>
		<svg bind:this={svgEl}></svg>
		<div class="tooltip" bind:this={tooltipEl}></div>
	</div>
	<div class="legend">
		<span class="legend-item">
			<span class="legend-swatch original"></span>
			Original
		</span>
		<span class="legend-item">
			<span class="legend-swatch reduced"></span>
			With Part Pmts
		</span>
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
	.chart-wrapper {
		position: relative;
	}

	.tooltip {
		position: absolute;
		background: rgba(17, 24, 39, 0.9);
		color: white;
		padding: 0.5rem 0.625rem;
		border-radius: 6px;
		font-size: 0.6875rem;
		line-height: 1.4;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.15s;
		white-space: nowrap;
		z-index: 10;
	}

	.legend {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		padding-top: 0.75rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.6875rem;
		color: #6b7280;
		font-weight: 600;
	}

	.legend-swatch {
		display: inline-block;
		width: 12px;
		height: 12px;
		border-radius: 2px;
	}

	.legend-swatch.original {
		background: #e5e7eb;
	}

	.legend-swatch.reduced {
		background: #00c4c5;
	}

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
