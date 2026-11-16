// Facts about the supported once-weekly GLP-1 / GIP medicines, taken from the
// product labels. Broono records what the user takes; it never recommends a dose.

export type MedicationName =
  | 'Zepbound'
  | 'Mounjaro'
  | 'Wegovy'
  | 'Ozempic'
  | 'Tirzepatide (compounded)'
  | 'Semaglutide (compounded)'

export type Ingredient = 'tirzepatide' | 'semaglutide'

interface MedicationInfo {
  ingredient: Ingredient
  /** Standard pen strengths in mg, used as quick picks. Any dose can be typed. */
  strengths: number[]
  /** Label guidance for a missed weekly dose: take it within this many days, otherwise skip it. */
  missedDoseWindowDays: number
}

export const MEDICATION_INFO: Record<MedicationName, MedicationInfo> = {
  Zepbound: { ingredient: 'tirzepatide', strengths: [2.5, 5, 7.5, 10, 12.5, 15], missedDoseWindowDays: 4 },
  Mounjaro: { ingredient: 'tirzepatide', strengths: [2.5, 5, 7.5, 10, 12.5, 15], missedDoseWindowDays: 4 },
  Wegovy: { ingredient: 'semaglutide', strengths: [0.25, 0.5, 1, 1.7, 2.4], missedDoseWindowDays: 5 },
  Ozempic: { ingredient: 'semaglutide', strengths: [0.25, 0.5, 1, 2], missedDoseWindowDays: 5 },
  'Tirzepatide (compounded)': { ingredient: 'tirzepatide', strengths: [2.5, 5, 7.5, 10, 12.5, 15], missedDoseWindowDays: 4 },
  'Semaglutide (compounded)': { ingredient: 'semaglutide', strengths: [0.25, 0.5, 1, 1.7, 2.4], missedDoseWindowDays: 5 },
}

export const MEDICATIONS = Object.keys(MEDICATION_INFO) as MedicationName[]

/**
 * Approximate population pharmacokinetics from the labels: elimination
 * half-life and time to peak concentration after a subcutaneous dose.
 */
export const PHARMACOKINETICS: Record<Ingredient, { halfLifeDays: number; tmaxDays: number }> = {
  tirzepatide: { halfLifeDays: 5, tmaxDays: 1 },
  semaglutide: { halfLifeDays: 7, tmaxDays: 2.3 },
}

export function formatDose(mg: number): string {
  if (!(mg > 0)) return ''
  return `${Number(mg.toFixed(2))} mg`
}

/** Reads a dose typed as free text by earlier versions ("5mg", "2.5 mg"). */
export function parseDose(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 && value <= 100 ? value : 0
  if (typeof value !== 'string') return 0
  const parsed = Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 100 ? parsed : 0
}
