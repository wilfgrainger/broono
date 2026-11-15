import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { MEDICATIONS, parseDose, type MedicationName } from './utils/medications'
import { INJECTION_SITES, type InjectionSite } from './utils/stats'
import { formatShortDate, toLocalISODate } from './utils/date'
import { safeLocalStorage } from './utils/storageHealth'
import { convertWeight, guessWeightUnit, validateWeight, type WeightUnit } from './utils/weight'

export type { MedicationName, WeightUnit, InjectionSite }
export { MEDICATIONS, INJECTION_SITES }
export const SYMPTOMS = [
  'None', 'Nausea', 'Vomiting', 'Diarrhoea', 'Constipation', 'Heartburn', 'Fatigue', 'Headache', 'Site reaction',
] as const
export type Symptom = typeof SYMPTOMS[number]

export const STORE_VERSION = 6
export const LIMITS = {
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
  /** '' when no injection was recorded with this log. */
  site: InjectionSite | ''
  /** Dose injected in mg; 0 when no injection or not recorded. */
  doseMg: number
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
  /** Current dose in mg; 0 when not set. */
  doseMg: number
  injectionDayOfWeek: number
  startWeight: number
  /** Goal weight in the same unit as `startWeight`; 0 when not set. */
  goalWeight: number
  /** Height in centimetres, used only for BMI; 0 when not set. */
  heightCm: number
  /** `YYYY-MM-DD` the user started treatment, or ''. */
  treatmentStartDate: string
  /** `HH:MM` used for calendar reminders. */
  reminderTime: string
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
  doseMg: 0,
  injectionDayOfWeek: 1,
  startWeight: 0,
  goalWeight: 0,
  heightCm: 0,
  treatmentStartDate: '',
  reminderTime: '09:00',
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
    // Versions before 6 stored the dose as free text ("5mg").
    doseMg: parseDose(raw.doseMg ?? raw.dose),
    injectionDayOfWeek: clampInt(raw.injectionDayOfWeek, 0, 6, base.injectionDayOfWeek),
    startWeight: validateWeight(Number(raw.startWeight), weightUnit) ?? 0,
    goalWeight: validateWeight(Number(raw.goalWeight), weightUnit) ?? 0,
    heightCm: clampInt(raw.heightCm, 0, 250, 0) >= 100 ? clampInt(raw.heightCm, 0, 250, 0) : 0,
    treatmentStartDate: asDate(raw.treatmentStartDate) ?? '',
    reminderTime: typeof raw.reminderTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(raw.reminderTime) ? raw.reminderTime : base.reminderTime,
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
      ? SYMPTOMS.filter((symptom) => (entry.symptoms as unknown[]).includes(symptom)) as Symptom[]
      : []

    return [{
      id: asText(entry.id, 80) || uid(),
      date,
      displayDate: formatShortDate(date),
      weight,
      site: (INJECTION_SITES as readonly string[]).includes(entry.site as string) ? entry.site as InjectionSite : '',
      doseMg: parseDose(entry.doseMg),
      symptoms: symptoms.length > 0 ? symptoms : ['None'] as Symptom[],
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
      storage: createJSONStorage(() => safeLocalStorage),
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
