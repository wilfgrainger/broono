import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getMedicationLevel as getMedicationLevelUtil, getDaysUntilNextDose as getDaysUntilNextDoseUtil } from './utils/medication'
import type { MedicationName } from './utils/medication'

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

interface AppState {
  hasStarted: boolean
  hasCompletedOnboarding: boolean
  profile: UserProfile
  logs: WeeklyLog[]
  journalEntries: JournalEntry[]
  dailyWater: DailyWater
  startLocally: () => void
  updateProfile: (updates: Partial<UserProfile>) => void
  completeOnboarding: () => void
  addLog: (log: Omit<WeeklyLog, 'id'>) => void
  removeLog: (id: string) => void
  addJournalEntry: (text: string) => void
  removeJournalEntry: (id: string) => void
  addWaterGlass: () => void
  resetWaterIfNewDay: () => void
  resetApp: () => void
}

type PersistedAppState = Pick<
  AppState,
  'hasStarted' |
  'hasCompletedOnboarding' |
  'profile' |
  'logs' |
  'journalEntries' |
  'dailyWater'
>

type LegacyPersistedState = Partial<PersistedAppState> & {
  authToken?: string | null
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function formatDisplayDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
              displayDate: formatDisplayDate(today()),
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
              glasses: Math.min(current + 1, state.profile.waterGoalGlasses),
            },
          }
        }),

      resetWaterIfNewDay: () =>
        set((state) => {
          const date = today()
          if (state.dailyWater.date !== date) {
            return { dailyWater: { date, glasses: 0 } }
          }

          return {}
        }),
    }),
    {
      name: 'broono-store',
      version: 3,
      migrate: (persistedState) => {
        const baseState = createPersistedState()

        if (!persistedState || typeof persistedState !== 'object') {
          return baseState
        }

        const data = persistedState as LegacyPersistedState
        const hasExistingUse = Boolean(
          data.hasStarted ||
          data.hasCompletedOnboarding ||
          data.authToken ||
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
        }
      },
    },
  ),
)

export const getMedicationLevel = getMedicationLevelUtil
export const getDaysUntilNextDose = getDaysUntilNextDoseUtil
