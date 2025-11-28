<script lang="ts">
	import { page } from '$app/state';

	interface Category {
		name: string;
		href: string;
		dropdown?: boolean;
	}

	const categories: Category[] = [
		{ name: 'Trending', href: '/?category=trending' },
		{ name: 'Breaking', href: '/?category=breaking' },
		{ name: 'New', href: '/?category=new' },
		{ name: 'Politics', href: '/?category=politics' },
		{ name: 'Sports', href: '/?category=sports' },
		{ name: 'Finance', href: '/?category=finance' },
		{ name: 'Crypto', href: '/?category=crypto' },
		{ name: 'Geopolitics', href: '/?category=geopolitics' },
		{ name: 'Earnings', href: '/?category=earnings' },
		{ name: 'Tech', href: '/?category=tech' },
		{ name: 'Culture', href: '/?category=culture' },
		{ name: 'World', href: '/?category=world' },
		{ name: 'Economy', href: '/?category=economy' },
		{ name: 'Elections', href: '/?category=elections' },
		{ name: 'Mentions', href: '/?category=mentions' },
		{ name: 'More', href: '/?category=more', dropdown: true }
	];

	let activeCategory = $derived(page.url.searchParams.get('category') || 'trending');
</script>

<div class="sub-header">
	<nav class="nav-scroll">
		<ul class="nav-list">
			{#each categories as category (category.name)}
				<li class="nav-item">
					<a
						href={category.href}
						class="nav-link"
						class:active={activeCategory === category.name.toLowerCase()}
					>
						{category.name}
						{#if category.dropdown}
							<svg
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="dropdown-icon"
							>
								<polyline points="6 9 12 15 18 9"></polyline>
							</svg>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</div>

<style>
	.sub-header {
		background-color: var(--bg-0);
	}

	.nav-scroll {
		overflow-x: auto;
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE/Edge */
	}

	.nav-scroll::-webkit-scrollbar {
		display: none;
	}

	.nav-list {
		display: flex;
		align-items: center;
		gap: 24px;
		list-style: none;
		margin: 0;
		padding: 0 12px;
		height: 48px;
	}

	@media (min-width: 768px) {
		.nav-scroll {
			max-width: 1400px;
			margin: 0 auto;
		}

		.nav-list {
			padding: 0 24px;
		}

		.nav-list li:first-child .nav-link {
			padding-left: 0;
		}
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 8px;
		text-decoration: none;
		color: var(--text-2);
		font-size: 15px;
		font-weight: 600;
		white-space: nowrap;
		height: 48px;
		border-bottom: 2px solid transparent;
		transition: color 0.2s ease;
	}

	.nav-link:hover {
		color: var(--text-1);
	}

	.nav-link.active {
		color: var(--text-0);
		border-bottom-color: var(--text-0);
	}

	.dropdown-icon {
		margin-left: 2px;
	}
</style>
