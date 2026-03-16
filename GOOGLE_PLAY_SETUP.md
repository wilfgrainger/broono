# Google Play Store Setup Guide for Broono

This guide covers all the manual steps needed to publish Broono on the Google Play Store with a 2-day free trial and $2.99/month subscription.

---

## Prerequisites

- [x] Capacitor Android project configured (in `/android`)
- [x] Google Play Billing permission added to AndroidManifest.xml
- [x] Billing service created (`src/services/billing.ts`)
- [x] Paywall UI component created (`src/components/Paywall.tsx`)
- [x] Privacy Policy page created (`src/pages/PrivacyPolicy.tsx`)
- [x] Terms of Service page created (`src/pages/Terms.tsx`)
- [x] Backend Google Play purchase verification endpoint added
- [x] Backend RTDN webhook endpoint added
- [x] Database schema updated with `google_play_token` column

---

## Step 1: Google Play Developer Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Pay the one-time $25 registration fee
3. Complete your developer profile (business name, address, etc.)
4. Verify your identity (may take 24-48 hours)

---

## Step 2: Create the App in Google Play Console

1. In Google Play Console → **All apps** → **Create app**
2. Fill in:
   - **App name**: Broono – GLP-1 Companion
   - **Default language**: English (United States)
   - **App type**: App
   - **Free or paid**: Free (subscription is in-app)
3. Accept the declarations

---

## Step 3: App Signing & Build

### Generate a Release Keystore

```bash
keytool -genkey -v -keystore broono-release.keystore -alias broono -keyalg RSA -keysize 2048 -validity 10000
```

Keep this keystore file safe! You'll need it for every release.

### Build the Release AAB

```bash
# 1. Build the web app and sync to Android
npm run android:build

# 2. Open in Android Studio
npm run android:open

# 3. In Android Studio: Build → Generate Signed Bundle/APK
#    - Choose Android App Bundle (AAB)
#    - Select your keystore
#    - Choose "release" build variant
#    - Build
```

The signed AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

### Or build from command line:

```bash
cd android
./gradlew bundleRelease
```

---

## Step 4: Configure the Subscription in Google Play Console

1. Go to your app in Play Console
2. Navigate to **Monetize** → **Products** → **Subscriptions**
3. Click **Create subscription**
4. Fill in:
   - **Product ID**: `broono_pro_monthly` (MUST match the code)
   - **Name**: Broono Pro
   - **Description**: Full access to all Broono features
5. Click **Add a base plan**:
   - **Base plan ID**: `monthly`
   - **Auto-renewing**: Yes
   - **Billing period**: 1 Month
   - **Price**: $2.99 (set for all regions)
6. Click **Add an offer** on the base plan:
   - **Offer ID**: `free-trial`
   - **Eligibility**: New customer acquisition
   - **Phase 1**: Free trial, 2 Days
   - **Phase 2**: Auto-renewing at base plan price
7. **Activate** the subscription

---

## Step 5: Set Up Google Play Service Account (for server-side verification)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select or create a project linked to your Play Console
3. Enable the **Google Play Android Developer API**
4. Go to **IAM & Admin** → **Service Accounts**
5. Create a new service account:
   - Name: `broono-play-billing`
   - Role: none (we'll grant access in Play Console)
6. Create a JSON key for this service account and download it
7. In Google Play Console → **Settings** → **API access**:
   - Link the Google Cloud project
   - Grant the service account **Finance** permissions
8. Set the service account key as the `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` environment variable in your Cloudflare Worker:

```bash
# In your backend wrangler.toml or via dashboard
wrangler secret put GOOGLE_PLAY_SERVICE_ACCOUNT_KEY
# Paste the entire JSON key content
```

Also set:
```bash
wrangler secret put GOOGLE_PLAY_PACKAGE_NAME
# Enter: app.broono.android
```

---

## Step 6: Set Up Real-Time Developer Notifications (RTDN)

RTDN notifies your backend when subscription state changes (renewal, cancellation, etc.)

1. In Google Play Console → **Monetize** → **Monetization setup**
2. Under **Real-time developer notifications**:
   - **Topic name**: Create a Google Cloud Pub/Sub topic
   - Set up a push subscription that POSTs to: `https://your-api-domain.workers.dev/api/play/webhook`
3. Alternatively, configure a Cloud Function to forward Pub/Sub messages to your webhook

---

## Step 7: Store Listing

### Required Assets

| Asset | Specification |
|-------|--------------|
| App icon | 512 × 512 px, 32-bit PNG |
| Feature graphic | 1024 × 500 px, JPG or PNG |
| Screenshots (phone) | Min 2, between 320-3840px, 16:9 or 9:16 |
| Screenshots (tablet) | Optional but recommended |

### Required Information

- **Short description** (80 chars max): Your intelligent GLP-1 medication companion.
- **Full description** (4000 chars max):

```
Broono is your complete companion for the GLP-1 medication journey.

Whether you're on Zepbound, Mounjaro, Wegovy, or Ozempic, Broono helps you:

✅ Track your weight progress with beautiful charts
✅ Log injection sites and rotate properly
✅ Monitor symptoms and side effects
✅ Keep a personal wellness journal
✅ Set and track daily water and protein goals
✅ Export your data for doctor visits

Your health data stays 100% private – stored only on your device, never on our servers.

SUBSCRIPTION INFO:
• 2-day free trial for new users
• $2.99/month after trial
• Cancel anytime in Google Play settings
```

### Content Rating

1. Go to **Policy and programs** → **Content rating**
2. Complete the IARC questionnaire
3. Since this is a health tracking app with no violent/sexual content, it should receive an **Everyone** rating

### Data Safety

1. Go to **Policy and programs** → **App content** → **Data safety**
2. Declare:
   - **Email address**: Collected (for authentication)
   - **Health info**: Entered by user and stored on device only (not transmitted to Broono servers)
   - **Purchase history**: Collected by Google Play (for subscriptions)
   - Data is encrypted in transit: Yes
   - Users can request data deletion: Yes

---


## Backup & Local Sensitive Data Policy (Android)

**Decision:** Enforce strict local-only handling by disabling Android cloud/device backup for app data.

Implemented in `android/app/src/main/AndroidManifest.xml` with:

- `android:allowBackup="false"` on `<application>`

### Why this policy

Broono stores sensitive wellness data (weight logs, symptoms, journal entries, medication schedule) in local app storage on-device. Disabling backup prevents these local artifacts from being copied into Android backup transports (Google Drive/device transfer), which keeps behavior aligned with a strict "local only, user-controlled" privacy stance.

### Play Data Safety answers to use

For the Data safety form, answers should match the implementation above:

- **Does your app collect or share health data?**
  - Health data is entered by the user and stored only on-device by the app runtime.
  - It is **not shared** with third parties by Broono servers.
- **Is data processed ephemerally?**
  - No (local storage is persistent on the device until user clears data/deletes app/account).
- **Can users request data deletion?**
  - Yes.
  - Server-side account data can be deleted from in-app Settings.
  - Local device data can be wiped by account deletion flow, clearing app data, or uninstalling.
- **Is app data backed up off-device by Android backup?**
  - **No** for Broono app data, because `android:allowBackup="false"`.

### Re-verification checklist (policy consistency)

- Account deletion (Settings → Delete account) sends `DELETE /api/user`, then calls `localStorage.clear()` and logs out. This wipes locally persisted app data on success.
- Local data wipe behavior remains accurate:
  - Delete account (successful API response) clears local storage immediately.
  - Clearing app storage in Android settings removes all local artifacts.
  - Uninstall removes app sandbox data from the device.

## Step 8: Privacy Policy URL

Host the privacy policy at `https://broono.app/privacy` (it's already created as a route in the app).

When filling out the store listing, enter: `https://broono.app/privacy`

---

## Step 9: Testing

### Internal Testing Track

1. In Play Console → **Testing** → **Internal testing**
2. Upload your signed AAB
3. Add testers by email
4. Testers can install via the provided opt-in link

### Test Subscriptions

Google Play provides license testing:
1. Go to **Settings** → **License testing**
2. Add tester email addresses
3. Test subscriptions will auto-renew in minutes (not months)
4. Test free trials last 3 minutes (not 2 days)

---

## Step 9.5: Verify OAuth Android signing fingerprints

Google Sign-In on Play builds will fail if the Android OAuth client does not include the correct SHA-1/SHA-256 fingerprints for your package (`app.broono.android`).

1. In Google Cloud Console, open the OAuth **Android client** used by production.
2. Ensure package name is exactly: `app.broono.android`.
3. Register **both SHA-1 and SHA-256** for:
   - Debug keystore (local testing)
   - Release/Play signing certificate (production)
4. Save changes, then wait a few minutes for propagation.

Useful commands:

```bash
# Debug keystore fingerprints
keytool -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore

# Release keystore fingerprints
keytool -list -v -alias <release-alias> -keystore <path-to-release-keystore>
```

If backend returns `Google token audience mismatch`, re-check that OAuth client IDs and `GOOGLE_CLIENT_ID` / `GOOGLE_ANDROID_CLIENT_ID` are aligned with `backend/src/index.ts` audience validation.

## Step 10: Release to Production

1. Complete all store listing information
2. Complete the content rating questionnaire
3. Complete the data safety form (must match the Backup & Local Sensitive Data Policy section above)
4. Upload the signed AAB to the **Production** track
5. Submit for review (typically 1-3 days)

---

## Environment Variables Checklist

Make sure these are set in your Cloudflare Worker:

| Variable | Description |
|----------|-------------|
| `GOOGLE_PLAY_PACKAGE_NAME` | `app.broono.android` |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` | Full JSON key from Google Cloud |
| `GOOGLE_PLAY_WEBHOOK_TOKEN` | Bearer token for Pub/Sub webhook auth |
| `GOOGLE_CLIENT_ID` | Google OAuth Web client ID (must match frontend `VITE_GOOGLE_CLIENT_ID` and backend audience checks) |
| `GOOGLE_ANDROID_CLIENT_ID` | Google OAuth Android client ID for `app.broono.android` (must match frontend `VITE_GOOGLE_ANDROID_CLIENT_ID` and backend audience checks) |
| `STRIPE_SECRET_KEY` | Existing – for web payments |
| `STRIPE_WEBHOOK_SECRET` | Existing – for Stripe webhooks |
| `STRIPE_PRO_PRICE_ID` | Existing – Stripe price ID |
| `JWT_SECRET` | Existing – for auth tokens |
| `RESEND_API_KEY` | Existing – for magic link emails |
| `FRONTEND_URL` | Existing – e.g. `https://broono.app` |

---

## Database Migration

Run this SQL to add the Google Play token column to existing databases:

```sql
ALTER TABLE users ADD COLUMN google_play_token TEXT;
```

---

## Summary of What's Done (in code) vs. What You Need to Do (manually)

### ✅ Done in Code
- Capacitor Android project initialized
- Google Play Billing integration (via @capgo/native-purchases)
- Paywall component with 2-day trial / $2.99/month messaging
- Privacy Policy and Terms of Service pages
- Backend purchase verification endpoint
- Backend RTDN webhook endpoint
- Google sign-in endpoint (`/api/auth/google`) for Android login
- Database schema updated
- Build scripts added

### 📋 You Need to Do
- [ ] Register for Google Play Developer account ($25)
- [ ] Create the app in Google Play Console
- [ ] Generate a release keystore
- [ ] Create the `broono_pro_monthly` subscription product in Play Console
- [ ] Configure the 2-day free trial offer
- [ ] Set up Google Cloud service account for server verification
- [ ] Configure RTDN (Real-Time Developer Notifications)
- [ ] Configure Google Sign-In in Google Cloud (OAuth consent + Android/Web clients)
- [ ] Add Android SHA-1/SHA-256 signing fingerprints to Google OAuth client config
- [ ] Prepare store listing assets (icon, screenshots, feature graphic)
- [ ] Complete content rating questionnaire
- [ ] Complete data safety form
- [ ] Run `ALTER TABLE users ADD COLUMN google_play_token TEXT;` on production DB
- [ ] Set backend environment variables (`GOOGLE_PLAY_PACKAGE_NAME`, `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY`, `GOOGLE_PLAY_WEBHOOK_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`)
- [ ] Set frontend environment variables (`VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_ANDROID_CLIENT_ID`) to match backend audiences
- [ ] Build signed AAB and upload to Play Console
- [ ] Submit for review
