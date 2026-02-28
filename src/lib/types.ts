export interface LoanProject {
	id: string;
	name: string;
	principal: number;
	annualRate: number;
	tenureYears: number;
	startMonth: number;
	startYear: number;
	emiOverride?: number;
	preEmiInterest?: number;
	preEmiMonth?: number;
	preEmiYear?: number;
	partPayments: PartPayment[];
	createdAt: number;
}

export interface PartPayment {
	id: string;
	month: number;
	year: number;
	amount: number;
}

export interface AmortizationRow {
	monthIndex: number;
	month: number;
	year: number;
	openingBalance: number;
	emi: number;
	interest: number;
	principal: number;
	partPayment: number;
	closingBalance: number;
}

export interface ExportData {
	version: number;
	projects: ExportProject[];
}

export interface ExportProject {
	name: string;
	principal: number;
	annualRate: number;
	tenureYears: number;
	startMonth: number;
	startYear: number;
	emiOverride?: number;
	preEmiInterest?: number;
	preEmiMonth?: number;
	preEmiYear?: number;
	partPayments: { month: number; year: number; amount: number }[];
}

export interface SavingsAnalysis {
	originalTotalInterest: number;
	reducedTotalInterest: number;
	interestSaved: number;
	originalTenureMonths: number;
	reducedTenureMonths: number;
	monthsSaved: number;
	originalEndDate: { month: number; year: number };
	reducedEndDate: { month: number; year: number };
}
