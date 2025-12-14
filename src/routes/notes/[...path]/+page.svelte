<script>
	import { invalidateAll } from '$app/navigation';
	
	export let data;
	
	let isEditing = false;
	let editContent = '';
	let showPreview = false; // For mobile toggle
	let isSaving = false;
	let previewHtml = '';
	let showDeleteModal = false;
	let showAddChildModal = false;
	let newChildName = '';
	let isDeleting = false;
	let showRenameModal = false;
	let newNoteName = '';
	
	$: htmlContent = data.htmlContent || '';
	
	// Parse markdown on client side for preview only
	async function updatePreview(content) {
		if (typeof window !== 'undefined') {
			const { marked } = await import('marked');
			previewHtml = marked(content);
		}
	}
	
	$: if (editContent && isEditing) {
		updatePreview(editContent);
	}
	
	function startEditing() {
		isEditing = true;
		editContent = data.content || '';
		showPreview = false;
	}
	
	function cancelEditing() {
		isEditing = false;
		editContent = '';
		showPreview = false;
	}
	
	function togglePreview() {
		showPreview = !showPreview;
	}
	
	async function saveNote() {
		isSaving = true;
		try {
			const response = await fetch(`/api/notes/${data.path}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ content: editContent })
			});
			
			if (response.ok) {
				data.content = editContent;
				// Update the rendered HTML
				if (typeof window !== 'undefined') {
					const { marked } = await import('marked');
					data.htmlContent = marked(editContent);
				}
				isEditing = false;
				showPreview = false;
			} else {
				alert('Failed to save note');
			}
		} catch (error) {
			console.error('Error saving note:', error);
			alert('Error saving note');
		} finally {
			isSaving = false;
		}
	}
	
	async function deleteNote() {
		isDeleting = true;
		try {
			const response = await fetch(`/api/notes/${data.path}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				showDeleteModal = false;
				window.location.href = '/';
			} else {
				alert('Failed to delete note');
			}
		} catch (error) {
			console.error('Error deleting note:', error);
			alert('Error deleting note');
		} finally {
			isDeleting = false;
		}
	}
	
	async function createChildNote() {
		if (!newChildName.trim()) return;
		
		try {
			const response = await fetch('/api/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					path: newChildName,
					parentPath: data.path
				})
			});
			
			if (response.ok) {
				const result = await response.json();
				showAddChildModal = false;
				newChildName = '';
				await invalidateAll();
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
	
	async function renameNote() {
		if (!newNoteName.trim()) return;
		
		try {
			const response = await fetch('/api/rename', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					oldPath: data.path,
					newName: newNoteName
				})
			});
			
			if (response.ok) {
				const result = await response.json();
				showRenameModal = false;
				window.location.href = `/notes/${result.newPath}`;
			} else {
				const error = await response.json();
				alert('Failed to rename note: ' + (error.error || 'Unknown error'));
			}
		} catch (error) {
			console.error('Error renaming note:', error);
			alert('Error renaming note');
		}
	}
</script>

<svelte:head>
	<title>{data.title} - Note App</title>
</svelte:head>

<div class="note-container">
	{#if data.error}
		<div class="error">
			<h2>⚠️ {data.title}</h2>
			<p>{data.error}</p>
		</div>
	{:else}
		{#if !isEditing}
			<!-- View mode -->
			<div class="toolbar">
				<div class="toolbar-left">
					<h1 class="note-title">{data.title}</h1>
				</div>
				<div class="toolbar-right">
					<button class="btn btn-primary" on:click={startEditing}>
						✏️ Edit
					</button>
					<button class="btn btn-secondary" on:click={() => { showRenameModal = true; newNoteName = data.title; }}>
						✏️ Rename
					</button>
					<button class="btn btn-success" on:click={() => showAddChildModal = true}>
						➕ Add Child Note
					</button>
					<button class="btn btn-danger" on:click={() => showDeleteModal = true}>
						🗑️ Delete
					</button>
				</div>
			</div>
			<article class="note">
				{@html htmlContent}
			</article>
		{:else}
			<!-- Edit mode -->
			<div class="toolbar">
				<div class="toolbar-left">
					<button class="btn btn-success" on:click={saveNote} disabled={isSaving}>
						{isSaving ? '💾 Saving...' : '💾 Save'}
					</button>
					<button class="btn btn-secondary" on:click={cancelEditing} disabled={isSaving}>
						Cancel
					</button>
				</div>
				<button class="btn btn-toggle" on:click={togglePreview}>
					{showPreview ? '📝 Edit' : '👁️ Preview'}
				</button>
			</div>
			
			<div class="editor-container">
				<div class="editor-pane" class:hidden-mobile={showPreview}>
					<textarea 
						bind:value={editContent}
						placeholder="Write your note in markdown..."
						spellcheck="false"
					></textarea>
				</div>
				<div class="preview-pane" class:hidden-mobile={!showPreview}>
					<article class="note">
						{@html previewHtml}
					</article>
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- Delete confirmation modal -->
{#if showDeleteModal}
	<div class="modal-overlay" on:click={() => showDeleteModal = false}>
		<div class="modal" on:click={(e) => e.stopPropagation()}>
			<h3>⚠️ Delete Note</h3>
			<p>Are you sure you want to delete "{data.title}"? This action cannot be undone.</p>
			<div class="modal-actions">
				<button class="modal-btn modal-btn-danger" on:click={deleteNote} disabled={isDeleting}>
					{isDeleting ? 'Deleting...' : 'Delete'}
				</button>
				<button class="modal-btn modal-btn-secondary" on:click={() => showDeleteModal = false} disabled={isDeleting}>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Add child note modal -->
{#if showAddChildModal}
	<div class="modal-overlay" on:click={() => { showAddChildModal = false; newChildName = ''; }}>
		<div class="modal" on:click={(e) => e.stopPropagation()}>
			<h3>Create Child Note</h3>
			<input
				type="text"
				bind:value={newChildName}
				on:keydown={(e) => e.key === 'Enter' && createChildNote()}
				placeholder="Enter note name..."
				autofocus
			/>
			<p class="modal-hint">Parent note: {data.title}</p>
			<div class="modal-actions">
				<button class="modal-btn modal-btn-primary" on:click={createChildNote}>
					Create
				</button>
				<button class="modal-btn modal-btn-secondary" on:click={() => { showAddChildModal = false; newChildName = ''; }}>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Rename note modal -->
{#if showRenameModal}
	<div class="modal-overlay" on:click={() => { showRenameModal = false; newNoteName = ''; }}>
		<div class="modal" on:click={(e) => e.stopPropagation()}>
			<h3>Rename Note</h3>
			<input
				type="text"
				bind:value={newNoteName}
				on:keydown={(e) => e.key === 'Enter' && renameNote()}
				placeholder="Enter new name..."
				autofocus
			/>
			<div class="modal-actions">
				<button class="modal-btn modal-btn-primary" on:click={renameNote}>
					Rename
				</button>
				<button class="modal-btn modal-btn-secondary" on:click={() => { showRenameModal = false; newNoteName = ''; }}>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.note-container {
		margin: 0 auto;
		display: flex;
		flex-direction: column;
        height: 100dvh;
        overflow: auto;
	}

	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-color);
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.toolbar-left {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.toolbar-right {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.note-title {
		margin: 0;
		font-size: 1.5rem;
		color: var(--text-primary);
		font-weight: 600;
	}

	@media (max-width: 767px) {
		.toolbar {
			flex-direction: column;
			align-items: flex-start;
		}

		.toolbar-right {
			width: 100%;
			flex-wrap: wrap;
		}

		.btn {
			flex: 1;
			min-width: auto;
		}
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary {
		background: #2563eb;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #1d4ed8;
	}

	.btn-success {
		background: #10b981;
		color: white;
	}

	.btn-success:hover:not(:disabled) {
		background: #059669;
	}

	.btn-secondary {
		background: #64748b;
		color: white;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #475569;
	}

	.btn-danger {
		background: #ef4444;
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		background: #dc2626;
	}

	.btn-toggle {
		display: none;
		background: #8b5cf6;
		color: white;
	}

	.btn-toggle:hover {
		background: #7c3aed;
	}

	@media (max-width: 767px) {
		.btn-toggle {
			display: block;
		}
	}

	.editor-container {
		display: flex;
		flex: 1;
		gap: 1px;
		background: #e2e8f0;
	}

	.editor-pane,
	.preview-pane {
		flex: 1;
		background: var(--bg-primary);
	}

	@media (max-width: 767px) {
		.hidden-mobile {
			display: none;
		}

		.editor-pane:not(.hidden-mobile),
		.preview-pane:not(.hidden-mobile) {
			flex: none;
			width: 100%;
		}
	}

	.editor-pane textarea {
		width: 100%;
		height: 100%;
		padding: 1rem;
		margin: 0;
		border: none;
		outline: none;
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
		font-size: 1rem;
		line-height: 1.8;
		resize: none;
		color: var(--text-primary);
		background: var(--bg-primary);
		box-sizing: border-box;
		overflow-x: hidden;
		word-wrap: break-word;
		white-space: pre-wrap;
	}

	.preview-pane {
		padding: 1rem;
		border-left: 1px solid var(--border-color);
	}

	.preview-pane .note {
		padding: 0;
	}

	@media (max-width: 767px) {
		.preview-pane {
			border-left: none;
		}
	}

	.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		padding: 2rem;
		color: #991b1b;
		margin: 2rem;
	}

	.error h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
	}

	.error p {
		margin: 0;
		color: #dc2626;
	}

	.note {
		line-height: 1.8;
		color: var(--text-primary);
        padding: 2rem 4rem;
	}

	:global(.note h1) {
		font-size: 2.5rem;
		margin: 0 0 1rem 0;
		color: var(--text-primary);
		border-bottom: 2px solid var(--border-color);
		padding-bottom: 0.5rem;
	}

	:global(.note h2) {
		font-size: 2rem;
		margin: 2rem 0 1rem 0;
		color: var(--text-primary);
	}

	:global(.note h3) {
		font-size: 1.5rem;
		margin: 1.5rem 0 0.75rem 0;
		color: var(--text-secondary);
	}

	:global(.note h4) {
		font-size: 1.25rem;
		margin: 1.25rem 0 0.75rem 0;
		color: var(--text-secondary);
	}

	:global(.note p) {
		margin: 0 0 1rem 0;
		font-size: 1.05rem;
	}

	:global(.note ul, .note ol) {
		margin: 0 0 1rem 0;
		padding-left: 2rem;
	}

	:global(.note li) {
		margin: 0.5rem 0;
	}

	:global(.note code) {
		background: var(--bg-tertiary);
		padding: 0.2rem 0.4rem;
		border-radius: 4px;
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
		font-size: 0.9em;
		color: var(--accent-blue);
	}

	:global(.note pre) {
		background: var(--bg-secondary);
		color: var(--text-primary);
		padding: 1.5rem;
		border-radius: 8px;
		overflow-x: auto;
		margin: 1rem 0;
		line-height: 1.5;
		border: 1px solid var(--border-color);
	}

	:global(.note pre code) {
		background: transparent;
		padding: 0;
		color: inherit;
		font-size: 0.95rem;
	}

	:global(.note blockquote) {
		border-left: 4px solid var(--accent-blue);
		padding-left: 1.5rem;
		margin: 1rem 0;
		color: var(--text-secondary);
		font-style: italic;
	}

	:global(.note a) {
		color: var(--accent-blue);
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition: border-color 0.2s;
	}

	:global(.note a:hover) {
		border-bottom-color: var(--accent-blue);
	}

	:global(.note table) {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0;
	}

	:global(.note th, .note td) {
		border: 1px solid var(--border-color);
		padding: 0.75rem;
		text-align: left;
	}

	:global(.note th) {
		background: var(--bg-secondary);
		font-weight: 600;
		color: var(--text-primary);
	}

	:global(.note tr:hover) {
		background: var(--bg-secondary);
	}

	:global(.note img) {
		max-width: 100%;
		height: auto;
		border-radius: 8px;
		margin: 1rem 0;
	}

	:global(.note hr) {
		border: none;
		border-top: 2px solid var(--border-color);
		margin: 2rem 0;
	}

	@media (max-width: 767px) {
		:global(.note h1) {
			font-size: 2rem;
		}

		:global(.note h2) {
			font-size: 1.5rem;
		}

		:global(.note h3) {
			font-size: 1.25rem;
		}

		:global(.note pre) {
			padding: 1rem;
			font-size: 0.85rem;
		}
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
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	.modal h3 {
		margin: 0 0 1.5rem 0;
		color: var(--text-primary);
		font-size: 1.5rem;
	}

	.modal p {
		margin: 0 0 1rem 0;
		color: var(--text-secondary);
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

	.modal-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.modal-btn-primary {
		background: var(--accent-blue);
		color: white;
	}

	.modal-btn-primary:hover:not(:disabled) {
		background: var(--accent-blue-hover);
	}

	.modal-btn-secondary {
		background: var(--bg-tertiary);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
	}

	.modal-btn-secondary:hover:not(:disabled) {
		background: var(--border-color);
	}

	.modal-btn-danger {
		background: #ef4444;
		color: white;
	}

	.modal-btn-danger:hover:not(:disabled) {
		background: #dc2626;
	}
</style>
