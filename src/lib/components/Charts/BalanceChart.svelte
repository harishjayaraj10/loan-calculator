<script lang="ts">
	import type { LoanProject } from '$lib/types';
	import { generateAmortization } from '$lib/utils/calculations';
	import { formatCurrency, formatMonthYear } from '$lib/utils/formatters';
	import ChartContainer from './ChartContainer.svelte';
	import * as d3 from 'd3';
	import { onMount } from 'svelte';

	let { project }: { project: LoanProject } = $props();

	let withoutPP = $derived(generateAmortization(project, false));
	let withPP = $derived(generateAmortization(project, true));

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
		if (!svgEl || chartWidth <= 0 || !withPP.length || !withoutPP.length || !isVisible) return;
		const width = chartWidth;
		const height = chartHeight;

		const margin = { top: 20, right: 20, bottom: 40, left: 70 };
		const w = width - margin.left - margin.right;
		const h = height - margin.top - margin.bottom;

		const sel = d3.select(svgEl);
		sel.selectAll('*').remove();
		sel.attr('width', width).attr('height', height);

		const g = sel.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

		const allData = [...withoutPP, ...withPP];
		const xMax = Math.max(withoutPP.length, withPP.length);

		const x = d3.scaleLinear().domain([0, xMax - 1]).range([0, w]);
		const y = d3.scaleLinear()
			.domain([0, d3.max(allData, (d) => d.openingBalance) || 0])
			.nice()
			.range([h, 0]);

		g.append('g')
			.attr('transform', `translate(0,${h})`)
			.call(d3.axisBottom(x).ticks(Math.min(xMax, 10)).tickFormat((d) => {
				const idx = d as number;
				if (idx >= 0 && idx < withoutPP.length) {
					return formatMonthYear(withoutPP[idx].month, withoutPP[idx].year);
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
				if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
				if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
				if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
				return String(val);
			}))
			.selectAll('text')
			.style('font-size', '10px')
			.style('font-family', 'var(--font)');

		const lineWithout = d3.line<(typeof withoutPP)[0]>()
			.x((_, i) => x(i))
			.y((d) => y(d.openingBalance))
			.curve(d3.curveMonotoneX);

		const lineWith = d3.line<(typeof withPP)[0]>()
			.x((_, i) => x(i))
			.y((d) => y(d.openingBalance))
			.curve(d3.curveMonotoneX);

		// Draw lines with animation
		const pathWithout = g.append('path')
			.datum(withoutPP)
			.attr('fill', 'none')
			.attr('stroke', '#e5e7eb')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,3')
			.attr('d', lineWithout);

		const pathWith = g.append('path')
			.datum(withPP)
			.attr('fill', 'none')
			.attr('stroke', '#00c4c5')
			.attr('stroke-width', 2.5)
			.attr('d', lineWith);

		// Animate line drawing (only on first render)
		if (!hasAnimated) {
			[pathWithout, pathWith].forEach((path) => {
				const length = (path.node() as SVGPathElement).getTotalLength();
				path
					.attr('stroke-dasharray', `${length} ${length}`)
					.attr('stroke-dashoffset', length)
					.transition()
					.duration(1200)
					.ease(d3.easeQuadOut)
					.attr('stroke-dashoffset', 0)
					.on('end', function() {
						if (path === pathWithout) {
							d3.select(this).attr('stroke-dasharray', '6,3');
						} else {
							d3.select(this).attr('stroke-dasharray', null);
						}
					});
			});
			hasAnimated = true;
		}

		// Hover crosshair + dots + tooltip
		const crosshair = g.append('line')
			.attr('y1', 0).attr('y2', h)
			.attr('stroke', '#9ca3af')
			.attr('stroke-width', 1)
			.attr('stroke-dasharray', '3,3')
			.style('opacity', 0)
			.style('pointer-events', 'none');

		const dotWithout = g.append('circle')
			.attr('r', 4).attr('fill', '#e5e7eb').attr('stroke', '#fff').attr('stroke-width', 2)
			.style('opacity', 0).style('pointer-events', 'none');

		const dotWith = g.append('circle')
			.attr('r', 4).attr('fill', '#00c4c5').attr('stroke', '#fff').attr('stroke-width', 2)
			.style('opacity', 0).style('pointer-events', 'none');

		const tooltip = d3.select(tooltipEl);

		g.append('rect')
			.attr('width', w).attr('height', h)
			.attr('fill', 'transparent')
			.on('mousemove', (event: MouseEvent) => {
				const [mx] = d3.pointer(event);
				const idx = Math.round(x.invert(mx));

				if (idx < 0 || idx >= xMax) return;

				const cx = x(idx);
				crosshair.attr('x1', cx).attr('x2', cx).style('opacity', 1);

				if (idx < withoutPP.length) {
					dotWithout.attr('cx', cx).attr('cy', y(withoutPP[idx].openingBalance)).style('opacity', 1);
				} else {
					dotWithout.style('opacity', 0);
				}

				if (idx < withPP.length) {
					dotWith.attr('cx', cx).attr('cy', y(withPP[idx].openingBalance)).style('opacity', 1);
				} else {
					dotWith.style('opacity', 0);
				}

				const row = idx < withPP.length ? withPP[idx] : withoutPP[idx];
				const dateStr = formatMonthYear(row.month, row.year);
				let html = `<strong>${dateStr}</strong>`;
				if (idx < withoutPP.length) html += `<br>Original: ${formatCurrency(withoutPP[idx].openingBalance)}`;
				if (idx < withPP.length) html += `<br>With PP: ${formatCurrency(withPP[idx].openingBalance)}`;

				tooltip.html(html).style('opacity', '1');

				const rect = wrapperEl.getBoundingClientRect();
				const tx = margin.left + cx;
				const tooltipNode = tooltipEl;
				const tooltipW = tooltipNode.offsetWidth;
				const left = tx + tooltipW + 12 > width ? tx - tooltipW - 8 : tx + 12;
				tooltip.style('left', `${left}px`).style('top', `${margin.top}px`);
			})
			.on('mouseleave', () => {
				crosshair.style('opacity', 0);
				dotWithout.style('opacity', 0);
				dotWith.style('opacity', 0);
				tooltip.style('opacity', '0');
			});
	});
</script>

<ChartContainer title="Balance Over Time">
	<div class="chart-wrapper" bind:this={wrapperEl}>
		<svg bind:this={svgEl}></svg>
		<div class="tooltip" bind:this={tooltipEl}></div>
	</div>
	<div class="legend">
		<span class="legend-item">
			<span class="legend-line dashed"></span>
			Without Part Pmts
		</span>
		<span class="legend-item">
			<span class="legend-line solid"></span>
			With Part Pmts
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

	.legend-line {
		display: inline-block;
		width: 20px;
		height: 0;
		border-top: 2.5px solid;
	}

	.legend-line.dashed {
		border-color: #e5e7eb;
		border-top-style: dashed;
	}

	.legend-line.solid {
		border-color: #00c4c5;
	}
</style>
