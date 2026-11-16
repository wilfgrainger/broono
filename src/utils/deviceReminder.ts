import { Capacitor } from '@capacitor/core'
import { formatDose, type MedicationName } from './medications.ts'

// Weekly injection reminder as a local notification in the Android app. The
// notification is scheduled by the operating system on the device; nothing is
// sent anywhere. Browsers use the calendar (.ics) reminder instead, because a
// web page cannot schedule a notification for when it is closed.

const REMINDER_ID = 1001

export const canUseDeviceReminders = () => Capacitor.isNativePlatform()

export interface ReminderSettings {
  enabled: boolean
  dayOfWeek: number
  time: string
  medicationName: MedicationName
  doseMg: number
}

/** The weekly schedule in the plugin's terms: weekday runs 1 (Sunday) to 7 (Saturday). */
export function reminderSchedule(settings: Pick<ReminderSettings, 'dayOfWeek' | 'time'>) {
  const [hour, minute] = settings.time.split(':').map(Number)
  return { on: { weekday: settings.dayOfWeek + 1, hour, minute }, allowWhileIdle: true }
}

/** Asks for notification permission. Returns whether reminders can be shown. */
export async function requestReminderPermission(): Promise<boolean> {
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  const current = await LocalNotifications.checkPermissions()
  if (current.display === 'granted') return true
  const requested = await LocalNotifications.requestPermissions()
  return requested.display === 'granted'
}

/** Replaces any scheduled reminder with one matching the current settings. */
export async function syncDeviceReminder(settings: ReminderSettings): Promise<void> {
  if (!canUseDeviceReminders()) return
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] })
  if (!settings.enabled) return

  const dose = formatDose(settings.doseMg)
  await LocalNotifications.schedule({
    notifications: [{
      id: REMINDER_ID,
      title: 'Injection day',
      body: `Time for your ${settings.medicationName}${dose ? ` ${dose}` : ''}. Open Broono to log it and see the suggested site.`,
      schedule: reminderSchedule(settings),
    }],
  })
}

/** A light tap on the Android app when something is saved. Silently does nothing elsewhere. */
export async function confirmWithHaptics(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics')
    await Haptics.notification({ type: NotificationType.Success })
  } catch {
    // Haptics are a nicety; never fail a save because of them.
  }
}
