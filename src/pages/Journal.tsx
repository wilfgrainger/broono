import { useState } from 'react'
import { ChevronRight, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { formatShortDate } from '../utils/date'

export default function Journal() {
  const journalEntries = useStore((state) => state.journalEntries)
  const addJournalEntry = useStore((state) => state.addJournalEntry)
  const removeJournalEntry = useStore((state) => state.removeJournalEntry)
  const [newEntry, setNewEntry] = useState('')

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
        <p className="page-subtitle">Unlimited private notes stored only on this device.</p>
      </div>

      <form className="card" style={{ padding: '8px 8px 8px 20px' }} onSubmit={handleAdd}>
        <label htmlFor="journal-textarea" className="visually-hidden">New journal entry</label>
        <textarea
          id="journal-textarea"
          name="entry"
          className="journal-textarea"
          value={newEntry}
          onChange={(event) => setNewEntry(event.target.value)}
          onKeyDown={handleKey}
          placeholder="Noticed your clothes fitting looser? Less food noise today? Energy levels improving?"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 10, paddingRight: 4 }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
            {newEntry.length > 0 ? `${newEntry.length} characters | Ctrl/Cmd + Enter to save` : 'Your private space'}
          </span>
          <button
            type="submit"
            id="save-journal-btn"
            disabled={!newEntry.trim()}
            aria-label="Save journal entry"
            style={{
              background: newEntry.trim() ? '#0f172a' : '#e2e8f0',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: newEntry.trim() ? 'pointer' : 'default',
              boxShadow: newEntry.trim() ? '0 4px 12px rgba(15,23,42,0.2)' : 'none',
            }}
          >
            <ChevronRight size={18} color={newEntry.trim() ? 'white' : '#64748b'} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </form>

      <div>
        {journalEntries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>No entries yet</p>
            <p style={{ fontWeight: 600 }}>Your first reflection is waiting.</p>
          </div>
        )}
        <ul className="space-y-4" style={{ listStyle: 'none' }} aria-label="Journal entries">
          {journalEntries.map((entry) => (
            <li key={entry.id} className="card" style={{ position: 'relative' }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>
                <time dateTime={entry.date}>{formatShortDate(entry.date)}</time>
              </p>
              <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.65, fontWeight: 500, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', paddingRight: 28 }}>
                {entry.text}
              </p>
              <button
                type="button"
                className="icon-btn"
                onClick={() => removeJournalEntry(entry.id)}
                aria-label={`Delete entry from ${formatShortDate(entry.date)}`}
                style={{ position: 'absolute', top: 4, right: 4 }}
              >
                <Trash2 size={16} color="#be123c" strokeWidth={2} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
