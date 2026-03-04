import React from 'react';

interface PillSelectProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    style?: React.CSSProperties;
}

export default function PillSelect({ active, onClick, children, style = {} }: PillSelectProps) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '16px 20px',
                borderRadius: '12px',
                border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                background: active ? 'var(--primary-light)' : 'var(--card-bg)',
                color: active ? 'var(--primary)' : 'var(--text)',
                fontWeight: active ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '1rem',
                ...style
            }}
        >
            {children}
        </button>
    )
}
