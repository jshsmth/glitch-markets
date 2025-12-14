import type { Component } from 'svelte';
import {
	RocketIcon,
	StarsIcon,
	CourthouseIcon,
	DollarCircleIcon,
	GlobalIcon,
	DocumentTextIcon,
	TicketIcon,
	GlobalEditIcon,
	DollarChangeIcon
} from '$lib/components/icons';

export interface Category {
	name: string;
	href: string;
	icon?: Component;
	dropdown?: boolean;
	showDivider?: boolean;
}

export const categories: Category[] = [
	{ name: 'Trending', href: '/', icon: RocketIcon },
	{ name: 'New', href: '/new', icon: StarsIcon, showDivider: true },
	{ name: 'Politics', href: '/politics', icon: CourthouseIcon },
	{ name: 'Finance', href: '/finance', icon: DollarCircleIcon },
	{ name: 'Tech', href: '/tech', icon: DocumentTextIcon },
	{ name: 'Culture', href: '/pop-culture', icon: TicketIcon },
	{ name: 'World', href: '/world', icon: GlobalEditIcon },
	{ name: 'Economy', href: '/economy', icon: DollarChangeIcon },
	{ name: 'Geopolitics', href: '/geopolitics', icon: GlobalIcon }
];

// Scroll configuration constants
export const SCROLL_AMOUNT = 200;
export const SCROLL_THRESHOLD = 5;
