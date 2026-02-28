<script lang="ts">
	import type { LoanProject } from '$lib/types';
	import { generateAmortization } from '$lib/utils/calculations';
	import { formatMonthYear } from '$lib/utils/formatters';
	import ChartContainer from './ChartContainer.svelte';
	import * as d3 from 'd3';
	import { onMount } from 'svelte';

	let { project }: { project: LoanProject } = $props();

	let schedule = $derived(generateAmortization(project, true));

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
		if (!svgEl || chartWidth <= 0 || !schedule.length) return;
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

		const areaInterest = d3.area<(typeof stackData)[0]>()
			.x((d) => x(d.idx))
			.y0(h)
			.y1((d) => y(d.interest))
			.curve(d3.curveMonotoneX);

		const areaPrincipal = d3.area<(typeof stackData)[0]>()
			.x((d) => x(d.idx))
			.y0((d) => y(d.interest))
			.y1((d) => y(d.interest + d.principal))
			.curve(d3.curveMonotoneX);

		g.append('path')
			.datum(stackData)
			.attr('fill', '#fbbf24')
			.attr('opacity', 0.7)
			.attr('d', areaInterest);

		g.append('path')
			.datum(stackData)
			.attr('fill', '#00c4c5')
			.attr('opacity', 0.7)
			.attr('d', areaPrincipal);

		const legend = g.append('g').attr('transform', `translate(${w - 140}, 0)`);
		legend.append('rect').attr('width', 12).attr('height', 12).attr('rx', 2).attr('fill', '#00c4c5').attr('opacity', 0.7);
		legend.append('text').attr('x', 18).attr('y', 10).text('Principal')
			.style('font-size', '10px').style('font-family', 'var(--font)').attr('fill', '#6b7280');

		legend.append('rect').attr('y', 18).attr('width', 12).attr('height', 12).attr('rx', 2).attr('fill', '#fbbf24').attr('opacity', 0.7);
		legend.append('text').attr('x', 18).attr('y', 28).text('Interest')
			.style('font-size', '10px').style('font-family', 'var(--font)').attr('fill', '#6b7280');
	});
</script>

<ChartContainer title="Interest vs Principal Breakdown">
	<div bind:this={wrapperEl}>
		<svg bind:this={svgEl}></svg>
	</div>
</ChartContainer>
