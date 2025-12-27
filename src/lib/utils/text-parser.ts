export interface ParsedSegment {
	type: 'text' | 'url';
	content: string;
	domain?: string;
	iconType?: 'x' | 'github' | 'linkedin' | 'discord' | 'global';
}

function getDomainFromUrl(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return url;
	}
}

function getIconTypeForDomain(domain: string): ParsedSegment['iconType'] {
	if (domain.includes('twitter.com') || domain.includes('x.com')) return 'x';
	if (domain.includes('github.com')) return 'github';
	if (domain.includes('linkedin.com')) return 'linkedin';
	if (domain.includes('discord.com') || domain.includes('discord.gg')) return 'discord';
	return 'global';
}

export function parseTextWithUrls(text: string): ParsedSegment[] {
	const urlRegex = /(https?:\/\/[^\s<>()[\]]+?)([.,;:!?)]*(?:\s|$))/g;
	const segments: ParsedSegment[] = [];
	let lastIndex = 0;
	let match;
	while ((match = urlRegex.exec(text)) !== null) {
		if (match.index > lastIndex) {
			segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
		}
		const url = match[1];
		const domain = getDomainFromUrl(url);
		segments.push({ type: 'url', content: url, domain, iconType: getIconTypeForDomain(domain) });
		if (match[2]) {
			segments.push({ type: 'text', content: match[2] });
		}
		lastIndex = match.index + match[0].length;
	}
	if (lastIndex < text.length) {
		segments.push({ type: 'text', content: text.slice(lastIndex) });
	}
	return segments;
}
