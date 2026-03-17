export default function Terms() {
    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Terms of Service</h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>Last updated: March 2026</p>

            <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>1. Acceptance of Terms</h2>
                    <p>
                        By using Broono, you agree to these Terms of Service. If you do not agree, please do not use the app.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>2. Description of Service</h2>
                    <p>
                        Broono is a personal health companion for tracking GLP-1 medication usage, weight, symptoms,
                        and wellness data. Broono is <strong>not a medical device</strong> and does not provide medical advice.
                        Always consult your healthcare provider for medical decisions.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>3. Subscription Terms</h2>
                    <p><strong>Free Trial:</strong> New subscribers receive a 2-day free trial of Broono Pro.</p>
                    <p><strong>Subscription:</strong> After the trial, Broono Pro costs $2.99/month.</p>
                    <p><strong>Billing Platform:</strong> Broono Pro is sold only in the Android app through Google Play.</p>
                    <p><strong>Auto-Renewal:</strong> Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current billing period.</p>
                    <p><strong>Cancellation:</strong></p>
                    <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
                        <li>Manage via Google Play Store &gt; Subscriptions</li>
                    </ul>
                    <p><strong>Refunds:</strong> Refunds are handled by Google Play according to Google Play policies.</p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>4. User Responsibilities</h2>
                    <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
                        <li>You are responsible for maintaining the security of your account.</li>
                        <li>You must provide accurate information when creating an account.</li>
                        <li>You must not use the app for any unlawful purpose.</li>
                        <li>Your health data is stored locally; you are responsible for your device security and backups.</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>5. Medical Disclaimer</h2>
                    <p>
                        Broono is intended for informational and personal tracking purposes only. It is not a substitute
                        for professional medical advice, diagnosis, or treatment. Never disregard professional medical
                        advice or delay seeking it because of information provided by this app.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>6. Intellectual Property</h2>
                    <p>
                        All content, design, and code in Broono is owned by us or our licensors. You may not copy,
                        modify, or distribute any part of the app without permission.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>7. Limitation of Liability</h2>
                    <p>
                        Broono is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages
                        arising from your use of the app, including but not limited to loss of data, health outcomes,
                        or service interruptions.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>8. Changes to Terms</h2>
                    <p>
                        We may update these terms from time to time. Continued use of the app after changes
                        constitutes acceptance of the new terms.
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>9. Contact</h2>
                    <p>
                        For questions about these terms, contact us at{' '}
                        <a href="mailto:support@broono.app" style={{ color: '#005b7f', fontWeight: 600 }}>support@broono.app</a>.
                    </p>
                </section>
            </div>
        </div>
    )
}
