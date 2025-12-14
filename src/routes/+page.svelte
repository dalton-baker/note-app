<div class="landing">
	<h1>📝 Welcome to Your Note App</h1>
	<p>Select a note from the sidebar to get started, or create a new one!</p>
	
	<div class="features">
		<div class="feature">
			<h3>📁 Organized</h3>
			<p>Keep your notes organized with folders</p>
		</div>
		<div class="feature">
			<h3>📱 Mobile Friendly</h3>
			<p>Access your notes on any device</p>
		</div>
		<div class="feature">
			<h3>💾 File-based</h3>
			<p>Notes are stored as markdown files in /notes</p>
		</div>
	</div>
</div>

<style>
	.landing {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	h1 {
		font-size: 2.5rem;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.landing > p {
		font-size: 1.2rem;
		color: var(--text-muted);
		margin-bottom: 3rem;
	}

	.features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 2rem;
		margin-top: 3rem;
	}

	.feature {
		background: var(--bg-secondary);
		padding: 2rem;
		border-radius: 12px;
		border: 1px solid var(--border-color);
		transition: all 0.3s;
	}

	.feature:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 12px var(--shadow);
		border-color: var(--text-muted);
	}

	.feature h3 {
		margin: 0 0 0.75rem 0;
		font-size: 1.25rem;
		color: var(--text-primary);
	}

	.feature p {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.95rem;
	}

	@media (max-width: 767px) {
		h1 {
			font-size: 2rem;
		}

		.landing {
			padding: 1rem;
		}

		.features {
			gap: 1rem;
		}
	}
</style>
