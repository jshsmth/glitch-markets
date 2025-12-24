import type { Component } from 'svelte';
import {
	EthereumIcon,
	PolygonIcon,
	OptimismIcon,
	ArbitrumIcon,
	BscIcon,
	BaseIcon,
	AvalancheIcon
} from '$lib/components/icons/chains';

export interface ChainConfig {
	icon: Component;
	color: string;
	name: string;
}

export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
	'1': {
		icon: EthereumIcon,
		color: '#627EEA',
		name: 'Ethereum'
	},
	'10': {
		icon: OptimismIcon,
		color: '#FF0420',
		name: 'Optimism'
	},
	'137': {
		icon: PolygonIcon,
		color: '#8247E5',
		name: 'Polygon'
	},
	'42161': {
		icon: ArbitrumIcon,
		color: '#28A0F0',
		name: 'Arbitrum'
	},
	'56': {
		icon: BscIcon,
		color: '#F0B90B',
		name: 'BSC'
	},
	'8453': {
		icon: BaseIcon,
		color: '#0052FF',
		name: 'Base'
	},
	'43114': {
		icon: AvalancheIcon,
		color: '#E84142',
		name: 'Avalanche'
	}
};

export function getChainConfig(chainId: string): ChainConfig {
	return (
		CHAIN_CONFIGS[chainId] ?? {
			icon: EthereumIcon,
			color: 'var(--text-1)',
			name: 'Unknown'
		}
	);
}

export function getChainIcon(chainId: string): Component {
	return getChainConfig(chainId).icon;
}

export function getChainColor(chainId: string): string {
	return getChainConfig(chainId).color;
}

export function getChainName(chainId: string): string {
	return getChainConfig(chainId).name;
}
