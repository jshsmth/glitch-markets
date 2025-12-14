<script lang="ts">
	import type { Profile } from '$lib/server/api/polymarket-client';

	interface Props {
		profile: Profile;
		onclick?: () => void;
	}

	let { profile, onclick }: Props = $props();

	const avatarGradient = 'linear-gradient(135deg, #e6c76a 0%, #d4af37 100%)';

	const displayName = $derived(
		profile.name || profile.pseudonym || profile.id?.slice(0, 8) || 'Unknown User'
	);
	const profileImage = $derived(profile.profileImageOptimized || profile.profileImage);
	const href = $derived(`/search?q=${encodeURIComponent(displayName)}`);
</script>

<a {href} class="profile-list-item" {onclick} role="button" tabindex="0">
	<div class="profile-avatar">
		{#if profileImage}
			<img src={profileImage} alt={displayName} loading="lazy" />
		{:else}
			<div class="avatar-gradient" style="background: {avatarGradient}"></div>
		{/if}
	</div>

	<div class="profile-info">
		<div class="profile-name">{displayName}</div>
		{#if profile.bio}
			<div class="profile-bio">{profile.bio}</div>
		{/if}
	</div>
</a>

<style>
	.profile-list-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 12px;
		border-radius: var(--radius-md);
		text-decoration: none;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.profile-list-item:hover {
		background-color: var(--primary-hover-bg);
	}

	.profile-list-item:focus-visible {
		outline: none;
		box-shadow: var(--focus-ring);
	}

	.profile-list-item:active {
		transform: scale(0.99);
	}

	.profile-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
	}

	.profile-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-gradient {
		width: 100%;
		height: 100%;
	}

	.profile-info {
		flex: 1;
		min-width: 0;
	}

	.profile-name {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-0);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.profile-bio {
		font-size: 12px;
		color: var(--text-2);
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		line-height: 1.4;
		margin-top: 2px;
	}
</style>
