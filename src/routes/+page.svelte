<script lang="ts">
	import { goto } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import ExportImport from '$lib/components/ExportImport.svelte';
	import { getProjects, addProject, deleteProject } from '$lib/stores/projects.svelte';
	import { SvelteSet } from 'svelte/reactivity';

	let showNewForm = $state(false);
	let newName = $state('');
	let newPrincipal = $state('');
	let newRate = $state('');
	let newTenure = $state('');
	let newStartDate = $state(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
	let newEmiMode = $state<'calculate' | 'manual'>('calculate');
	let newEmiOverride = $state('');
	let deleteConfirm = $state<string | null>(null);
	let selectMode = $state<false | 'export' | 'delete'>(false);
	let selectedIds = new SvelteSet<string>();
	let showDeleteConfirm = $state(false);

	let projects = $derived(getProjects());

	function startExportSelect() {
		selectMode = 'export';
		selectedIds.clear();
	}

	function startDeleteSelect() {
		selectMode = 'delete';
		selectedIds.clear();
	}

	function cancelSelect() {
		selectMode = false;
		selectedIds.clear();
	}

	function promptBulkDelete() {
		showDeleteConfirm = true;
	}

	function confirmBulkDelete() {
		for (const id of selectedIds) {
			deleteProject(id);
		}
		showDeleteConfirm = false;
		cancelSelect();
	}

	function cancelBulkDelete() {
		showDeleteConfirm = false;
	}

	function toggleSelect(id: string) {
		if (selectedIds.has(id)) {
			selectedIds.delete(id);
		} else {
			selectedIds.add(id);
		}
	}

	function handleCreate() {
		if (!newName || !newPrincipal || !newRate || !newTenure) return;
		if (newEmiMode === 'manual' && !newEmiOverride) return;
		const emiOverride = newEmiMode === 'manual' && newEmiOverride ? Number(newEmiOverride) : undefined;
		const [sYear, sMonth] = newStartDate.split('-').map(Number);
		const id = addProject({
			name: newName,
			principal: Number(newPrincipal),
			annualRate: Number(newRate),
			tenureYears: Number(newTenure),
			startMonth: sMonth,
			startYear: sYear,
			emiOverride
		});
		resetForm();
		goto(`/project/${id}`);
	}

	function resetForm() {
		showNewForm = false;
		newName = '';
		newPrincipal = '';
		newRate = '';
		newTenure = '';
		newStartDate = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
		newEmiMode = 'calculate';
		newEmiOverride = '';
	}

	function confirmDelete(id: string) {
		if (deleteConfirm === id) {
			deleteProject(id);
			deleteConfirm = null;
		} else {
			deleteConfirm = id;
			setTimeout(() => (deleteConfirm = null), 3000);
		}
	}
</script>

<Header title="Loan Calculator">
	<ExportImport {selectMode} {selectedIds} onStartExportSelect={startExportSelect} onStartDeleteSelect={startDeleteSelect} onCancelSelect={cancelSelect} onBulkDelete={promptBulkDelete} />
</Header>

<main>
	{#if projects.length === 0}
		<div class="empty-state">
			<p class="empty-text">No loan projects yet</p>
			<p class="empty-sub">Create your first project to get started</p>
		</div>
	{/if}

	<div class="projects-grid">
		{#each projects as project, i (project.id)}
			<div style="--float-delay: {i * 0.4}s">
				<ProjectCard
					{project}
					selectMode={!!selectMode}
					deleteMode={selectMode === 'delete'}
					selected={selectedIds.has(project.id)}
					onclick={() => selectMode ? toggleSelect(project.id) : goto(`/project/${project.id}`)}
					ondelete={() => confirmDelete(project.id)}
				/>
			</div>
		{/each}
	</div>

	{#if deleteConfirm && !selectMode}
		<div class="toast">Click delete again to confirm</div>
	{/if}

	{#if !selectMode}
		<button class="fab" onclick={() => (showNewForm = true)}>+</button>
	{/if}
</main>

{#if showNewForm}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="modal-backdrop"
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-label="New Project"
		onclick={resetForm}
		onkeydown={(e) => e.key === 'Escape' && resetForm()}
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="modal" role="document" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2 class="modal-title">New Project</h2>
				<button type="button" class="modal-close" aria-label="Close" onclick={resetForm}>
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
					</svg>
				</button>
			</div>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleCreate();
				}}
			>
				<div class="form-grid">
					<div class="field full">
						<label for="name">Project Name</label>
						<input id="name" type="text" bind:value={newName} placeholder="e.g., Home Loan" required />
					</div>
					<div class="field">
						<label for="principal">Loan Amount</label>
						<input id="principal" type="number" bind:value={newPrincipal} placeholder="5000000" min="1" required />
					</div>
					<div class="field">
						<label for="rate">Interest Rate (%)</label>
						<input id="rate" type="number" bind:value={newRate} placeholder="8.5" step="0.01" min="0.01" required />
					</div>
					<div class="field">
						<label for="tenure">Tenure (Years)</label>
						<input id="tenure" type="number" bind:value={newTenure} placeholder="20" min="1" max="40" required />
					</div>
					<div class="field">
						<label for="startDate">Start Month</label>
						<input id="startDate" type="month" bind:value={newStartDate} min="2000-01" max="2050-12" />
					</div>
				</div>

				<div class="emi-mode-section">
					<span class="emi-mode-label">Monthly EMI</span>
					<div class="emi-toggle">
						<button
							type="button"
							class="emi-option"
							class:active={newEmiMode === 'calculate'}
							onclick={() => (newEmiMode = 'calculate')}>Calculate for me</button
						>
						<button
							type="button"
							class="emi-option"
							class:active={newEmiMode === 'manual'}
							onclick={() => (newEmiMode = 'manual')}>I know my EMI</button
						>
					</div>
					{#if newEmiMode === 'manual'}
						<input
							id="emiOverride"
							type="number"
							bind:value={newEmiOverride}
							step="1"
							min="1"
							placeholder="Enter your bank's EMI amount"
							required
						/>
					{/if}
				</div>

				<div class="form-actions">
					<button type="button" class="btn btn-cancel" onclick={resetForm}>Cancel</button>
					<button type="submit" class="btn btn-primary">Create Project</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if showDeleteConfirm}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="modal-backdrop"
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-label="Confirm Delete"
		onclick={cancelBulkDelete}
		onkeydown={(e) => e.key === 'Escape' && cancelBulkDelete()}
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="modal modal-sm" role="document" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2 class="modal-title">Delete Projects</h2>
				<button type="button" class="modal-close" aria-label="Close" onclick={cancelBulkDelete}>
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
					</svg>
				</button>
			</div>
			<p class="confirm-text">Are you sure you want to delete {selectedIds.size} project{selectedIds.size !== 1 ? 's' : ''}? This cannot be undone.</p>
			<div class="form-actions">
				<button type="button" class="btn btn-cancel" onclick={cancelBulkDelete}>Cancel</button>
				<button type="button" class="btn btn-danger" onclick={confirmBulkDelete}>Delete</button>
			</div>
		</div>
	</div>
{/if}

<style>
	main {
		padding-bottom: 6rem;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 1rem;
	}

	.empty-text {
		font-size: 1rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	.empty-sub {
		color: var(--color-text-secondary);
		font-size: 0.8125rem;
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 1rem;
	}

	.modal {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		width: 100%;
		max-width: 480px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: var(--shadow-lg);
	}

	.modal-sm {
		max-width: 360px;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.25rem;
	}

	.modal-title {
		font-size: 1rem;
		font-weight: 700;
	}

	.modal-close {
		color: var(--color-text-secondary);
		padding: 0.25rem;
		border-radius: var(--radius-sm);
		transition: all 0.15s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-close:hover {
		color: var(--color-text);
		background: var(--color-surface);
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.field.full {
		grid-column: 1 / -1;
	}

	.field label {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		font-weight: 700;
	}

	.field input {
		padding: 0.625rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg);
		font-size: 0.875rem;
		transition: border-color 0.15s;
	}

	.field input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.emi-mode-section {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.emi-mode-label {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		font-weight: 700;
	}

	.emi-toggle {
		display: flex;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.emi-option {
		flex: 1;
		padding: 0.5rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 600;
		background: var(--color-bg);
		color: var(--color-text-secondary);
		border: none;
		cursor: pointer;
		transition: all 0.15s;
	}

	.emi-option:first-child {
		border-right: 1px solid var(--color-border);
	}

	.emi-option.active {
		background: var(--color-primary);
		color: white;
	}

	.emi-mode-section input {
		padding: 0.625rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg);
		font-size: 0.875rem;
		transition: border-color 0.15s;
	}

	.emi-mode-section input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1.25rem;
	}

	.btn {
		padding: 0.625rem 1.25rem;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-weight: 700;
		transition: all 0.15s;
	}

	.btn-primary {
		background: var(--color-primary);
		color: white;
	}

	.btn-primary:hover {
		background: var(--color-primary-hover);
	}

	.btn-cancel {
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border);
	}

	.btn-cancel:hover {
		border-color: var(--color-text-secondary);
	}

	.btn-danger {
		background: var(--color-danger);
		color: white;
	}

	.btn-danger:hover {
		background: var(--color-danger-hover);
	}

	.confirm-text {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
		margin-bottom: 0.25rem;
	}

	.fab {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: var(--color-primary);
		color: white;
		font-size: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--shadow-lg);
		transition: all 0.2s;
		line-height: 1;
	}

	.fab:hover {
		background: var(--color-primary-hover);
		transform: scale(1.05);
	}

	.toast {
		position: fixed;
		bottom: 5rem;
		left: 50%;
		transform: translateX(-50%);
		background: var(--color-text);
		color: white;
		padding: 0.625rem 1.25rem;
		border-radius: var(--radius-md);
		font-size: 0.75rem;
		box-shadow: var(--shadow-lg);
	}

	@media (max-width: 640px) {
		.projects-grid {
			grid-template-columns: 1fr;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.field.full {
			grid-column: 1;
		}
	}
</style>
