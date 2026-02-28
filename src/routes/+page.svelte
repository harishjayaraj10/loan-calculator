<script lang="ts">
	import { goto } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import ExportImport from '$lib/components/ExportImport.svelte';
	import { getProjects, addProject, deleteProject } from '$lib/stores/projects.svelte';

	let showNewForm = $state(false);
	let newName = $state('');
	let newPrincipal = $state('');
	let newRate = $state('');
	let newTenure = $state('');
	let newStartMonth = $state(new Date().getMonth() + 1);
	let newStartYear = $state(new Date().getFullYear());
	let deleteConfirm = $state<string | null>(null);

	let projects = $derived(getProjects());

	function handleCreate() {
		if (!newName || !newPrincipal || !newRate || !newTenure) return;
		const id = addProject({
			name: newName,
			principal: Number(newPrincipal),
			annualRate: Number(newRate),
			tenureYears: Number(newTenure),
			startMonth: newStartMonth,
			startYear: newStartYear
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
		newStartMonth = new Date().getMonth() + 1;
		newStartYear = new Date().getFullYear();
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

	const months = [
		{ value: 1, label: 'Jan' }, { value: 2, label: 'Feb' },
		{ value: 3, label: 'Mar' }, { value: 4, label: 'Apr' },
		{ value: 5, label: 'May' }, { value: 6, label: 'Jun' },
		{ value: 7, label: 'Jul' }, { value: 8, label: 'Aug' },
		{ value: 9, label: 'Sep' }, { value: 10, label: 'Oct' },
		{ value: 11, label: 'Nov' }, { value: 12, label: 'Dec' }
	];
</script>

<Header title="Loan Calculator">
	<ExportImport />
</Header>

<main>
	{#if projects.length === 0 && !showNewForm}
		<div class="empty-state">
			<p class="empty-text">No loan projects yet</p>
			<p class="empty-sub">Create your first project to get started</p>
		</div>
	{/if}

	<div class="projects-grid">
		{#each projects as project (project.id)}
			<ProjectCard
				{project}
				onclick={() => goto(`/project/${project.id}`)}
				ondelete={() => confirmDelete(project.id)}
			/>
		{/each}
	</div>

	{#if deleteConfirm}
		<div class="toast">Click delete again to confirm</div>
	{/if}

	{#if showNewForm}
		<div class="new-form-card">
			<h2 class="form-title">New Project</h2>
			<form onsubmit={(e) => { e.preventDefault(); handleCreate(); }}>
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
						<label for="startMonth">Start Month</label>
						<select id="startMonth" bind:value={newStartMonth}>
							{#each months as m}
								<option value={m.value}>{m.label}</option>
							{/each}
						</select>
					</div>
					<div class="field">
						<label for="startYear">Start Year</label>
						<input id="startYear" type="number" bind:value={newStartYear} min="2000" max="2050" />
					</div>
				</div>
				<div class="form-actions">
					<button type="button" class="btn btn-cancel" onclick={resetForm}>Cancel</button>
					<button type="submit" class="btn btn-primary">Create Project</button>
				</div>
			</form>
		</div>
	{/if}

	<button class="fab" onclick={() => (showNewForm = !showNewForm)}>
		{showNewForm ? '×' : '+'}
	</button>
</main>

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

	.new-form-card {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: var(--shadow-md);
	}

	.form-title {
		font-size: 1rem;
		font-weight: 700;
		margin-bottom: 1.25rem;
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

	.field input,
	.field select {
		padding: 0.625rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg);
		font-size: 0.875rem;
		transition: border-color 0.15s;
	}

	.field input:focus,
	.field select:focus {
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
