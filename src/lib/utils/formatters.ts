const currencyFormatter = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	maximumFractionDigits: 0
});

const currencyFormatterDetailed = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	maximumFractionDigits: 2
});

export function formatCurrency(amount: number): string {
	return currencyFormatter.format(amount);
}

export function formatCurrencyDetailed(amount: number): string {
	return currencyFormatterDetailed.format(amount);
}

export function formatNumber(num: number): string {
	return new Intl.NumberFormat('en-IN').format(Math.round(num));
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatMonthYear(month: number, year: number): string {
	return `${monthNames[month - 1]} ${year}`;
}

export function formatPercentage(value: number): string {
	return `${value.toFixed(2)}%`;
}
