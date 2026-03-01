<script lang="ts">
	import type { LoanProject } from '$lib/types';
	import { generateAmortization } from '$lib/utils/calculations';
	import { formatCurrency, formatMonthYear } from '$lib/utils/formatters';
	import ChartContainer from './ChartContainer.svelte';
	import * as d3 from 'd3';
	import { onMount } from 'svelte';

	let { project }: { project: LoanProject } = $props();

	let schedule = $derived(generateAmortization(project, true));

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

	$effect(() => {
		if (!svgEl || chartWidth <= 0 || !schedule.length || !isVisible) return;
		const width = chartWidth;
		const height = chartHeight;

		const margin = { top: 20, right: 20, bottom: 40, left: 70 };
		const w = width - margin.left - margin.right;
		const h = height - margin.top - margin.bottom;

		const sel = d3.select(svgEl);
		sel.selectAll('*').remove();
		sel.attr('width', width).attr('height', height);

		const g = sel.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

		const x = d3.scaleLinear().domain([0, schedule.length - 1]).range([0, w]);
		const yMax = d3.max(schedule, (d) => d.interest + d.principal) || 0;
		const y = d3.scaleLinear().domain([0, yMax]).nice().range([h, 0]);

		g.append('g')
			.attr('transform', `translate(0,${h})`)
			.call(d3.axisBottom(x).ticks(Math.min(schedule.length, 10)).tickFormat((d) => {
				const idx = d as number;
				if (idx >= 0 && idx < schedule.length) {
					return formatMonthYear(schedule[idx].month, schedule[idx].year);
				}
				return '';
			}))
			.selectAll('text')
			.style('font-size', '9px')
			.style('font-family', 'var(--font)')
			.attr('transform', 'rotate(-30)')
			.style('text-anchor', 'end');

		g.append('g')
			.call(d3.axisLeft(y).ticks(5).tickFormat((d) => {
				const val = d as number;
				if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
				if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
				return String(val);
			}))
			.selectAll('text')
			.style('font-size', '10px')
			.style('font-family', 'var(--font)');

		const stackData = schedule.map((d, i) => ({
			idx: i,
			interest: d.interest,
			principal: d.principal
		}));

		const curve = d3.curveMonotoneX;

		// Blue starts covering the full area (baseline to top), then shrinks to just the principal sliver
		const areaFullFlat = d3.area<(typeof stackData)[0]>()
			.x((d) => x(d.idx)).y0(h).y1(h).curve(curve);

		const areaFull = d3.area<(typeof stackData)[0]>()
			.x((d) => x(d.idx)).y0(h).y1((d) => y(d.interest + d.principal)).curve(curve);

		const areaPrincipal = d3.area<(typeof stackData)[0]>()
			.x((d) => x(d.idx)).y0((d) => y(d.interest)).y1((d) => y(d.interest + d.principal)).curve(curve);

		const areaInterest = d3.area<(typeof stackData)[0]>()
			.x((d) => x(d.idx)).y0(h).y1((d) => y(d.interest)).curve(curve);

		// Yellow (interest)
		const yellowPath = g.append('path')
			.datum(stackData)
			.attr('fill', '#fbbf24')
			.attr('opacity', hasAnimated ? 0.7 : 0)
			.attr('d', areaInterest);

		if (hasAnimated) {
			// No animation on re-renders — draw final state directly
			g.append('path')
				.datum(stackData)
				.attr('fill', '#00c4c5')
				.attr('opacity', 0.7)
				.attr('d', areaPrincipal);
		} else {
			// Blue (principal) — rises full, shrinks to top, then yellow fills below
			g.append('path')
				.datum(stackData)
				.attr('fill', '#00c4c5')
				.attr('opacity', 0.7)
				.attr('d', areaFullFlat)
				.transition()
				.duration(400)
				.ease(d3.easeCubicOut)
				.attr('d', areaFull)
				.transition()
				.duration(300)
				.ease(d3.easeCubicOut)
				.attr('d', areaPrincipal)
				.on('end', () => {
					yellowPath.transition().duration(300).ease(d3.easeCubicOut).attr('opacity', 0.7);
				});
			hasAnimated = true;
		}

		// Hover crosshair + tooltip
		const crosshair = g.append('line')
			.attr('y1', 0).attr('y2', h)
			.attr('stroke', '#9ca3af')
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '3,3')
			.style('opacity', 0)
			.style('pointer-events', 'none');

		const tooltip = d3.select(tooltipEl);

		g.append('rect')
			.attr('width', w).attr('height', h)
			.attr('fill', 'transparent')
			.on('mousemove', (event: MouseEvent) => {
				const [mx] = d3.pointer(event);
				const idx = Math.round(x.invert(mx));
				if (idx < 0 || idx >= schedule.length) return;

				const cx = x(idx);
				crosshair.attr('x1', cx).attr('x2', cx).style('opacity', 1);

				const row = schedule[idx];
				const dateStr = formatMonthYear(row.month, row.year);
				const html = `<strong>${dateStr}</strong><br>Interest: ${formatCurrency(row.interest)}<br>Principal: ${formatCurrency(row.principal)}`;

				tooltip.html(html).style('opacity', '1');

				const tx = margin.left + cx;
				const tooltipW = tooltipEl.offsetWidth;
				const left = tx + tooltipW + 12 > width ? tx - tooltipW - 8 : tx + 12;
				tooltip.style('left', `${left}px`).style('top', `${margin.top}px`);
			})
			.on('mouseleave', () => {
				crosshair.style('opacity', 0);
				tooltip.style('opacity', '0');
			});
	});
</script>

<ChartContainer title="Interest vs Principal Breakdown">
	<div class="chart-wrapper" bind:this={wrapperEl}>
		<svg bind:this={svgEl}></svg>
		<div class="tooltip" bind:this={tooltipEl}></div>
	</div>
	<div class="legend">
		<span class="legend-item">
			<span class="legend-swatch principal"></span>
			Principal
		</span>
		<span class="legend-item">
			<span class="legend-swatch interest"></span>
			Interest
		</span>
	</div>
</ChartContainer>

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

	.legend-swatch.principal {
		background: #00c4c5;
		opacity: 0.7;
	}

	.legend-swatch.interest {
		background: #fbbf24;
		opacity: 0.7;
	}
</style>
