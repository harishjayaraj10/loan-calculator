<script lang="ts">
	import type { LoanProject } from '$lib/types';
	import { generateAmortization } from '$lib/utils/calculations';
	import { formatMonthYear } from '$lib/utils/formatters';
	import ChartContainer from './ChartContainer.svelte';
	import * as d3 from 'd3';
	import { onMount } from 'svelte';

	let { project }: { project: LoanProject } = $props();

	let withoutPP = $derived(generateAmortization(project, false));
	let withPP = $derived(generateAmortization(project, true));

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
		if (!svgEl || chartWidth <= 0 || !withPP.length || !withoutPP.length) return;
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

		g.append('path')
			.datum(withoutPP)
			.attr('fill', 'none')
			.attr('stroke', '#e5e7eb')
			.attr('stroke-width', 2)
			.attr('stroke-dasharray', '6,3')
			.attr('d', lineWithout);

		g.append('path')
			.datum(withPP)
			.attr('fill', 'none')
			.attr('stroke', '#00c4c5')
			.attr('stroke-width', 2.5)
			.attr('d', lineWith);

	});
</script>

<ChartContainer title="Balance Over Time">
	<div bind:this={wrapperEl}>
		<svg bind:this={svgEl}></svg>
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
