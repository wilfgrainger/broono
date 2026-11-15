import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getMedicationLevel as getMedicationLevelUtil, getDaysUntilNextDose as getDaysUntilNextDoseUtil } from './utils/medication'
import type { MedicationName } from './utils/medication'
import { formatShortDate, toLocalISODate } from './utils/date'
import { convertWeight, guessWeightUnit, validateWeight, type WeightUnit } from './utils/weight'

export type { MedicationName, WeightUnit }
export type InjectionSite = 'Left Stomach' | 'Right Stomach' | 'Left Thigh' | 'Right Thigh'
export type Symptom = 'None' | 'Nausea' | 'Fatigue' | 'Headache' | 'Constipation'

export const MEDICATIONS: MedicationName[] = ['Zepbound', 'Mounjaro', 'Wegovy', 'Ozempic']
export const INJECTION_SITES: InjectionSite[] = ['Left Stomach', 'Right Stomach', 'Left Thigh', 'Right Thigh']
export const SYMPTOMS: Symptom[] = ['None', 'Nausea', 'Fatigue', 'Headache', 'Constipation']

export const STORE_VERSION = 5
export const LIMITS = {
  dose: 40,
  notes: 2000,
  journalEntry: 5000,
  proteinGoal: { min: 30, max: 300 },
  waterGoal: { min: 1, max: 20 },
} as const

export interface WeeklyLog {
  id: string
  date: string
  displayDate: string
  weight: number
  site: InjectionSite | ''
  symptoms: Symptom[]
  notes: string
}

export interface JournalEntry {
  id: string
  date: string
  displayDate: string
  text: string
}

export interface UserProfile {
  medicationName: MedicationName
  dose: string
  injectionDayOfWeek: number
  startWeight: number
  weightUnit: WeightUnit
  proteinGoalG: number
  waterGoalGlasses: number
}

interface DailyWater {
  date: string
  glasses: number
}

interface DailyProtein {
  date: string
  grams: number
}

interface AppState {
  hasStarted: boolean
  hasCompletedOnboarding: boolean
  profile: UserProfile
  logs: WeeklyLog[]
  journalEntries: JournalEntry[]
  dailyWater: DailyWater
  dailyProtein: DailyProtein
  startLocally: () => void
  updateProfile: (updates: Partial<Omit<UserProfile, 'weightUnit'>>) => void
  setWeightUnit: (unit: WeightUnit) => void
  completeOnboarding: () => void
  addLog: (log: Omit<WeeklyLog, 'id'>) => void
  removeLog: (id: string) => void
  addJournalEntry: (text: string) => void
  removeJournalEntry: (id: string) => void
  addWaterGlass: () => void
  removeWaterGlass: () => void
  addProtein: (grams: number) => void
  resetDailyTotalsIfNewDay: () => void
  importData: (data: PersistedAppState) => void
  resetApp: () => void
}

export type PersistedAppState = Pick<
  AppState,
  'hasStarted' |
  'hasCompletedOnboarding' |
  'profile' |
  'logs' |
  'journalEntries' |
  'dailyWater' |
  'dailyProtein'
>

const today = () => toLocalISODate()

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ??
    Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const createDefaultProfile = (): UserProfile => ({
  medicationName: 'Zepbound',
  dose: '',
  injectionDayOfWeek: 1,
  startWeight: 0,
  weightUnit: guessWeightUnit(globalThis.navigator?.language),
  proteinGoalG: 100,
  waterGoalGlasses: 8,
})

const createPersistedState = (): PersistedAppState => ({
  hasStarted: false,
  hasCompletedOnboarding: false,
  profile: createDefaultProfile(),
  logs: [],
  journalEntries: [],
  dailyWater: { date: today(), glasses: 0 },
  dailyProtein: { date: today(), grams: 0 },
})

// ── Validation of stored or imported data ──
// Anything read back from storage or from a backup file is untrusted: it may be
// from an older version, hand-edited, or not a Broono file at all.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const asText = (value: unknown, maxLength: number) =>
  typeof value === 'string' ? value.slice(0, maxLength) : ''
const asDate = (value: unknown) =>
  typeof value === 'string' && ISO_DATE.test(value) ? value : null
const clampInt = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(Math.max(Math.round(value), min), max) : fallback

function sanitizeProfile(raw: unknown, sourceVersion: number): UserProfile {
  const base = createDefaultProfile()
  if (!isRecord(raw)) return base

  // Before version 5 the `lbs` unit was always displayed as stones and pounds.
  const rawUnit = raw.weightUnit
  const weightUnit: WeightUnit = rawUnit === 'kg' || rawUnit === 'st'
    ? rawUnit
    : rawUnit === 'lbs'
      ? (sourceVersion < 5 ? 'st' : 'lbs')
      : base.weightUnit

  return {
    medicationName: MEDICATIONS.includes(raw.medicationName as MedicationName)
      ? raw.medicationName as MedicationName
      : base.medicationName,
    dose: asText(raw.dose, LIMITS.dose),
    injectionDayOfWeek: clampInt(raw.injectionDayOfWeek, 0, 6, base.injectionDayOfWeek),
    startWeight: validateWeight(Number(raw.startWeight), weightUnit) ?? 0,
    weightUnit,
    proteinGoalG: clampInt(raw.proteinGoalG, LIMITS.proteinGoal.min, LIMITS.proteinGoal.max, base.proteinGoalG),
    waterGoalGlasses: clampInt(raw.waterGoalGlasses, LIMITS.waterGoal.min, LIMITS.waterGoal.max, base.waterGoalGlasses),
  }
}

function sanitizeLogs(raw: unknown, unit: WeightUnit): WeeklyLog[] {
  if (!Array.isArray(raw)) return []

  return raw.flatMap((entry): WeeklyLog[] => {
    if (!isRecord(entry)) return []
    const date = asDate(entry.date)
    const weight = validateWeight(Number(entry.weight), unit)
    if (!date || weight === null) return []

    const symptoms = Array.isArray(entry.symptoms)
      ? SYMPTOMS.filter((symptom) => (entry.symptoms as unknown[]).includes(symptom))
      : []

    return [{
      id: asText(entry.id, 80) || uid(),
      date,
      displayDate: formatShortDate(date),
      weight,
      site: INJECTION_SITES.includes(entry.site as InjectionSite) ? entry.site as InjectionSite : '',
      symptoms: symptoms.length > 0 ? symptoms : ['None'],
      notes: asText(entry.notes, LIMITS.notes),
    }]
  }).sort((a, b) => b.date.localeCompare(a.date))
}

function sanitizeJournal(raw: unknown): JournalEntry[] {
  if (!Array.isArray(raw)) return []

  return raw.flatMap((entry): JournalEntry[] => {
    if (!isRecord(entry)) return []
    const date = asDate(entry.date)
    const text = asText(entry.text, LIMITS.journalEntry).trim()
    if (!date || !text) return []

    return [{ id: asText(entry.id, 80) || uid(), date, displayDate: formatShortDate(date), text }]
  })
}

/**
 * Builds a valid state from stored or imported data. Returns null when the
 * input is not recognisable as Broono data at all.
 */
export function sanitizePersistedState(raw: unknown, sourceVersion: number): PersistedAppState | null {
  if (!isRecord(raw)) return null
  const looksLikeBroono = isRecord(raw.profile) || Array.isArray(raw.logs) || Array.isArray(raw.journalEntries)
  if (!looksLikeBroono) return null

  const base = createPersistedState()
  const profile = sanitizeProfile(raw.profile, sourceVersion)
  const logs = sanitizeLogs(raw.logs, profile.weightUnit)
  const journalEntries = sanitizeJournal(raw.journalEntries)
  const hasExistingUse = logs.length > 0 || journalEntries.length > 0 || profile.startWeight > 0

  const water = isRecord(raw.dailyWater) ? raw.dailyWater : {}
  const protein = isRecord(raw.dailyProtein) ? raw.dailyProtein : {}

  return {
    hasStarted: typeof raw.hasStarted === 'boolean' ? raw.hasStarted || hasExistingUse : hasExistingUse,
    hasCompletedOnboarding: typeof raw.hasCompletedOnboarding === 'boolean'
      ? raw.hasCompletedOnboarding
      : hasExistingUse,
    profile,
    logs,
    journalEntries,
    dailyWater: { date: asDate(water.date) ?? base.dailyWater.date, glasses: clampInt(water.glasses, 0, 99, 0) },
    dailyProtein: { date: asDate(protein.date) ?? base.dailyProtein.date, grams: clampInt(protein.grams, 0, 999, 0) },
  }
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...createPersistedState(),

      startLocally: () => set({ hasStarted: true }),

      updateProfile: (updates) =>
        set((state) => ({ profile: { ...state.profile, ...updates } })),

      // Changing unit converts every stored weight so the numbers keep their meaning.
      setWeightUnit: (unit) =>
        set((state) => {
          const from = state.profile.weightUnit
          if (from === unit) return {}

          return {
            profile: {
              ...state.profile,
              weightUnit: unit,
              startWeight: convertWeight(state.profile.startWeight, from, unit),
            },
            logs: state.logs.map((log) => ({ ...log, weight: convertWeight(log.weight, from, unit) })),
          }
        }),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      resetApp: () => set(createPersistedState()),

      importData: (data) => set({ ...data, hasStarted: true, hasCompletedOnboarding: true }),

      // Logs are kept newest first by date, whatever order they were entered in.
      addLog: (log) =>
        set((state) => ({
          logs: [{ ...log, id: uid() }, ...state.logs].sort((a, b) => b.date.localeCompare(a.date)),
        })),

      removeLog: (id) =>
        set((state) => ({ logs: state.logs.filter((log) => log.id !== id) })),

      addJournalEntry: (text) =>
        set((state) => ({
          journalEntries: [
            {
              id: uid(),
              date: today(),
              // Kept so exports keep their shape; the UI formats `date` at render time.
              displayDate: formatShortDate(today()),
              text: text.slice(0, LIMITS.journalEntry),
            },
            ...state.journalEntries,
          ],
        })),

      removeJournalEntry: (id) =>
        set((state) => ({
          journalEntries: state.journalEntries.filter((entry) => entry.id !== id),
        })),

      addWaterGlass: () =>
        set((state) => {
          const date = today()
          const current = state.dailyWater.date === date ? state.dailyWater.glasses : 0

          return { dailyWater: { date, glasses: Math.min(current + 1, 99) } }
        }),

      removeWaterGlass: () =>
        set((state) => {
          const date = today()
          const current = state.dailyWater.date === date ? state.dailyWater.glasses : 0

          return { dailyWater: { date, glasses: Math.max(current - 1, 0) } }
        }),

      addProtein: (grams) =>
        set((state) => {
          const date = today()
          const current = state.dailyProtein.date === date ? state.dailyProtein.grams : 0

          return { dailyProtein: { date, grams: Math.min(Math.max(current + grams, 0), 999) } }
        }),

      resetDailyTotalsIfNewDay: () =>
        set((state) => {
          const date = today()

          return {
            ...(state.dailyWater.date !== date ? { dailyWater: { date, glasses: 0 } } : {}),
            ...(state.dailyProtein.date !== date ? { dailyProtein: { date, grams: 0 } } : {}),
          }
        }),
    }),
    {
      name: 'broono-store',
      version: STORE_VERSION,
      partialize: (state): PersistedAppState => ({
        hasStarted: state.hasStarted,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        profile: state.profile,
        logs: state.logs,
        journalEntries: state.journalEntries,
        dailyWater: state.dailyWater,
        dailyProtein: state.dailyProtein,
      }),
      migrate: (persistedState, version) =>
        sanitizePersistedState(persistedState, version) ?? createPersistedState(),
    },
  ),
)

export const getMedicationLevel = getMedicationLevelUtil
export const getDaysUntilNextDose = getDaysUntilNextDoseUtil
