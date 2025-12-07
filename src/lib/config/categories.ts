import type { Component } from 'svelte';
import {
	RocketIcon,
	FlashIcon,
	StarsIcon,
	CourthouseIcon,
	CupIcon,
	DollarCircleIcon,
	BitcoinCardIcon,
	GlobalIcon,
	DollarSquareIcon,
	DocumentTextIcon,
	TicketIcon,
	GlobalEditIcon,
	DollarChangeIcon,
	SpeakerIcon,
	MessageTextIcon
} from '$lib/components/icons';

export interface Category {
	name: string;
	href: string;
	icon?: Component;
	dropdown?: boolean;
}

export const categories: Category[] = [
	{ name: 'Trending', href: '/', icon: RocketIcon },
	{ name: 'Breaking', href: '/breaking', icon: FlashIcon },
	{ name: 'New', href: '/new', icon: StarsIcon },
	{ name: 'Politics', href: '/politics', icon: CourthouseIcon },
	{ name: 'Sports', href: '/sports', icon: CupIcon },
	{ name: 'Finance', href: '/finance', icon: DollarCircleIcon },
	{ name: 'Crypto', href: '/crypto', icon: BitcoinCardIcon },
	{ name: 'Tech', href: '/tech', icon: DocumentTextIcon },
	{ name: 'Culture', href: '/pop-culture', icon: TicketIcon },
	{ name: 'World', href: '/world', icon: GlobalEditIcon },
	{ name: 'Economy', href: '/economy', icon: DollarChangeIcon },
	{ name: 'Elections', href: '/elections', icon: SpeakerIcon },
	{ name: 'Earnings', href: '/earnings', icon: DollarSquareIcon },
	{ name: 'Geopolitics', href: '/geopolitics', icon: GlobalIcon },
	{ name: 'Mentions', href: '/mentions', icon: MessageTextIcon }
];

// Scroll configuration constants
export const SCROLL_AMOUNT = 200;
export const SCROLL_THRESHOLD = 5;
