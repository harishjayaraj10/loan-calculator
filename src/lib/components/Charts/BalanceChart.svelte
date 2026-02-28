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

		const legend = g.append('g').attr('transform', `translate(${w - 180}, 0)`);
		legend.append('line').attr('x1', 0).attr('x2', 20).attr('y1', 0).attr('y2', 0)
			.attr('stroke', '#e5e7eb').attr('stroke-width', 2).attr('stroke-dasharray', '6,3');
		legend.append('text').attr('x', 26).attr('y', 4).text('Without Part Pmts')
			.style('font-size', '10px').style('font-family', 'var(--font)').attr('fill', '#6b7280');

		legend.append('line').attr('x1', 0).attr('x2', 20).attr('y1', 18).attr('y2', 18)
			.attr('stroke', '#00c4c5').attr('stroke-width', 2.5);
		legend.append('text').attr('x', 26).attr('y', 22).text('With Part Pmts')
			.style('font-size', '10px').style('font-family', 'var(--font)').attr('fill', '#6b7280');
	});
</script>

<ChartContainer title="Balance Over Time">
	<div bind:this={wrapperEl}>
		<svg bind:this={svgEl}></svg>
	</div>
</ChartContainer>
