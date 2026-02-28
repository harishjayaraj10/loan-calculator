import type { AmortizationRow, LoanProject, PartPayment, SavingsAnalysis } from '$lib/types';

export function calculateEMI(principal: number, annualRate: number, tenureYears: number): number {
	const r = annualRate / 12 / 100;
	const n = tenureYears * 12;
	if (r === 0) return principal / n;
	return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function addMonth(month: number, year: number): { month: number; year: number } {
	if (month === 12) return { month: 1, year: year + 1 };
	return { month: month + 1, year };
}

export function generateAmortization(
	project: LoanProject,
	includePartPayments: boolean = true
): AmortizationRow[] {
	const r = project.annualRate / 12 / 100;
	const n = project.tenureYears * 12;
	const calculatedEmi = calculateEMI(project.principal, project.annualRate, project.tenureYears);
	const emi = project.emiOverride || calculatedEmi;
	const rows: AmortizationRow[] = [];

	let balance = project.principal;
	let currentMonth = project.startMonth;
	let currentYear = project.startYear;

	// Part payments keyed by the month they are PAID (for display).
	// But the balance reduction takes effect from the NEXT month.
	const ppDisplayMap = new Map<string, number>();
	const ppEffectMap = new Map<string, number>();
	if (includePartPayments) {
		for (const pp of project.partPayments) {
			const displayKey = `${pp.year}-${pp.month}`;
			ppDisplayMap.set(displayKey, (ppDisplayMap.get(displayKey) || 0) + pp.amount);
			const effective = addMonth(pp.month, pp.year);
			const effectKey = `${effective.year}-${effective.month}`;
			ppEffectMap.set(effectKey, (ppEffectMap.get(effectKey) || 0) + pp.amount);
		}
	}

	for (let i = 0; i < n * 2 && balance > 0.01; i++) {
		// Apply part payment effect (paid previous month, reduces balance this month)
		const effectKey = `${currentYear}-${currentMonth}`;
		const ppEffect = Math.min(ppEffectMap.get(effectKey) || 0, balance);
		balance -= ppEffect;
		if (balance < 0.01) balance = 0;
		if (balance === 0) break;

		const interest = balance * r;
		let principalPortion = emi - interest;

		if (principalPortion > balance) {
			principalPortion = balance;
		}

		let closingBalance = balance - principalPortion;
		if (closingBalance < 0.01) closingBalance = 0;

		// Display the part payment on the month it was paid
		const displayKey = `${currentYear}-${currentMonth}`;
		const ppDisplay = ppDisplayMap.get(displayKey) || 0;

		rows.push({
			monthIndex: i,
			month: currentMonth,
			year: currentYear,
			openingBalance: balance,
			emi: principalPortion + interest > balance + interest ? balance + interest : emi,
			interest,
			principal: principalPortion,
			partPayment: ppDisplay,
			closingBalance
		});

		balance = closingBalance;
		const next = addMonth(currentMonth, currentYear);
		currentMonth = next.month;
		currentYear = next.year;
	}

	return rows;
}

export function calculateSavings(project: LoanProject): SavingsAnalysis {
	const withoutPP = generateAmortization(project, false);
	const withPP = generateAmortization(project, true);

	const originalTotalInterest = withoutPP.reduce((sum, row) => sum + row.interest, 0);
	const reducedTotalInterest = withPP.reduce((sum, row) => sum + row.interest, 0);

	const lastWithout = withoutPP[withoutPP.length - 1];
	const lastWith = withPP[withPP.length - 1];

	return {
		originalTotalInterest,
		reducedTotalInterest,
		interestSaved: originalTotalInterest - reducedTotalInterest,
		originalTenureMonths: withoutPP.length,
		reducedTenureMonths: withPP.length,
		monthsSaved: withoutPP.length - withPP.length,
		originalEndDate: { month: lastWithout.month, year: lastWithout.year },
		reducedEndDate: { month: lastWith.month, year: lastWith.year }
	};
}

export function getPaidEMIs(project: LoanProject): number {
	const now = new Date();
	const currentMonth = now.getMonth() + 1;
	const currentYear = now.getFullYear();

	let count = 0;
	let m = project.startMonth;
	let y = project.startYear;
	const totalMonths = project.tenureYears * 12;

	for (let i = 0; i < totalMonths; i++) {
		if (y < currentYear || (y === currentYear && m <= currentMonth)) {
			count++;
		} else {
			break;
		}
		const next = addMonth(m, y);
		m = next.month;
		y = next.year;
	}

	return count;
}

export function generateId(): string {
	return crypto.randomUUID();
}
