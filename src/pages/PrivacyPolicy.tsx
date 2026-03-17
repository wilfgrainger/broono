export default function PrivacyPolicy() {
    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Privacy Policy</h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>Last updated: March 2026</p>

            <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>1. Overview</h2>
                    <p>
                        Broono (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a GLP-1 companion application that helps users track
                        their medication progress, weight, symptoms, and wellness journey. We are committed to protecting
                        your privacy and being transparent about how we handle your data.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>2. Data We Collect</h2>
                    <p><strong>Account Data:</strong> Google account email address for authentication.</p>
                    <p><strong>Health &amp; Wellness Data (stored locally on your device only):</strong></p>
                    <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
                        <li>Weight entries and progress</li>
                        <li>Medication name, dose, and injection schedule</li>
                        <li>Symptom logs</li>
                        <li>Journal entries</li>
                        <li>Water intake tracking</li>
                        <li>Protein goals</li>
                    </ul>
                    <p><strong>Subscription Data:</strong> Subscription status and Google Play purchase tokens.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>3. How We Store Your Data</h2>
                    <p>
                        <strong>Your health data never leaves your device.</strong> All weight logs, symptoms, journal entries,
                        and medication data are stored exclusively in your device&apos;s local storage. We do not have access to,
                        transmit, or store this data on our servers.
                    </p>
                    <p>
                        Only your email address, account record, subscription status, and Google Play billing reference are
                        stored on our servers for authentication and subscription management purposes.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>4. Subscriptions &amp; Payments</h2>
                    <p>
                        Broono offers a subscription service (Broono Pro) with a 2-day free trial period, followed by a
                        monthly subscription of $2.99/month.
                    </p>
                    <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
                        <li>Payment is processed only through Google Play in the Android app.</li>
                        <li>Your subscription automatically renews unless cancelled at least 24 hours before the end of the current period.</li>
                        <li>You can manage or cancel your subscription through Google Play Store settings.</li>
                        <li>We do not store your credit card or payment details.</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>5. Third-Party Services</h2>
                    <p>We use the following third-party services:</p>
                    <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
                        <li><strong>Google Sign-In</strong> - For account authentication in the Android app</li>
                        <li><strong>Google Play Billing</strong> - For processing Broono Pro subscriptions</li>
                        <li><strong>Cloudflare</strong> - For hosting and API infrastructure</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>6. Your Rights (GDPR / UK GDPR)</h2>
                    <p>You have the right to:</p>
                    <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
                        <li>Access your personal data</li>
                        <li>Request deletion of your account and associated data</li>
                        <li>Export your data (available in the app&apos;s Settings page)</li>
                        <li>Withdraw consent at any time</li>
                    </ul>
                    <p>
                        Since your health data is stored locally, you have full control over it. Deleting the app or
                        clearing app data will remove all local health data. You can delete your server-side account
                        from the Settings page.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>7. Data Security</h2>
                    <p>
                        We use industry-standard security measures including encrypted connections (HTTPS),
                        Google-based account authentication, and JWT-based session management.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>8. Children&apos;s Privacy</h2>
                    <p>
                        Broono is not intended for use by children under 13. We do not knowingly collect
                        personal data from children under 13.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>9. Contact</h2>
                    <p>
                        For privacy-related questions or data requests, please contact us at{' '}
                        <a href="mailto:privacy@broono.app" style={{ color: '#005b7f', fontWeight: 600 }}>privacy@broono.app</a>.
                    </p>
                </section>
            </div>
        </div>
    )
}
