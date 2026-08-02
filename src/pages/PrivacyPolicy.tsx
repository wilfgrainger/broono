export default function PrivacyPolicy() {
    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Privacy Policy</h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>Last updated: August 2026</p>

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
                    <p><strong>Early-access data:</strong> First name and email address when you join the waitlist.</p>
                    <p><strong>Account data:</strong> Google account email address for authentication.</p>
                    <p><strong>Health &amp; wellness data (stored locally on your device only):</strong></p>
                    <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
                        <li>Weight entries and progress</li>
                        <li>Medication name, dose, and injection schedule</li>
                        <li>Symptom logs</li>
                        <li>Journal entries</li>
                        <li>Water intake tracking</li>
                        <li>Protein goals</li>
                    </ul>
                    <p><strong>Subscription data:</strong> Subscription status and Google Play purchase tokens.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>3. How We Use and Store Your Data</h2>
                    <p>
                        Early-access names and email addresses are used to manage waitlist positions, onboarding invitations and launch updates.
                        Please do not submit medical or health information through the early-access form.
                    </p>
                    <p>
                        <strong>Your in-app health data never leaves your device.</strong> Weight logs, symptoms, journal entries,
                        and medication data are stored in your device&apos;s local storage. We do not transmit or store this data on our servers.
                    </p>
                    <p>
                        Your early-access record, email address, account record, subscription status, and Google Play billing reference may be
                        stored in our Cloudflare-hosted API and database for waitlist, authentication and subscription-management purposes.
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
                        <li><strong>GitHub Pages</strong> - For hosting the public web application</li>
                        <li><strong>Cloudflare</strong> - For API and database infrastructure</li>
                        <li><strong>Google Sign-In</strong> - For account authentication in the Android app</li>
                        <li><strong>Google Play Billing</strong> - For processing Broono Pro subscriptions</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>6. Your Rights (UK GDPR)</h2>
                    <p>You may have the right to:</p>
                    <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
                        <li>Access your personal data</li>
                        <li>Correct inaccurate personal data</li>
                        <li>Request deletion of your account, waitlist record and associated server-side data</li>
                        <li>Restrict or object to certain processing</li>
                        <li>Export data where the right to portability applies</li>
                        <li>Withdraw consent where processing relies on consent</li>
                    </ul>
                    <p>
                        Since your in-app health data is stored locally, you control it on your device. Deleting the app or
                        clearing app data will remove local health data. You can delete your server-side account from the Settings page.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>7. Data Security</h2>
                    <p>
                        We use encrypted connections (HTTPS), Google-based account authentication, JWT-based session management,
                        restricted browser origins and server-side purchase verification. No internet service can guarantee absolute security.
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
