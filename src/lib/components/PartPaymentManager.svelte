<script lang="ts">
	import type { LoanProject } from '$lib/types';
	import { addPartPayment, removePartPayment, updatePartPayment } from '$lib/stores/projects.svelte';
	import { formatCurrency, formatMonthYear } from '$lib/utils/formatters';

	let { project }: { project: LoanProject } = $props();

	let newDate = $state(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
	let newAmount = $state('');
	let editingId = $state<string | null>(null);
	let editDate = $state('2024-01');
	let editAmount = $state('');

	function handleAdd() {
		if (!newAmount || Number(newAmount) <= 0) return;
		const [y, m] = newDate.split('-').map(Number);
		addPartPayment(project.id, {
			month: m,
			year: y,
			amount: Number(newAmount)
		});
		newAmount = '';
	}

	function startEdit(pp: { id: string; month: number; year: number; amount: number }) {
		editingId = pp.id;
		editDate = `${pp.year}-${String(pp.month).padStart(2, '0')}`;
		editAmount = String(pp.amount);
	}

	function saveEdit() {
		if (!editingId || !editAmount) return;
		const [y, m] = editDate.split('-').map(Number);
		updatePartPayment(project.id, editingId, {
			month: m,
			year: y,
			amount: Number(editAmount)
		});
		editingId = null;
	}

	function cancelEdit() {
		editingId = null;
	}

	let sortedPayments = $derived(
		[...project.partPayments].sort((a, b) => a.year - b.year || a.month - b.month)
	);

</script>

<div class="pp-section">
	<div class="add-form">
		<h3 class="section-heading">Add Part Payment</h3>
		<form onsubmit={(e) => { e.preventDefault(); handleAdd(); }}>
			<div class="form-row">
				<div class="field">
					<label for="pp-date">Month</label>
					<input id="pp-date" type="month" bind:value={newDate} min="2000-01" max="2060-12" />
				</div>
				<div class="field grow">
					<label for="pp-amount">Amount</label>
					<input id="pp-amount" type="number" bind:value={newAmount} placeholder="200000" min="1" required />
				</div>
				<div class="field btn-field">
					<button type="submit" class="btn btn-primary">Add</button>
				</div>
			</div>
		</form>
	</div>

	{#if sortedPayments.length > 0}
		<div class="pp-list">
			<h3 class="section-heading">Part Payments ({sortedPayments.length})</h3>
			{#each sortedPayments as pp (pp.id)}
				<div class="pp-item" class:editing={editingId === pp.id}>
					{#if editingId === pp.id}
						<form class="edit-row" onsubmit={(e) => { e.preventDefault(); saveEdit(); }}>
							<input type="month" bind:value={editDate} min="2000-01" max="2060-12" class="date-input" />
							<input type="number" bind:value={editAmount} min="1" class="amount-input" />
							<button type="submit" class="btn-icon save" title="Save">
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</button>
							<button type="button" class="btn-icon cancel" onclick={cancelEdit} title="Cancel">
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
								</svg>
							</button>
						</form>
					{:else}
						<div class="pp-info">
							<span class="pp-date">{formatMonthYear(pp.month, pp.year)}</span>
							<span class="pp-amount">{formatCurrency(pp.amount)}</span>
						</div>
						<div class="pp-actions">
							<button class="btn-icon edit" onclick={() => startEdit(pp)} title="Edit">
								<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
									<path d="M10 1.5L12.5 4L4.5 12H2V9.5L10 1.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
								</svg>
							</button>
							<button class="btn-icon delete" onclick={() => removePartPayment(project.id, pp.id)} title="Delete">
								<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
									<path d="M3 3L11 11M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
								</svg>
							</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty">
			<p>No part payments added yet</p>
			<p class="empty-sub">Part payments reduce your loan tenure and total interest</p>
		</div>
	{/if}
</div>

<style>
	.pp-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.add-form {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.25rem;
		box-shadow: var(--shadow-sm);
	}

	.section-heading {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 1rem;
	}

	.form-row {
		display: flex;
		gap: 0.75rem;
		align-items: flex-end;
		flex-wrap: wrap;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.field.grow {
		flex: 1;
		min-width: 120px;
	}

	.field label {
		font-size: 0.6875rem;
		color: var(--color-text-secondary);
		font-weight: 700;
	}

	.field select,
	.field input {
		padding: 0.5rem 0.625rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
	}

	.field select:focus,
	.field input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.btn-field {
		justify-content: flex-end;
	}

	.btn-primary {
		padding: 0.5rem 1rem;
		background: var(--color-primary);
		color: white;
		border-radius: var(--radius-sm);
		font-weight: 700;
		font-size: 0.8125rem;
		transition: background 0.15s;
	}

	.btn-primary:hover {
		background: var(--color-primary-hover);
	}

	.pp-list {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.25rem;
		box-shadow: var(--shadow-sm);
	}

	.pp-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.pp-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.pp-item:first-of-type {
		padding-top: 0;
	}

	.pp-info {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.pp-date {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
		min-width: 80px;
	}

	.pp-amount {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.pp-actions {
		display: flex;
		gap: 0.375rem;
	}

	.btn-icon {
		padding: 0.375rem;
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		transition: all 0.15s;
	}

	.btn-icon.edit:hover { color: var(--color-primary); background: var(--color-primary-light); }
	.btn-icon.delete:hover { color: var(--color-danger); background: #fef2f2; }
	.btn-icon.save { color: var(--color-success); }
	.btn-icon.cancel { color: var(--color-text-secondary); }

	.edit-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}

	.edit-row select,
	.edit-row input {
		padding: 0.375rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
	}

	.date-input { width: 140px; }
	.amount-input { flex: 1; }

	.empty {
		text-align: center;
		padding: 2rem 1rem;
		color: var(--color-text-secondary);
	}

	.empty p { font-size: 0.875rem; }
	.empty-sub { font-size: 0.75rem; margin-top: 0.375rem; }

	@media (max-width: 640px) {
		.form-row {
			flex-direction: column;
			align-items: stretch;
		}

		.field.grow {
			min-width: auto;
		}
	}
</style>
