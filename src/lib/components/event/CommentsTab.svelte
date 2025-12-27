<script lang="ts">
	import type { Comment } from '$lib/server/api/polymarket-client';
	import { formatRelativeTime } from '$lib/utils/event-helpers';

	interface Props {
		comments: Comment[] | undefined;
		isLoading: boolean;
	}

	let { comments, isLoading }: Props = $props();
</script>

{#if isLoading}
	<div class="tab-empty">Loading...</div>
{:else if comments?.length}
	<div class="comments-list">
		{#each comments as comment (comment.id)}
			<div class="comment">
				<div class="comment-avatar">
					{#if comment.profile?.profileImage}
						<img
							src={comment.profile.profileImage}
							alt={comment.profile?.name || comment.profile?.pseudonym || 'User avatar'}
							loading="lazy"
						/>
					{/if}
				</div>
				<div class="comment-body">
					<div class="comment-meta">
						<span class="comment-author">
							{comment.profile?.name || comment.profile?.pseudonym || 'Anon'}
						</span>
						<span class="comment-time">{formatRelativeTime(comment.createdAt)}</span>
					</div>
					<p>{comment.body}</p>
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div class="tab-empty">No comments yet</div>
{/if}

<style>
	.tab-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100px;
		color: var(--text-3);
		font-size: 14px;
	}

	.comments-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.comment {
		display: flex;
		gap: 10px;
	}

	.comment-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--bg-3);
		overflow: hidden;
		flex-shrink: 0;
	}

	.comment-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.comment-body {
		flex: 1;
		min-width: 0;
	}

	.comment-meta {
		display: flex;
		gap: 8px;
		margin-bottom: 4px;
	}

	.comment-author {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-0);
	}

	.comment-time {
		font-size: 12px;
		color: var(--text-3);
	}

	.comment-body p {
		font-size: 14px;
		color: var(--text-1);
		margin: 0;
		line-height: 1.5;
	}
</style>
