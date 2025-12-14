<script>
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	
	let { data, children } = $props();
	
	let sidebarOpen = $state(false);
	let darkMode = $state(false);
	let showNewItemModal = $state(false);
	let newItemName = $state('');
	let newItemParent = $state(''); // empty string for root level
	
	onMount(() => {
		// Load theme preference from localStorage
		const savedTheme = localStorage.getItem('theme');
		darkMode = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
		applyTheme();
	});
	
	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}
	
	function closeSidebar() {
		if (window.innerWidth < 768) {
			sidebarOpen = false;
		}
	}
	
	function toggleDarkMode() {
		darkMode = !darkMode;
		localStorage.setItem('theme', darkMode ? 'dark' : 'light');
		applyTheme();
	}
	
	function applyTheme() {
		if (darkMode) {
			document.documentElement.classList.add('dark-mode');
		} else {
			document.documentElement.classList.remove('dark-mode');
		}
	}
	
	function openNewItemModal(parent = '') {
		newItemParent = parent;
		newItemName = '';
		showNewItemModal = true;
	}
	
	function closeModal() {
		showNewItemModal = false;
		newItemName = '';
	}
	
	async function createItem() {
		if (!newItemName.trim()) return;
		
		try {
			const response = await fetch('/api/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					path: newItemName,
					parentPath: newItemParent
				})
			});
			
			if (response.ok) {
				const result = await response.json();
				closeModal();
				// Refresh the sidebar data
				await invalidateAll();
				
				// Navigate to the new note
				window.location.href = `/notes/${result.path}`;
			} else {
				const error = await response.json();
				alert('Failed to create note: ' + (error.error || 'Unknown error'));
			}
		} catch (error) {
			console.error('Error creating note:', error);
			alert('Error creating note');
		}
	}
	
	function handleKeydown(event) {
		if (event.key === 'Enter') {
			createItem();
		} else if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

{#snippet noteItem(item)}
	<div class="nav-item">
		{#if item.hasChildren}
			<details open>
				<summary>
					<a href="/notes/{item.path}" onclick={closeSidebar} class="note-link" class:active={decodeURIComponent($page.url.pathname) === `/notes/${item.path}`}>
						📄 {item.name}
					</a>
					<span class="chevron">▼</span>
				</summary>
				<div class="nested">
					{#each item.children as child}
						{@render noteItem(child)}
					{/each}
				</div>
			</details>
		{:else}
			<a href="/notes/{item.path}" onclick={closeSidebar} class="note-link" class:active={decodeURIComponent($page.url.pathname) === `/notes/${item.path}`}>
				📄 {item.name}
			</a>
		{/if}
	</div>
{/snippet}

<div class="app">
	<!-- Mobile menu button -->
	<button class="menu-toggle" onclick={toggleSidebar} aria-label="Toggle menu">
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<line x1="3" y1="12" x2="21" y2="12"></line>
			<line x1="3" y1="6" x2="21" y2="6"></line>
			<line x1="3" y1="18" x2="21" y2="18"></line>
		</svg>
	</button>

	<!-- Sidebar overlay for mobile -->
	{#if sidebarOpen}
		<div class="overlay" onclick={toggleSidebar}></div>
	{/if}

	<!-- Sidebar -->
	<aside class="sidebar" class:open={sidebarOpen}>
		<div class="sidebar-header">
			<h2>Notes</h2>
			<button class="theme-toggle" onclick={toggleDarkMode} aria-label="Toggle dark mode" title={darkMode ? 'Light mode' : 'Dark mode'}>
				{#if darkMode}
					☀️
				{:else}
					🌙
				{/if}
			</button>
		</div>
		<nav class="sidebar-nav">
			{#if data.notes && data.notes.length > 0}
				{#each data.notes as item}
					{@render noteItem(item)}
				{/each}
			{:else}
				<p class="empty-message">No notes found</p>
			{/if}
			<div class="root-add">
				<button class="action-btn root-action" onclick={() => openNewItemModal('')} title="Add note">
					+ Add Note
				</button>
			</div>
		</nav>
	</aside>

	<!-- Main content -->
	<main class="main-content">
		{@render children()}
	</main>
</div>

<!-- Modal for creating new items -->
{#if showNewItemModal}
	<div class="modal-overlay" onclick={closeModal}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<h3>Create New Note</h3>
			<input
				type="text"
				bind:value={newItemName}
				onkeydown={handleKeydown}
				placeholder="Enter note name..."
				autofocus
			/>
			{#if newItemParent}
				<p class="modal-hint">Parent note: {newItemParent}</p>
			{/if}
			<div class="modal-actions">
				<button class="modal-btn modal-btn-primary" onclick={createItem}>
					Create
				</button>
				<button class="modal-btn modal-btn-secondary" onclick={closeModal}>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(:root) {
		--bg-primary: #ffffff;
		--bg-secondary: #f8fafc;
		--bg-tertiary: #f1f5f9;
		--border-color: #e2e8f0;
		--text-primary: #1e293b;
		--text-secondary: #475569;
		--text-muted: #64748b;
		--accent-blue: #2563eb;
		--accent-blue-hover: #1d4ed8;
		--shadow: rgba(0, 0, 0, 0.1);
	}

	:global(.dark-mode) {
		--bg-primary: #0f172a;
		--bg-secondary: #1e293b;
		--bg-tertiary: #334155;
		--border-color: #334155;
		--text-primary: #f1f5f9;
		--text-secondary: #cbd5e1;
		--text-muted: #94a3b8;
		--accent-blue: #3b82f6;
		--accent-blue-hover: #60a5fa;
		--shadow: rgba(0, 0, 0, 0.5);
	}

	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: var(--bg-primary);
		color: var(--text-primary);
		transition: background-color 0.3s, color 0.3s;
	}

	.app {
		display: flex;
		height: 100vh;
		overflow: hidden;
	}

	.menu-toggle {
		position: fixed;
		top: 1rem;
		left: 1rem;
		z-index: 1001;
		background: var(--accent-blue);
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.75rem;
		cursor: pointer;
		display: none;
		box-shadow: 0 2px 8px var(--shadow);
		transition: background 0.2s;
	}

	.menu-toggle:hover {
		background: var(--accent-blue-hover);
	}

	@media (max-width: 767px) {
		.menu-toggle {
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}

	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 999;
		display: none;
	}

	@media (max-width: 767px) {
		.overlay {
			display: block;
		}
	}

	.sidebar {
		width: 280px;
		background: var(--bg-secondary);
		border-right: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		transition: transform 0.3s ease;
		overflow-y: auto;
	}

	@media (max-width: 767px) {
		.sidebar {
			position: fixed;
			top: 0;
			left: 0;
			bottom: 0;
			z-index: 1000;
			transform: translateX(-100%);
			box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
		}

		.sidebar.open {
			transform: translateX(0);
		}
	}

	.sidebar-header {
		padding: 2rem 1.5rem 1rem;
		border-bottom: 1px solid var(--border-color);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.sidebar-header h2 {
		margin: 0;
		font-size: 1.5rem;
		color: var(--text-primary);
	}

	.theme-toggle {
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 0.5rem 0.75rem;
		font-size: 1.25rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.theme-toggle:hover {
		background: var(--border-color);
	}

	.sidebar-nav {
		padding: 1rem;
		flex: 1;
		overflow-y: auto;
	}

	.root-add {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color);
	}

	.root-action {
		width: 100%;
		justify-content: center;
	}
	
	.action-btn {
		padding: 0.5rem 1rem;
		background: var(--accent-blue);
		border: none;
		color: white;
		border-radius: 6px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.action-btn:hover {
		background: var(--accent-blue-hover);
	}

	.nav-item details {
		margin: 0;
	}

	.nav-item {
		margin-bottom: 0.25rem;
	}

	.note-link {
		display: block;
		padding: 0.5rem 0.75rem;
		color: var(--text-secondary);
		text-decoration: none;
		transition: all 0.2s;
		border-radius: 4px;
		border-left: 3px solid transparent;
		padding-left: calc(0.75rem - 3px);
	}

	.note-link:hover {
		color: var(--accent-blue);
		background: var(--bg-tertiary);
	}
	
	.note-link.active {
		color: var(--accent-blue);
		background: var(--bg-tertiary);
		border-left-color: var(--accent-blue);
		font-weight: 500;
	}

	.nav-item summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0;
		cursor: pointer;
		list-style: none;
		transition: all 0.2s;
		color: var(--text-secondary);
		border-radius: 4px;
	}
	
	.nav-item summary:hover {
		background: var(--bg-tertiary);
	}

	.nav-item summary::-webkit-details-marker {
		display: none;
	}
	
	.chevron {
		font-size: 0.7rem;
		color: var(--text-muted);
		transition: transform 0.2s;
		display: inline-block;
		width: 1.5rem;
		text-align: center;
		flex-shrink: 0;
		padding: 0.5rem 0.75rem;
		margin-right: -0.75rem;
	}
	
	.nav-item details[open] > summary .chevron {
		transform: rotate(0deg);
	}
	
	.nav-item details:not([open]) > summary .chevron {
		transform: rotate(-90deg);
	}

	.nested {
		margin-left: 0.75rem;
		margin-top: 0.125rem;
		border-left: 1px solid var(--border-color);
		padding-left: 0.5rem;
	}

	.empty-message {
		padding: 1rem;
		color: var(--text-muted);
		font-size: 0.9rem;
		text-align: center;
	}

	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
	}

	.modal {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 2rem;
		min-width: 400px;
		max-width: 90vw;
		box-shadow: 0 8px 32px var(--shadow);
	}

	.modal h3 {
		margin: 0 0 1.5rem 0;
		color: var(--text-primary);
		font-size: 1.5rem;
	}

	.modal input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 6px;
		font-size: 1rem;
		background: var(--bg-secondary);
		color: var(--text-primary);
		box-sizing: border-box;
	}

	.modal input:focus {
		outline: none;
		border-color: var(--accent-blue);
	}

	.modal-hint {
		margin: 0.5rem 0 0 0;
		color: var(--text-muted);
		font-size: 0.85rem;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.modal-btn {
		flex: 1;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.modal-btn-primary {
		background: var(--accent-blue);
		color: white;
	}

	.modal-btn-primary:hover {
		background: var(--accent-blue-hover);
	}

	.modal-btn-secondary {
		background: var(--bg-tertiary);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
	}

	.modal-btn-secondary:hover {
		background: var(--border-color);
	}

	.main-content {
		flex: 1;
		background: var(--bg-primary);
	}

	@media (max-width: 767px) {
		.main-content {
			padding-top: 5rem;
		}
	}
</style>
