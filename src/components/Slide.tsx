import React from 'react';

export default function Slide({ children, transitionKey }: { children: React.ReactNode, transitionKey: string }) {
    return (
        <div key={transitionKey} className="slide-up" style={{ animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
            {children}
        </div>
    )
}
