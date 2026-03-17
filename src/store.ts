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
  hasCompletedOnboarding: boolean
  profile: UserProfile
  logs: WeeklyLog[]
  journalEntries: JournalEntry[]
  dailyWater: DailyWater
  authToken: string | null
  userEmail: string | null
  subscriptionStatus: 'free' | 'pro' | 'canceled'
  updateProfile: (updates: Partial<UserProfile>) => void
  completeOnboarding: () => void
  addLog: (log: Omit<WeeklyLog, 'id'>) => void
  removeLog: (id: string) => void
  addJournalEntry: (text: string) => void
  removeJournalEntry: (id: string) => void
  addWaterGlass: () => void
  resetWaterIfNewDay: () => void
  setAuth: (token: string, email: string, status?: 'free' | 'pro' | 'canceled') => void
  logout: () => void
  resetApp: () => void
}

type PersistedAppState = Pick<
  AppState,
  'hasCompletedOnboarding' |
  'profile' |
  'logs' |
  'journalEntries' |
  'dailyWater' |
  'authToken' |
  'userEmail' |
  'subscriptionStatus'
>

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
  hasCompletedOnboarding: false,
  profile: { ...defaultProfile },
  logs: [],
  journalEntries: [],
  dailyWater: { date: today(), glasses: 0 },
  authToken: null,
  userEmail: null,
  subscriptionStatus: 'free',
})

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...createPersistedState(),

      updateProfile: (updates) =>
        set((s) => ({ profile: { ...s.profile, ...updates } })),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      setAuth: (token, email, status = 'free') =>
        set({ authToken: token, userEmail: email, subscriptionStatus: status }),

      logout: () => set({ authToken: null, userEmail: null, subscriptionStatus: 'free' }),

      resetApp: () => set(createPersistedState()),

      addLog: (log) =>
        set((s) => ({
          logs: [{ ...log, id: uid() }, ...s.logs],
        })),

      removeLog: (id) =>
        set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),

      addJournalEntry: (text) =>
        set((s) => ({
          journalEntries: [
            {
              id: uid(),
              date: today(),
              displayDate: formatDisplayDate(today()),
              text,
            },
            ...s.journalEntries,
          ],
        })),

      removeJournalEntry: (id) =>
        set((s) => ({
          journalEntries: s.journalEntries.filter((e) => e.id !== id),
        })),

      addWaterGlass: () =>
        set((s) => {
          const date = today()
          const current = s.dailyWater.date === date ? s.dailyWater.glasses : 0

          return {
            dailyWater: {
              date,
              glasses: Math.min(current + 1, s.profile.waterGoalGlasses),
            },
          }
        }),

      resetWaterIfNewDay: () =>
        set((s) => {
          const date = today()
          if (s.dailyWater.date !== date) {
            return { dailyWater: { date, glasses: 0 } }
          }

          return {}
        }),
    }),
    {
      name: 'broono-store',
      version: 2,
      migrate: (persistedState, version) => {
        const baseState = createPersistedState()

        if (!persistedState || typeof persistedState !== 'object') {
          return baseState
        }

        const data = persistedState as Partial<PersistedAppState>

        if (version < 2) {
          return {
            ...baseState,
            authToken: data.authToken ?? null,
            userEmail: data.userEmail ?? null,
            subscriptionStatus: data.subscriptionStatus ?? 'free',
            hasCompletedOnboarding: false,
            profile: {
              ...baseState.profile,
              ...data.profile,
              startWeight: data.profile?.startWeight && data.profile.startWeight > 0
                ? data.profile.startWeight
                : 0,
            },
          }
        }

        return {
          ...baseState,
          ...data,
          profile: { ...baseState.profile, ...data.profile },
          logs: Array.isArray(data.logs) ? data.logs : [],
          journalEntries: Array.isArray(data.journalEntries) ? data.journalEntries : [],
          dailyWater: data.dailyWater ?? baseState.dailyWater,
        }
      },
    }
  )
)

export const getMedicationLevel = getMedicationLevelUtil
export const getDaysUntilNextDose = getDaysUntilNextDoseUtil
