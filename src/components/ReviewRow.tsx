interface ReviewRowProps {
    label: string;
    value: string;
}

export default function ReviewRow({ label, value }: ReviewRowProps) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-light)' }}>{label}</span>
            <span style={{ fontWeight: 600 }}>{value}</span>
        </div>
    )
}
