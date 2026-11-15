import { useStore } from '../store'

const UPDATE_ITEMS = [
  {
    id: 'check-ins',
    tag: 'Core Feature',
    tagBg: '#eff6ff',
    tagColor: '#1d4ed8',
    tagBorder: '#bfdbfe',
    title: 'Weekly check-ins help you track weight, symptoms, and injection site rotation.',
    source: 'Broono',
  },
  {
    id: 'hydration',
    tag: 'Reminder',
    tagBg: '#f0fdf4',
    tagColor: '#15803d',
    tagBorder: '#bbf7d0',
    title: 'Hydration and protein goals reset each day. Tap the dashboard buttons to count glasses and grams as you go.',
    source: 'Broono',
  },
  {
    id: 'privacy',
    tag: 'Privacy',
    tagBg: '#fff7ed',
    tagColor: '#c2410c',
    tagBorder: '#fed7aa',
    title: 'Health logs and journal entries stay on this device. Export a backup from Settings before changing phones or clearing data.',
    source: 'Broono',
  },
]

export default function NewsPage() {
  const medicationName = useStore((s) => s.profile.medicationName)

  return (
    <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
      <div>
        <h1 className="page-title">Updates</h1>
        <p className="page-subtitle">Product notes for your {medicationName} routine.</p>
      </div>

      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #eff6ff, #f8fafc)',
          border: '1px solid #bfdbfe',
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 800, color: '#1d4ed8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
          Local edition
        </p>
        <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.6 }}>
          Broono works without an internet connection, an account or a subscription, so this tab carries product notes only. It never loads third-party articles. For medical questions, speak to your prescriber or pharmacist.
        </p>
      </div>

      <div className="space-y-4">
        {UPDATE_ITEMS.map((item) => (
          <div key={item.id} className="card">
            <span
              className="news-tag"
              style={{ background: item.tagBg, color: item.tagColor, borderColor: item.tagBorder, marginBottom: 14, display: 'inline-block' }}
            >
              {item.tag}
            </span>
            <h2 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4, marginBottom: 16, color: '#0f172a' }}>
              {item.title}
            </h2>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.8px' }}>
              {item.source}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}
