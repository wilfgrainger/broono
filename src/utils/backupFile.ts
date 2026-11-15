import { Capacitor } from '@capacitor/core'

export type SaveResult = 'downloaded' | 'shared' | 'cancelled'

/**
 * Saves a backup file. Browsers get an ordinary download. The Android app has
 * no download manager in its WebView, so it writes the file to the app's cache
 * and opens the system share sheet (Drive, Files, email, ...). Nothing is sent
 * anywhere unless the user picks a destination.
 */
export async function saveBackupFile(contents: string, fileName: string): Promise<SaveResult> {
  if (Capacitor.isNativePlatform()) {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ])
    const { uri } = await Filesystem.writeFile({
      path: fileName,
      data: contents,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })

    try {
      await Share.share({ title: 'Broono backup', files: [uri] })
      return 'shared'
    } catch (error) {
      // Closing the share sheet without choosing a destination is not a failure.
      if (error instanceof Error && /cancel/i.test(error.message)) return 'cancelled'
      throw error
    }
  }

  const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Revoking straight away can cancel the download in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
}
