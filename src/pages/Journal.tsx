import { useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import ConfirmDialog, { type ConfirmDialogHandle } from '../components/ConfirmDialog'
import { LIMITS, useStore } from '../store'
import { formatShortDate } from '../utils/date'

export default function Journal() {
  const journalEntries = useStore((state) => state.journalEntries)
  const addJournalEntry = useStore((state) => state.addJournalEntry)
  const removeJournalEntry = useStore((state) => state.removeJournalEntry)
  const [newEntry, setNewEntry] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const deleteDialogRef = useRef<ConfirmDialogHandle>(null)
  const canSave = newEntry.trim().length > 0

  const handleAdd = (event?: React.FormEvent) => {
    event?.preventDefault()
    const text = newEntry.trim()
    if (!text) return

    addJournalEntry(text)
    setNewEntry('')
  }

  const handleKey = (event: React.KeyboardEvent) => {
    // `isComposing` guards against submitting while an IME candidate is open.
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !event.nativeEvent.isComposing) {
      handleAdd()
    }
  }

  return (
    <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
      <div>
        <h1 className="page-title">Journal</h1>
        <p className="page-subtitle">Private notes stored only on this device.</p>
      </div>

      <form className="card" style={{ padding: '12px 12px 12px 20px' }} onSubmit={handleAdd}>
        <label htmlFor="journal-textarea" className="visually-hidden">New journal entry</label>
        <textarea
          id="journal-textarea"
          name="entry"
          className="journal-textarea"
          value={newEntry}
          maxLength={LIMITS.journalEntry}
          onChange={(event) => setNewEntry(event.target.value)}
          onKeyDown={handleKey}
          placeholder="Noticed your clothes fitting looser? Less food noise today? Energy levels improving?"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            {newEntry.length > 0 ? `${newEntry.length} / ${LIMITS.journalEntry}` : 'Your private space'}
          </span>
          <button
            type="submit"
            id="save-journal-btn"
            disabled={!canSave}
            aria-label="Save journal entry"
            style={{
              background: canSave ? 'var(--inverse-bg)' : 'var(--surface-muted)',
              color: canSave ? 'var(--inverse-fg)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 12,
              minWidth: 76,
              minHeight: 44,
              padding: '0 18px',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 700,
              cursor: canSave ? 'pointer' : 'default',
            }}
          >
            Save
          </button>
        </div>
      </form>

      <div>
        {journalEntries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>No entries yet</h2>
            <p style={{ fontWeight: 600 }}>Your first reflection is waiting.</p>
          </div>
        )}
        <ul className="space-y-4" style={{ listStyle: 'none' }} aria-label="Journal entries">
          {journalEntries.map((entry) => (
            <li key={entry.id} className="card" style={{ position: 'relative' }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>
                <time dateTime={entry.date}>{formatShortDate(entry.date)}</time>
              </p>
              <p style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.65, fontWeight: 500, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', paddingRight: 28 }}>
                {entry.text}
              </p>
              <button
                type="button"
                className="icon-btn"
                onClick={() => {
                  setPendingDeleteId(entry.id)
                  deleteDialogRef.current?.open()
                }}
                aria-label={`Delete entry from ${formatShortDate(entry.date)}`}
                style={{ position: 'absolute', top: 4, right: 4 }}
              >
                <Trash2 size={16} color="var(--danger)" strokeWidth={2} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <ConfirmDialog
        ref={deleteDialogRef}
        title="Delete this entry?"
        description="This journal entry will be removed from this device. This cannot be undone."
        confirmLabel="Delete entry"
        cancelLabel="Keep it"
        onConfirm={() => { if (pendingDeleteId) removeJournalEntry(pendingDeleteId) }}
      />
    </div>
  )
}
