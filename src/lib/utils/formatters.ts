const currencyFormatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	notation: 'compact',
	minimumFractionDigits: 0,
	maximumFractionDigits: 1
});

const percentFormatter = new Intl.NumberFormat('en-US', {
	style: 'percent',
	minimumFractionDigits: 1,
	maximumFractionDigits: 1
});

const numberFormatter = new Intl.NumberFormat('en-US', {
	minimumFractionDigits: 0,
	maximumFractionDigits: 2
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: 'numeric',
	hour: 'numeric',
	minute: '2-digit',
	hour12: true
});

export function formatCurrency(value: number): string {
	return currencyFormatter.format(value);
}

export function formatCompactCurrency(value: number): string {
	return compactCurrencyFormatter.format(value);
}

export function formatPercent(percent: number): string {
	const sign = percent >= 0 ? '+' : '';
	return `${sign}${percent.toFixed(1)}%`;
}

export function formatNumber(value: number): string {
	return numberFormatter.format(value);
}

export function formatPrice(price: number): string {
	return `${(price * 100).toFixed(0)}¢`;
}

export function formatDateTime(timestamp: number): string {
	const date = new Date(timestamp * 1000);
	return dateTimeFormatter.format(date);
}

export function formatPercentageFromDecimal(decimal: number): string {
	return percentFormatter.format(decimal);
}
