import { useState } from 'react'
import { ChevronRight, Trash2 } from 'lucide-react'
import { useStore } from '../store'

export default function Journal() {
  const journalEntries = useStore((state) => state.journalEntries)
  const addJournalEntry = useStore((state) => state.addJournalEntry)
  const removeJournalEntry = useStore((state) => state.removeJournalEntry)
  const [newEntry, setNewEntry] = useState('')

  const handleAdd = () => {
    const text = newEntry.trim()
    if (!text) return

    addJournalEntry(text)
    setNewEntry('')
  }

  const handleKey = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      handleAdd()
    }
  }

  return (
    <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
      <div>
        <h2 className="page-title">Journal</h2>
        <p className="page-subtitle">Unlimited private notes stored only on this device.</p>
      </div>

      <div className="card" style={{ padding: '8px 8px 8px 20px' }}>
        <textarea
          id="journal-textarea"
          className="journal-textarea"
          value={newEntry}
          onChange={(event) => setNewEntry(event.target.value)}
          onKeyDown={handleKey}
          placeholder="Noticed your clothes fitting looser? Less food noise today? Energy levels improving?"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 10, paddingRight: 4 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
            {newEntry.length > 0 ? `${newEntry.length} characters | Ctrl/Cmd + Enter to save` : 'Your private space'}
          </span>
          <button
            id="save-journal-btn"
            onClick={handleAdd}
            disabled={!newEntry.trim()}
            aria-label="Save journal entry"
            style={{
              background: newEntry.trim() ? '#0f172a' : '#e2e8f0',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: newEntry.trim() ? 'pointer' : 'default',
              boxShadow: newEntry.trim() ? '0 4px 12px rgba(15,23,42,0.2)' : 'none',
            }}
          >
            <ChevronRight size={18} color={newEntry.trim() ? 'white' : '#94a3b8'} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div>
        {journalEntries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>No entries yet</p>
            <p style={{ fontWeight: 600 }}>Your first reflection is waiting.</p>
          </div>
        )}
        <div className="space-y-4">
          {journalEntries.map((entry) => (
            <div key={entry.id} className="card" style={{ position: 'relative' }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>
                {entry.displayDate}
              </p>
              <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.65, fontWeight: 500 }}>
                {entry.text}
              </p>
              <button
                onClick={() => removeJournalEntry(entry.id)}
                aria-label="Delete entry"
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 8,
                  display: 'flex',
                  opacity: 0.5,
                }}
              >
                <Trash2 size={14} color="#e11d48" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
