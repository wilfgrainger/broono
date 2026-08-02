export default function Terms() {
    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 680, margin: '0 auto', overflowY: 'auto' }}>
            <a href="/" style={{ display: 'inline-block', marginBottom: 20, color: '#4f46e5', fontWeight: 700 }}>← Back to Broono</a>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Terms of Use</h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>Last updated: August 2026</p>

            <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>1. Local software</h2>
                    <p>
                        Broono is a local-first personal tracking application. It does not require an account, paid subscription or Broono-hosted data service.
                        Your entries are stored on the device and browser profile you use.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>2. Not medical advice</h2>
                    <p>
                        Broono is intended for personal organisation and reflection only. It is not a medical device and does not provide diagnosis,
                        treatment, dosing instructions or professional medical advice. Speak to a qualified healthcare professional about medication and health decisions.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>3. Medication estimates</h2>
                    <p>
                        Any medication-level curve or timing display is a simplified estimate for personal context. It is not a measurement of the amount
                        of medicine in your body and must not be used to change a dose or injection schedule.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>4. Your data and device</h2>
                    <p>
                        You are responsible for securing your device and keeping any backup you need. Clearing browser storage, clearing app data or uninstalling
                        the application may permanently erase your entries. Use the export feature before changing devices or removing local storage.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>5. Appropriate use</h2>
                    <p>
                        Do not use Broono for unlawful purposes, attempt to misrepresent it as clinical software, or rely on it as the sole record for urgent or essential care.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>6. Availability</h2>
                    <p>
                        The software is provided as available and may change. Local operation reduces service dependencies, but browser, device, operating-system or hosting changes
                        can still affect access. Export important data regularly.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>7. Source-code licence</h2>
                    <p>
                        Rights to copy, modify and redistribute the source code are governed by the licence file included in the repository. Public visibility by itself does not grant additional rights.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>8. Contact</h2>
                    <p>
                        Product and code questions can be raised through the project&apos;s GitHub repository. Never place personal health information in a public issue.
                    </p>
                </section>
            </div>
        </div>
    )
}
