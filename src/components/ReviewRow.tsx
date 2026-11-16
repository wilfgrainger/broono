interface ReviewRowProps {
    label: string;
    value: string;
}

export default function ReviewRow({ label, value }: ReviewRowProps) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <dt style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</dt>
            <dd style={{ fontWeight: 600, textAlign: 'right', minWidth: 0, overflowWrap: 'anywhere' }}>{value}</dd>
        </div>
    )
}
