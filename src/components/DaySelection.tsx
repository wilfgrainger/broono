const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface DaySelectionProps {
    currentDay: number
    onUpdate: (dayIndex: number) => void
}

export default function DaySelection({ currentDay, onUpdate }: DaySelectionProps) {
    return (
        <div className="card">
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Injection Day</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                {DAY_NAMES.map((day, idx) => (
                    <button
                        key={day}
                        id={`day-${day.toLowerCase()}`}
                        onClick={() => onUpdate(idx)}
                        style={{
                            padding: '10px 0',
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: '1px solid',
                            transition: 'all .15s',
                            background: currentDay === idx ? '#0f172a' : '#f8fafc',
                            color: currentDay === idx ? 'white' : '#64748b',
                            borderColor: currentDay === idx ? '#0f172a' : '#e2e8f0',
                        }}
                    >
                        {day.slice(0, 1)}
                    </button>
                ))}
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 10, fontWeight: 500 }}>
                Currently: <strong style={{ color: '#334155' }}>{DAY_NAMES[currentDay]}</strong>
            </p>
        </div>
    )
}
