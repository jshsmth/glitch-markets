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
	{ name: 'Trending', href: '/?category=trending', icon: RocketIcon },
	{ name: 'Breaking', href: '/?category=breaking', icon: FlashIcon },
	{ name: 'New', href: '/?category=new', icon: StarsIcon },
	{ name: 'Politics', href: '/?category=politics', icon: CourthouseIcon },
	{ name: 'Sports', href: '/?category=sports', icon: CupIcon },
	{ name: 'Finance', href: '/?category=finance', icon: DollarCircleIcon },
	{ name: 'Crypto', href: '/?category=crypto', icon: BitcoinCardIcon },
	{ name: 'Tech', href: '/?category=tech', icon: DocumentTextIcon },
	{ name: 'Culture', href: '/?category=culture', icon: TicketIcon },
	{ name: 'World', href: '/?category=world', icon: GlobalEditIcon },
	{ name: 'Economy', href: '/?category=economy', icon: DollarChangeIcon },
	{ name: 'Elections', href: '/?category=elections', icon: SpeakerIcon },
	{ name: 'Earnings', href: '/?category=earnings', icon: DollarSquareIcon },
	{ name: 'Geopolitics', href: '/?category=geopolitics', icon: GlobalIcon },
	{ name: 'Mentions', href: '/?category=mentions', icon: MessageTextIcon }
];

// Scroll configuration constants
export const SCROLL_AMOUNT = 200;
export const SCROLL_THRESHOLD = 5;
