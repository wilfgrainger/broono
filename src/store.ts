import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getMedicationLevel as getMedicationLevelUtil, getDaysUntilNextDose as getDaysUntilNextDoseUtil } from './utils/medication'
import type { MedicationName } from './utils/medication'
import { formatShortDate, toLocalISODate } from './utils/date'

export type WeightUnit = 'lbs' | 'kg'
export type { MedicationName }
export type InjectionSite = 'Left Stomach' | 'Right Stomach' | 'Left Thigh' | 'Right Thigh'
export type Symptom = 'None' | 'Nausea' | 'Fatigue' | 'Headache' | 'Constipation'

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
  updateProfile: (updates: Partial<UserProfile>) => void
  completeOnboarding: () => void
  addLog: (log: Omit<WeeklyLog, 'id'>) => void
  removeLog: (id: string) => void
  addJournalEntry: (text: string) => void
  removeJournalEntry: (id: string) => void
  addWaterGlass: () => void
  removeWaterGlass: () => void
  addProtein: (grams: number) => void
  resetDailyTotalsIfNewDay: () => void
  resetApp: () => void
}

type PersistedAppState = Pick<
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

const defaultProfile: UserProfile = {
  medicationName: 'Zepbound',
  dose: '5mg',
  injectionDayOfWeek: 1,
  startWeight: 0,
  weightUnit: 'lbs',
  proteinGoalG: 100,
  waterGoalGlasses: 8,
}

const createPersistedState = (): PersistedAppState => ({
  hasStarted: false,
  hasCompletedOnboarding: false,
  profile: { ...defaultProfile },
  logs: [],
  journalEntries: [],
  dailyWater: { date: today(), glasses: 0 },
  dailyProtein: { date: today(), grams: 0 },
})

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...createPersistedState(),

      startLocally: () => set({ hasStarted: true }),

      updateProfile: (updates) =>
        set((state) => ({ profile: { ...state.profile, ...updates } })),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      resetApp: () => set(createPersistedState()),

      addLog: (log) =>
        set((state) => ({
          logs: [{ ...log, id: uid() }, ...state.logs],
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
              text,
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

          return {
            dailyWater: {
              date,
              glasses: Math.min(current + 1, 99),
            },
          }
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
      version: 4,
      migrate: (persistedState) => {
        const baseState = createPersistedState()

        if (!persistedState || typeof persistedState !== 'object') {
          return baseState
        }

        const data = persistedState as Partial<PersistedAppState>
        const hasExistingUse = Boolean(
          data.hasStarted ||
          data.hasCompletedOnboarding ||
          (Array.isArray(data.logs) && data.logs.length > 0) ||
          (Array.isArray(data.journalEntries) && data.journalEntries.length > 0) ||
          (data.profile?.startWeight && data.profile.startWeight > 0),
        )

        return {
          ...baseState,
          hasStarted: data.hasStarted ?? hasExistingUse,
          hasCompletedOnboarding: data.hasCompletedOnboarding ?? false,
          profile: { ...baseState.profile, ...data.profile },
          logs: Array.isArray(data.logs) ? data.logs : [],
          journalEntries: Array.isArray(data.journalEntries) ? data.journalEntries : [],
          dailyWater: data.dailyWater ?? baseState.dailyWater,
          dailyProtein: data.dailyProtein ?? baseState.dailyProtein,
        }
      },
    },
  ),
)

export const getMedicationLevel = getMedicationLevelUtil
export const getDaysUntilNextDose = getDaysUntilNextDoseUtil
