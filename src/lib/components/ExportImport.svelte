<script lang="ts">
	import { exportProjects, importProjects } from '$lib/stores/projects.svelte';

	let {
		selectMode = false,
		selectedIds = new Set<string>(),
		onStartExportSelect = () => {},
		onStartDeleteSelect = () => {},
		onCancelSelect = () => {},
		onBulkDelete = () => {}
	}: {
		selectMode?: false | 'export' | 'delete';
		selectedIds?: Set<string>;
		onStartExportSelect?: () => void;
		onStartDeleteSelect?: () => void;
		onCancelSelect?: () => void;
		onBulkDelete?: () => void;
	} = $props();

	let fileInput: HTMLInputElement;
	let message = $state('');
	let menuOpen = $state(false);

	function handleExportSelected() {
		const data = exportProjects([...selectedIds]);
		const json = JSON.stringify(data, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `loan-projects-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
		onCancelSelect();
	}

	function handleImport() {
		menuOpen = false;
		fileInput.click();
	}

	function handleStartExport() {
		menuOpen = false;
		onStartExportSelect();
	}

	function handleStartDelete() {
		menuOpen = false;
		onStartDeleteSelect();
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

	function closeMenu(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.menu-wrapper')) {
			menuOpen = false;
		}
	}
</script>

<svelte:window onclick={closeMenu} />

<div class="export-import">
	{#if selectMode === 'export'}
		<button class="btn btn-primary" disabled={selectedIds.size === 0} onclick={handleExportSelected}>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
				<polyline points="17 8 12 3 7 8" />
				<line x1="12" y1="3" x2="12" y2="15" />
			</svg>
			Export ({selectedIds.size})
		</button>
		<button class="btn btn-secondary" onclick={onCancelSelect}>Cancel</button>
	{:else if selectMode === 'delete'}
		<button class="btn btn-danger" disabled={selectedIds.size === 0} onclick={onBulkDelete}>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polyline points="3 6 5 6 21 6" />
				<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
			</svg>
			Delete ({selectedIds.size})
		</button>
		<button class="btn btn-secondary" onclick={onCancelSelect}>Cancel</button>
	{:else}
		<!-- Desktop: inline buttons -->
		<div class="desktop-buttons">
			<button class="btn btn-secondary" onclick={handleStartExport} title="Export">
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="17 8 12 3 7 8" />
					<line x1="12" y1="3" x2="12" y2="15" />
				</svg>
				Export
			</button>
			<button class="btn btn-secondary" onclick={handleImport} title="Import">
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="7 10 12 15 17 10" />
					<line x1="12" y1="15" x2="12" y2="3" />
				</svg>
				Import
			</button>
			<button class="btn btn-icon btn-delete" onclick={handleStartDelete} title="Delete">
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polyline points="3 6 5 6 21 6" />
					<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
				</svg>
			</button>
		</div>

		<!-- Mobile: kebab menu -->
		<div class="menu-wrapper mobile-menu">
			<button
				class="btn btn-icon btn-secondary kebab-btn"
				onclick={(e) => {
					e.stopPropagation();
					menuOpen = !menuOpen;
				}}
				title="More options"
			>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<circle cx="8" cy="3" r="1.5" fill="currentColor" />
					<circle cx="8" cy="8" r="1.5" fill="currentColor" />
					<circle cx="8" cy="13" r="1.5" fill="currentColor" />
				</svg>
			</button>
			{#if menuOpen}
				<div class="dropdown">
					<button class="dropdown-item" onclick={handleStartExport}>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="17 8 12 3 7 8" />
							<line x1="12" y1="3" x2="12" y2="15" />
						</svg>
						Export
					</button>
					<button class="dropdown-item" onclick={handleImport}>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="7 10 12 15 17 10" />
							<line x1="12" y1="15" x2="12" y2="3" />
						</svg>
						Import
					</button>
					<button class="dropdown-item dropdown-danger" onclick={handleStartDelete}>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<polyline points="3 6 5 6 21 6" />
							<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
						</svg>
						Delete
					</button>
				</div>
			{/if}
		</div>

		<input bind:this={fileInput} type="file" accept=".json" onchange={onFileSelected} hidden />
	{/if}
</div>

{#if message}
	<div class="toast">{message}</div>
{/if}

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
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		white-space: nowrap;
	}

	.btn-icon {
		padding: 0.5rem;
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

	.btn-delete {
		background: var(--color-bg);
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border);
	}

	.btn-delete:hover {
		border-color: var(--color-danger);
		color: var(--color-danger);
	}

	.btn-primary {
		background: var(--color-primary);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-danger {
		background: var(--color-danger);
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-danger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Desktop buttons visible, mobile menu hidden */
	.desktop-buttons {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.mobile-menu {
		display: none;
	}

	/* Dropdown */
	.menu-wrapper {
		position: relative;
	}

	.dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 0.375rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-lg);
		min-width: 140px;
		z-index: 50;
		overflow: hidden;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.625rem 0.875rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		transition: all 0.15s;
		text-align: left;
	}

	.dropdown-item:hover {
		background: var(--color-surface);
		color: var(--color-text);
	}

	.dropdown-danger:hover {
		color: var(--color-danger);
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
		z-index: 50;
	}

	@media (max-width: 640px) {
		.desktop-buttons {
			display: none;
		}

		.mobile-menu {
			display: block;
		}
	}
</style>
