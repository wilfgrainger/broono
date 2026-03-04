# Broono Data Architecture & Compliance

The following diagram and explanation outline how Broono's architecture handles user data, specifically addressing compliance with **UK GDPR** and **Google Play Store Data Safety** requirements.

## Architecture Diagram

```mermaid
flowchart TD
    %% Styling
    classDef device fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#0f172a
    classDef cloud fill:#f8fafc,stroke:#94a3b8,stroke-width:2px,color:#0f172a
    classDef thirdparty fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0f172a

    %% Nodes
    subgraph User Device ["📱 User Device (PWA / App)"]
        UI["React + Zustand UI"]
        LocalData[("Local Storage\n(Health Data, Logs,\nJournal, Vitals)")]
    end

    subgraph Cloudflare Backend ["☁️ Cloudflare Workers & D1"]
        API["Hono API Gateway"]
        AuthDB[("D1 Database\n(Email, Auth Tokens,\nStripe Cust. ID)")]
    end

    subgraph Third Party Services ["🔗 Third-Party Services"]
        Resend["Resend\n(Magic Link Emails)"]
        Stripe["Stripe\n(Payment Processing)"]
    end

    %% Connections
    UI <-->|Reads/Writes\n(Offline Capable)| LocalData

    UI -->|1. Request Magic Link\n(Email Only)| API
    API -->|2. Send Email via API| Resend
    Resend -->|3. Magic Link Email| UI

    UI -->|4. Verify Token| API
    API <-->|Check/Store Token & User ID| AuthDB

    UI -->|5. Initiate Checkout| API
    API -->|Create Session| Stripe
    Stripe -->|Webhook (Sub Status)| API
    API -->|Update Status| AuthDB

    %% Apply Styles
    class User Device device
    class Cloudflare Backend cloud
    class Third Party Services thirdparty
```

## Compliance Breakdown

### UK GDPR Compliance

1. **Data Minimization & Local Storage**:
   The most sensitive data—user health logs, weight entries, injection schedules, and personal journal entries—is **never transmitted to our servers**. It is stored exclusively on the user's local device using `localStorage` via Zustand's `persist` middleware. Because we do not process or store this health data on our backend, our regulatory burden and risk surface are drastically reduced.

2. **Explicit Consent**:
   During the onboarding and login process, users must explicitly check a box stating: *"I consent to the processing of my health data for the purposes of providing this service (UK GDPR compliance)."*

3. **Data Portability (Right to Access)**:
   The app includes an "Export Data for Doctor" feature in the Settings profile, allowing users to download their entire local profile, logs, and journal entries as a JSON file at any time.

4. **Right to Erasure (Right to be Forgotten)**:
   A "Delete Account" button is provided in the Settings. Clicking this calls the `DELETE /api/user` endpoint, which securely removes the user's email, magic links, and database record from the Cloudflare D1 database. Additionally, it clears all local storage, entirely wiping the local health data from their device.

### Google Play Store (Data Safety) Launch Preparedness

Google Play's Data Safety section requires developers to declare what data is collected, how it is used, and whether it is shared. Broono's architecture makes this straightforward:

- **Health and Fitness Data**: Stored purely on-device. We do not "collect" or "transmit" this data off the device to our servers. Therefore, in the Google Play Data Safety form, you can confidently state that health data is **not** transmitted off-device or shared with third parties.
- **Personal Info (Email Address)**: Collected strictly for account authentication (Magic Links via Resend) and payment processing (Stripe).
- **Data Deletion**: Google Play requires a way for users to delete their account and data both within the app and via a web link. The in-app deletion is already implemented (`DELETE /api/user`). Since the app is a PWA that functions identically on the web, a user can log in via a web browser and execute the same deletion request.
- **End-to-End Encryption**: While health data remains local, all communication between the app and the backend (for auth/payments) occurs over strict HTTPS/TLS, meeting Google's requirement that data transmitted off-device is encrypted in transit.
