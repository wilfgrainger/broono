export default function PrivacyPolicy() {
    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 680, margin: '0 auto', overflowY: 'auto' }}>
            <a href="/" style={{ display: 'inline-block', marginBottom: 20, color: '#4f46e5', fontWeight: 700 }}>← Back to Broono</a>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Privacy Policy</h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>Last updated: August 2026</p>

            <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>1. Local-only design</h2>
                    <p>
                        Broono is designed to work without an account, application backend, remote database or health-data sync service.
                        The profile and tracking information you enter is stored in local browser or app storage on the device you are using.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>2. Information stored on your device</h2>
                    <p>Depending on the features you use, local data may include:</p>
                    <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
                        <li>Medication name, dose and injection schedule</li>
                        <li>Weight entries and progress</li>
                        <li>Symptoms, injection site and check-in notes</li>
                        <li>Journal entries</li>
                        <li>Water intake and personal goals</li>
                        <li>A local flag recording that setup is complete</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>3. No Broono account or server record</h2>
                    <p>
                        Broono does not require your name, email address, Google account, payment information or a Broono user account.
                        The application does not send your tracking entries to a Broono API or database.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>4. Hosting and ordinary web requests</h2>
                    <p>
                        The public web files are delivered through GitHub Pages. As with normal website hosting, the hosting and network providers
                        involved in loading the site may process routine connection information such as IP address, request time, browser details and requested files.
                        Broono does not add analytics, advertising trackers or a health-data collection endpoint.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>5. Exporting and deleting your data</h2>
                    <p>
                        You can export a JSON copy from Settings. You can erase Broono data using “Erase data from this device”, by clearing the site&apos;s
                        storage in your browser, or by clearing/uninstalling the app. Local data is not automatically recoverable after deletion.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>6. Device security and backups</h2>
                    <p>
                        Because the information remains on your device, access depends on the security of that device and browser profile.
                        Use a device lock and export your data before clearing storage, reinstalling, or moving to another device.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>7. Medical information</h2>
                    <p>
                        Broono is a personal tracking tool, not a medical device or clinical record system. Do not rely on it as the only copy of
                        information needed for treatment or emergencies.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>8. Contact</h2>
                    <p>
                        Questions about this policy can be raised through the project&apos;s public GitHub repository. Do not include personal health information in a public issue.
                    </p>
                </section>
            </div>
        </div>
    )
}
