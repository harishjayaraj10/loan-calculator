<script lang="ts">
	import { exportProjects, importProjects } from '$lib/stores/projects.svelte';

	let fileInput: HTMLInputElement;
	let message = $state('');

	function handleExport() {
		const data = exportProjects();
		const json = JSON.stringify(data, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `loan-projects-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function handleImport() {
		fileInput.click();
	}

	async function onFileSelected(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const data = JSON.parse(text);
			const count = importProjects(data);
			message = `Imported ${count} project${count !== 1 ? 's' : ''}`;
			setTimeout(() => (message = ''), 3000);
		} catch {
			message = 'Invalid file format';
			setTimeout(() => (message = ''), 3000);
		}

		target.value = '';
	}
</script>

<div class="export-import">
	<button class="btn btn-secondary" onclick={handleExport}>Export</button>
	<button class="btn btn-secondary" onclick={handleImport}>Import</button>
	<input bind:this={fileInput} type="file" accept=".json" onchange={onFileSelected} hidden />
	{#if message}
		<span class="message">{message}</span>
	{/if}
</div>

<style>
	.export-import {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn {
		padding: 0.5rem 0.875rem;
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 700;
		transition: all 0.15s;
	}

	.btn-secondary {
		background: var(--color-bg);
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border);
	}

	.btn-secondary:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.message {
		font-size: 0.75rem;
		color: var(--color-success);
	}
</style>
