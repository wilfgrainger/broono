import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type WeightUnit = 'lbs' | 'kg'
export type MedicationName = 'Zepbound' | 'Mounjaro' | 'Wegovy' | 'Ozempic'
export type InjectionSite = 'Left Stomach' | 'Right Stomach' | 'Left Thigh' | 'Right Thigh'
export type Symptom = 'None' | 'Nausea' | 'Fatigue' | 'Headache' | 'Constipation'

export interface WeeklyLog {
  id: string
  date: string          // ISO date string
  displayDate: string   // e.g. "Oct 24"
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
  injectionDayOfWeek: number   // 0 = Sun … 6 = Sat
  startWeight: number
  weightUnit: WeightUnit
  proteinGoalG: number
  waterGoalGlasses: number
}

interface DailyWater {
  date: string   // YYYY-MM-DD
  glasses: number
}

interface AppState {
  hasCompletedOnboarding: boolean
  profile: UserProfile
  logs: WeeklyLog[]
  journalEntries: JournalEntry[]
  dailyWater: DailyWater
  
  // Auth State
  authToken: string | null
  userEmail: string | null
  subscriptionStatus: 'free' | 'pro' | 'canceled'

  // Profile actions
  updateProfile: (updates: Partial<UserProfile>) => void
  completeOnboarding: () => void

  // Log actions
  addLog: (log: Omit<WeeklyLog, 'id'>) => void
  removeLog: (id: string) => void

  // Journal actions
  addJournalEntry: (text: string) => void
  removeJournalEntry: (id: string) => void

  // Water actions
  addWaterGlass: () => void
  resetWaterIfNewDay: () => void

  // Auth actions
  setAuth: (token: string, email: string, status?: 'free'|'pro'|'canceled') => void
  logout: () => void
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

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      authToken: null,
      userEmail: null,
      subscriptionStatus: 'free',
      hasCompletedOnboarding: false,
      profile: {
        medicationName: 'Zepbound',
        dose: '5mg',
        injectionDayOfWeek: 1, // Monday
        startWeight: 195.0,
        weightUnit: 'lbs',
        proteinGoalG: 100,
        waterGoalGlasses: 8,
      },

      logs: [
        {
          id: uid(),
          date: '2024-10-24',
          displayDate: 'Oct 24',
          weight: 185.0,
          site: 'Left Stomach',
          symptoms: ['Mild Nausea' as Symptom],
          notes: 'Feeling good.',
        },
        {
          id: uid(),
          date: '2024-10-17',
          displayDate: 'Oct 17',
          weight: 187.5,
          site: 'Right Thigh',
          symptoms: ['None'],
          notes: 'Normal week.',
        },
        {
          id: uid(),
          date: '2024-10-10',
          displayDate: 'Oct 10',
          weight: 190.0,
          site: 'Left Thigh',
          symptoms: ['None'],
          notes: '',
        },
        {
          id: uid(),
          date: '2024-10-03',
          displayDate: 'Oct 3',
          weight: 192.0,
          site: 'Right Stomach',
          symptoms: ['Nausea'],
          notes: 'Started 5mg.',
        },
      ],

      journalEntries: [
        {
          id: uid(),
          date: '2024-10-24',
          displayDate: 'Oct 24',
          text: 'Drank a lot of water today. Clothes fit better. Food noise is completely gone.',
        },
      ],

      dailyWater: { date: today(), glasses: 0 },

      updateProfile: (updates) =>
        set((s) => ({ profile: { ...s.profile, ...updates } })),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      setAuth: (token, email, status = 'free') => set({ authToken: token, userEmail: email, subscriptionStatus: status }),
      logout: () => set({ authToken: null, userEmail: null, subscriptionStatus: 'free' }),

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
          const d = today()
          const current = s.dailyWater.date === d ? s.dailyWater.glasses : 0
          return {
            dailyWater: {
              date: d,
              glasses: Math.min(current + 1, s.profile.waterGoalGlasses),
            },
          }
        }),

      resetWaterIfNewDay: () =>
        set((s) => {
          const d = today()
          if (s.dailyWater.date !== d) {
            return { dailyWater: { date: d, glasses: 0 } }
          }
          return {}
        }),
    }),
    {
      name: 'broono-store',
      version: 1,
    }
  )
)

// ─── Derived selectors ──────────────────────────────────────────────────────

export function getMedicationLevel(
  lastLogDate: string | undefined,
  medicationName: MedicationName
): number {
  if (!lastLogDate) return 0
  const halfLifeDays = medicationName === 'Ozempic' || medicationName === 'Wegovy' ? 7 : 5
  const daysSince =
    (Date.now() - new Date(lastLogDate + 'T00:00:00').getTime()) /
    (1000 * 60 * 60 * 24)
  return Math.max(Math.round(Math.pow(0.5, daysSince / halfLifeDays) * 100), 0)
}

export function getDaysUntilNextDose(injectionDayOfWeek: number): number {
  const now = new Date()
  const currentDay = now.getDay()
  let daysUntil = injectionDayOfWeek - currentDay
  if (daysUntil <= 0) daysUntil += 7
  return daysUntil
}
