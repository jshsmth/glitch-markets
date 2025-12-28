/**
 * Filter configurations for events and markets
 */

/**
 * Tag IDs to exclude from trending/home feeds
 *
 * Based on Polymarket's tag system:
 * - 1: Sports (main sports category, appears in ALL sports events)
 * - 100639: Games (general games/sports category)
 * - 64: Esports (competitive gaming events)
 *
 * Excluding these three tags filters out all sports, games, and esports content
 * from the home/trending feed while keeping politics, finance, tech, etc.
 */
export const EXCLUDED_SPORTS_TAG_IDS = [1, 100639, 64] as const;

/**
 * Helper to append tag exclusions to URLSearchParams
 * Uses the array spread to append each tag ID individually
 */
export function appendExcludedTags(params: URLSearchParams, tagIds: readonly number[]): void {
	tagIds.forEach((id) => params.append('exclude_tag_id', String(id)));
}
