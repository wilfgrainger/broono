import { useState, useEffect } from 'react'
import { useStore } from '../store'

const FALLBACK_NEWS_ITEMS = [
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

interface NewsItem {
    id: string
    tag: string
    tagBg: string
    tagColor: string
    tagBorder: string
    title: string
    source: string
    time: string
    url: string
}

export default function NewsPage() {
    const medicationName = useStore((s) => s.profile.medicationName)
    const [newsItems, setNewsItems] = useState<NewsItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        async function fetchNews() {
            try {
                // Ensure specific medications are always included in the news feed
                const coreTerms = ['"GLP-1"', '"Ozempic"', '"Wegovy"', '"Mounjaro"']
                if (!coreTerms.includes(`"${medicationName}"`)) {
                    coreTerms.unshift(`"${medicationName}"`)
                }
                const query = encodeURIComponent(coreTerms.join(' OR '))
                const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`

                const response = await fetch(proxyUrl)
                if (!response.ok) throw new Error('Network response was not ok')
                const xmlText = await response.text()

                const parser = new DOMParser()
                const xmlDoc = parser.parseFromString(xmlText, "text/xml")

                const items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 10)

                if (isMounted) {
                    if (items.length === 0) {
                        setNewsItems(FALLBACK_NEWS_ITEMS)
                    } else {
                        const parsedItems: NewsItem[] = items.map((item, index) => {
                            const titleRaw = item.querySelector("title")?.textContent || ""
                            const parts = titleRaw.split(" - ")
                            const source = parts.length > 1 ? parts.pop() || "News" : "News"
                            const title = parts.join(" - ")

                            const link = item.querySelector("link")?.textContent || "#"
                            const pubDateStr = item.querySelector("pubDate")?.textContent

                            let timeStr = "Recent"
                            if (pubDateStr) {
                                const pubDate = new Date(pubDateStr)
                                const diffHours = Math.round((Date.now() - pubDate.getTime()) / (1000 * 60 * 60))
                                if (diffHours < 24) {
                                    timeStr = `${Math.max(1, diffHours)}h ago`
                                } else {
                                    const diffDays = Math.round(diffHours / 24)
                                    timeStr = `${diffDays}d ago`
                                }
                            }

                            const tags = [
                                { tag: 'News', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
                                { tag: 'Update', bg: '#faf5ff', color: '#7c3aed', border: '#ddd6fe' },
                                { tag: 'Health', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
                                { tag: 'Medical', bg: '#fff1f2', color: '#e11d48', border: '#fecdd3' },
                                { tag: 'Lifestyle', bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' }
                            ]
                            const tagObj = tags[index % tags.length]

                            return {
                                id: `rss-${index}`,
                                tag: tagObj.tag,
                                tagBg: tagObj.bg,
                                tagColor: tagObj.color,
                                tagBorder: tagObj.border,
                                title,
                                source,
                                time: timeStr,
                                url: link
                            }
                        })
                        setNewsItems(parsedItems)
                    }
                }
            } catch (err) {
                console.error("Failed to fetch news:", err)
                if (isMounted) {
                    setNewsItems(FALLBACK_NEWS_ITEMS)
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        fetchNews()

        return () => {
            isMounted = false
        }
    }, [medicationName])

    return (
        <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
            <div>
                <h2 className="page-title">Updates</h2>
                <p className="page-subtitle">News and research tailored for you.</p>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                        <p style={{ fontWeight: 600 }}>Loading latest news...</p>
                    </div>
                ) : (
                    newsItems.map((item) => (
                        <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
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
                    ))
                )}
            </div>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', paddingBottom: 8 }}>
                Articles are curated weekly for {medicationName} users.
            </p>
        </div>
    )
}
