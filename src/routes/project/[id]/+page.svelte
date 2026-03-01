<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Header from '$lib/components/Header.svelte';
	import TabBar from '$lib/components/TabBar.svelte';
	import LoanForm from '$lib/components/LoanForm.svelte';
	import SummaryCards from '$lib/components/SummaryCards.svelte';
	import AmortizationTable from '$lib/components/AmortizationTable.svelte';
	import PartPaymentManager from '$lib/components/PartPaymentManager.svelte';
	import BalanceChart from '$lib/components/Charts/BalanceChart.svelte';
	import InterestPrincipalChart from '$lib/components/Charts/InterestPrincipalChart.svelte';
	import SavingsComparison from '$lib/components/Charts/SavingsComparison.svelte';
	import { getProject } from '$lib/stores/projects.svelte';

	let activeTab = $state('overview');

	const tabs = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'amortization', label: 'Amortization' },
		{ id: 'partpayments', label: 'Part Payments' },
		{ id: 'analysis', label: 'Analysis' }
	];

	let project = $derived(getProject(page.params.id!));
</script>

{#if project}
	<Header title={project.name} showBack onback={() => goto('/')}>
		<span class="rate-badge">{project.annualRate}%</span>
	</Header>

	<TabBar {tabs} {activeTab} onchange={(id) => (activeTab = id)} />

	<main>
		{#if activeTab === 'overview'}
			<div class="tab-content">
				<SummaryCards {project} />
				<div class="spacer"></div>
				<LoanForm {project} />
			</div>
		{:else if activeTab === 'amortization'}
			<div class="tab-content">
				<AmortizationTable {project} />
			</div>
		{:else if activeTab === 'partpayments'}
			<div class="tab-content">
				<PartPaymentManager {project} />
			</div>
		{:else if activeTab === 'analysis'}
			<div class="tab-content charts">
				<BalanceChart {project} />
				<InterestPrincipalChart {project} />
				<SavingsComparison {project} />
			</div>
		{/if}
	</main>
{:else}
	<Header title="Not Found" showBack onback={() => goto('/')} />
	<div class="not-found">
		<p>Project not found</p>
		<button class="link-btn" onclick={() => goto('/')}>Go back to projects</button>
	</div>
{/if}

<style>
	main {
		padding-bottom: 3rem;
	}

	.tab-content {
		display: flex;
		flex-direction: column;
	}

	.charts {
		gap: 1.5rem;
	}

	.spacer {
		height: 1.5rem;
	}

	.rate-badge {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-primary);
		background: var(--color-primary-light);
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
	}

	.not-found {
		text-align: center;
		padding: 4rem 1rem;
	}

	.not-found p {
		font-size: 1rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.link-btn {
		color: var(--color-primary);
		font-size: 0.875rem;
		font-weight: 700;
	}

	.link-btn:hover {
		text-decoration: underline;
	}
</style>
