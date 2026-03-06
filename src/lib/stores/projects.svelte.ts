import type { LoanProject, PartPayment, StepUpEmi, ExportData } from '$lib/types';
import { generateId } from '$lib/utils/calculations';

const STORAGE_KEY = 'loan-calculator-projects';

function loadFromStorage(): LoanProject[] {
	if (typeof window === 'undefined') return [];
	try {
		const data = localStorage.getItem(STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	} catch {
		return [];
	}
}

function saveToStorage(projects: LoanProject[]) {
	if (typeof window === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

let projects = $state<LoanProject[]>([]);
let initialized = false;

export function initStore() {
	if (initialized) return;
	projects = loadFromStorage().map((p) => ({
		...p,
		stepUpEmis: p.stepUpEmis || []
	}));
	initialized = true;
}

export function getProjects(): LoanProject[] {
	return projects;
}

export function getProject(id: string): LoanProject | undefined {
	return projects.find((p) => p.id === id);
}

export function addProject(data: {
	name: string;
	principal: number;
	annualRate: number;
	tenureYears: number;
	startMonth: number;
	startYear: number;
	emiOverride?: number;
}): string {
	const id = generateId();
	const project: LoanProject = {
		...data,
		id,
		partPayments: [],
		stepUpEmis: [],
		createdAt: Date.now()
	};
	projects.push(project);
	saveToStorage(projects);
	return id;
}

export function updateProject(id: string, data: Partial<Omit<LoanProject, 'id' | 'createdAt' | 'partPayments' | 'stepUpEmis'>>) {
	const idx = projects.findIndex((p) => p.id === id);
	if (idx === -1) return;
	projects[idx] = { ...projects[idx], ...data };
	saveToStorage(projects);
}

export function deleteProject(id: string) {
	const idx = projects.findIndex((p) => p.id === id);
	if (idx === -1) return;
	projects.splice(idx, 1);
	saveToStorage(projects);
}

export function addPartPayment(
	projectId: string,
	data: { month: number; year: number; amount: number }
): string | null {
	const project = projects.find((p) => p.id === projectId);
	if (!project) return null;
	const id = generateId();
	const pp: PartPayment = { ...data, id };
	project.partPayments.push(pp);
	saveToStorage(projects);
	return id;
}

export function removePartPayment(projectId: string, ppId: string) {
	const project = projects.find((p) => p.id === projectId);
	if (!project) return;
	const idx = project.partPayments.findIndex((pp) => pp.id === ppId);
	if (idx === -1) return;
	project.partPayments.splice(idx, 1);
	saveToStorage(projects);
}

export function updatePartPayment(
	projectId: string,
	ppId: string,
	data: { month: number; year: number; amount: number }
) {
	const project = projects.find((p) => p.id === projectId);
	if (!project) return;
	const pp = project.partPayments.find((p) => p.id === ppId);
	if (!pp) return;
	pp.month = data.month;
	pp.year = data.year;
	pp.amount = data.amount;
	saveToStorage(projects);
}

export function addStepUpEmi(
	projectId: string,
	data: { month: number; year: number; newEmi: number }
): string | null {
	const project = projects.find((p) => p.id === projectId);
	if (!project) return null;
	const id = generateId();
	const stepUp: StepUpEmi = { ...data, id };
	project.stepUpEmis.push(stepUp);
	saveToStorage(projects);
	return id;
}

export function removeStepUpEmi(projectId: string, stepUpId: string) {
	const project = projects.find((p) => p.id === projectId);
	if (!project) return;
	const idx = project.stepUpEmis.findIndex((s) => s.id === stepUpId);
	if (idx === -1) return;
	project.stepUpEmis.splice(idx, 1);
	saveToStorage(projects);
}

export function updateStepUpEmi(
	projectId: string,
	stepUpId: string,
	data: { month: number; year: number; newEmi: number }
) {
	const project = projects.find((p) => p.id === projectId);
	if (!project) return;
	const stepUp = project.stepUpEmis.find((s) => s.id === stepUpId);
	if (!stepUp) return;
	stepUp.month = data.month;
	stepUp.year = data.year;
	stepUp.newEmi = data.newEmi;
	saveToStorage(projects);
}

export function exportProjects(projectIds?: string[]): ExportData {
	const toExport = projectIds ? projects.filter((p) => projectIds.includes(p.id)) : projects;

	return {
		version: 1,
		projects: toExport.map((p) => ({
			name: p.name,
			principal: p.principal,
			annualRate: p.annualRate,
			tenureYears: p.tenureYears,
			startMonth: p.startMonth,
			startYear: p.startYear,
			...(p.emiOverride && { emiOverride: p.emiOverride }),
			partPayments: p.partPayments.map((pp) => ({
				month: pp.month,
				year: pp.year,
				amount: pp.amount
			})),
			...(p.stepUpEmis.length > 0 && {
				stepUpEmis: p.stepUpEmis.map((s) => ({
					month: s.month,
					year: s.year,
					newEmi: s.newEmi
				}))
			})
		}))
	};
}

export function importProjects(data: ExportData): number {
	if (data.version !== 1 || !Array.isArray(data.projects)) {
		throw new Error('Invalid import format');
	}

	let count = 0;
	for (const p of data.projects) {
		const projectId = addProject({
			name: p.name,
			principal: p.principal,
			annualRate: p.annualRate,
			tenureYears: p.tenureYears,
			startMonth: p.startMonth,
			startYear: p.startYear,
			...(p.emiOverride && { emiOverride: p.emiOverride })
		});
		for (const pp of p.partPayments || []) {
			addPartPayment(projectId, {
				month: pp.month,
				year: pp.year,
				amount: pp.amount
			});
		}
		for (const s of p.stepUpEmis || []) {
			addStepUpEmi(projectId, {
				month: s.month,
				year: s.year,
				newEmi: s.newEmi
			});
		}
		count++;
	}
	return count;
}
