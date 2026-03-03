import { useState } from 'react'
import { ChevronRight, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import PaywallModal from '../components/PaywallModal'

export default function Journal() {
    const journalEntries = useStore((s) => s.journalEntries)
    const addJournalEntry = useStore((s) => s.addJournalEntry)
    const removeJournalEntry = useStore((s) => s.removeJournalEntry)
    const subscriptionStatus = useStore((s) => s.subscriptionStatus)

    const [newEntry, setNewEntry] = useState('')
    const [showPaywall, setShowPaywall] = useState(false)

    const handleAdd = () => {
        if (!newEntry.trim()) return

        if (subscriptionStatus !== 'pro' && journalEntries.length >= 3) {
            setShowPaywall(true)
            return
        }

        addJournalEntry(newEntry.trim())
        setNewEntry('')
    }

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd()
    }

    return (
        <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
            <div>
                <h2 className="page-title">Journal</h2>
                <p className="page-subtitle">Track non-scale victories and how you feel.</p>
            </div>

            {/* New entry composer */}
            <div className="card" style={{ padding: '8px 8px 8px 20px' }}>
                <textarea
                    id="journal-textarea"
                    className="journal-textarea"
                    value={newEntry}
                    onChange={(e) => setNewEntry(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Noticed your clothes fitting looser? Less food noise today? Energy levels improving?"
                />
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: 10,
                    paddingRight: 4,
                }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                        {newEntry.length > 0 ? `${newEntry.length} chars · ⌘↵ to save` : 'Your private space'}
                    </span>
                    <button
                        id="save-journal-btn"
                        onClick={handleAdd}
                        disabled={!newEntry.trim()}
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
                            transition: 'background .15s, transform .1s',
                            boxShadow: newEntry.trim() ? '0 4px 12px rgba(15,23,42,0.2)' : 'none',
                        }}
                        onMouseDown={(e) => { if (newEntry.trim()) (e.currentTarget).style.transform = 'scale(0.93)' }}
                        onMouseUp={(e) => { (e.currentTarget).style.transform = 'scale(1)' }}
                    >
                        <ChevronRight size={18} color={newEntry.trim() ? 'white' : '#94a3b8'} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* Entries */}
            <div>
                {journalEntries.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                        <p style={{ fontSize: 32, marginBottom: 12 }}>📝</p>
                        <p style={{ fontWeight: 600 }}>Your first entry is waiting.</p>
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
                                    opacity: 0.35,
                                    transition: 'opacity .15s',
                                }}
                                onMouseEnter={(e) => { (e.currentTarget).style.opacity = '1' }}
                                onMouseLeave={(e) => { (e.currentTarget).style.opacity = '0.35' }}
                            >
                                <Trash2 size={14} color="#e11d48" strokeWidth={2} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <PaywallModal
                isOpen={showPaywall}
                onClose={() => setShowPaywall(false)}
                featureName="Unlimited Journaling"
            />
        </div>
    )
}
