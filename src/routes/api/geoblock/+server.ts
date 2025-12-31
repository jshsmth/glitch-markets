import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export interface GeoblockResponse {
	blocked: boolean;
	ip: string;
	country: string;
	region: string;
}

export const GET: RequestHandler = async ({ fetch }) => {
	try {
		const response = await fetch('https://polymarket.com/api/geoblock');

		if (!response.ok) {
			throw new Error(`Geoblock API returned ${response.status}`);
		}

		const data: GeoblockResponse = await response.json();

		return json(data);
	} catch (error) {
		return json(
			{
				blocked: false,
				ip: '',
				country: '',
				region: '',
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
