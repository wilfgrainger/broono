import { useStore } from '../store'

const UPDATE_ITEMS = [
  {
    id: 'check-ins',
    tag: 'Core Feature',
    tagBg: '#eff6ff',
    tagColor: '#2563eb',
    tagBorder: '#bfdbfe',
    title: 'Weekly check-ins help you track weight, symptoms, and injection site rotation.',
    source: 'Broono',
  },
  {
    id: 'hydration',
    tag: 'Reminder',
    tagBg: '#f0fdf4',
    tagColor: '#16a34a',
    tagBorder: '#bbf7d0',
    title: 'Hydration and protein goals stay available on the free plan while premium analytics remain optional.',
    source: 'Broono',
  },
  {
    id: 'privacy',
    tag: 'Privacy',
    tagBg: '#fff7ed',
    tagColor: '#ea580c',
    tagBorder: '#fed7aa',
    title: 'Health logs and journal entries stay stored on-device so you control what gets exported.',
    source: 'Broono',
  },
]

export default function NewsPage() {
  const medicationName = useStore((s) => s.profile.medicationName)

  return (
    <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
      <div>
        <h2 className="page-title">Updates</h2>
        <p className="page-subtitle">Product updates and trusted guidance for your {medicationName} routine.</p>
      </div>

      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #eff6ff, #f8fafc)',
          border: '1px solid #bfdbfe',
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 800, color: '#1d4ed8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
          Launch note
        </p>
        <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.6 }}>
          The live news feed is temporarily offline while we move it to first-party infrastructure. For launch, this tab stays focused on product guidance rather than third-party articles.
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
            <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4, marginBottom: 16, color: '#0f172a' }}>
              {item.title}
            </h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.8px' }}>
              {item.source}
            </span>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', paddingBottom: 8 }}>
        Third-party health news will return after we own the feed end to end.
      </p>
    </div>
  )
}
