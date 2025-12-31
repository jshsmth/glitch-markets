import type { GeoblockResponse } from '../../routes/api/geoblock/+server';
import { Logger } from '$lib/utils/logger';

const log = Logger.forComponent('GeoblockStore');

interface GeoblockState {
	isBlocked: boolean;
	isChecked: boolean;
	country: string;
	region: string;
}

const state = $state<GeoblockState>({
	isBlocked: false,
	isChecked: false,
	country: '',
	region: ''
});

export const geoblockState = {
	get isBlocked() {
		return state.isBlocked;
	},
	get isChecked() {
		return state.isChecked;
	},
	get country() {
		return state.country;
	},
	get region() {
		return state.region;
	}
};

export async function checkGeoblock() {
	try {
		const response = await fetch('/api/geoblock');
		const data: GeoblockResponse = await response.json();

		state.isBlocked = data.blocked;
		state.country = data.country;
		state.region = data.region;
		state.isChecked = true;

		if (data.blocked) {
			log.info('User is in a restricted jurisdiction', {
				country: data.country,
				region: data.region
			});
		}
	} catch (error) {
		log.error('Failed to check geoblock status', error);
		state.isChecked = true;
	}
}
