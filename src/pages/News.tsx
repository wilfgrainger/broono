import { useStore } from '../store'

const NEWS_ITEMS = [
    {
        id: '1',
        tag: 'Supply Alert',
        tagBg: '#fff1f2', tagColor: '#e11d48', tagBorder: '#fecdd3',
        title: '{med} Supply Updates for This Month',
        source: 'FDA Database',
        time: '2h ago',
        url: '#',
    },
    {
        id: '2',
        tag: 'Nutrition',
        tagBg: '#f0fdf4', tagColor: '#16a34a', tagBorder: '#bbf7d0',
        title: 'Why Muscle Loss Happens on GLP-1s and How to Stop It',
        source: 'Broono Editorial',
        time: '1d ago',
        url: '#',
    },
    {
        id: '3',
        tag: 'Research',
        tagBg: '#eff6ff', tagColor: '#2563eb', tagBorder: '#bfdbfe',
        title: 'New Study: Heart Benefits of GLP-1 Medications Explained',
        source: 'Medical News Today',
        time: '3d ago',
        url: '#',
    },
    {
        id: '4',
        tag: 'Tips',
        tagBg: '#faf5ff', tagColor: '#7c3aed', tagBorder: '#ddd6fe',
        title: 'Managing Nausea: 5 Dietitian-Approved Strategies',
        source: 'Healthline',
        time: '1w ago',
        url: '#',
    },
    {
        id: '5',
        tag: 'Lifestyle',
        tagBg: '#fff7ed', tagColor: '#ea580c', tagBorder: '#fed7aa',
        title: 'Exercise Timing on Injection Day: What the Research Says',
        source: 'Broono Editorial',
        time: '1w ago',
        url: '#',
    },
]

export default function NewsPage() {
    const medicationName = useStore((s) => s.profile.medicationName)

    return (
        <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
            <div>
                <h2 className="page-title">Updates</h2>
                <p className="page-subtitle">News and research tailored for you.</p>
            </div>

            <div className="space-y-4">
                {NEWS_ITEMS.map((item) => (
                    <a
                        key={item.id}
                        href={item.url}
                        id={`news-item-${item.id}`}
                        style={{
                            display: 'block',
                            textDecoration: 'none',
                            color: 'inherit',
                        }}
                    >
                        <div
                            className="card"
                            style={{
                                transition: 'box-shadow .15s, transform .15s',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'
                                    ; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'
                                    ; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                            }}
                        >
                            <span
                                className="news-tag"
                                style={{ background: item.tagBg, color: item.tagColor, borderColor: item.tagBorder, marginBottom: 14, display: 'inline-block' }}
                            >
                                {item.tag}
                            </span>
                            <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4, marginBottom: 16, color: '#0f172a' }}>
                                {item.title.replace('{med}', medicationName)}
                            </h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.8px' }}>
                                    {item.source}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.8px' }}>
                                    {item.time}
                                </span>
                            </div>
                        </div>
                    </a>
                ))}
            </div>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', paddingBottom: 8 }}>
                Articles are curated weekly for {medicationName} users.
            </p>
        </div>
    )
}
