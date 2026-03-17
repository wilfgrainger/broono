# Broono Data Architecture & Compliance

This document outlines how Broono handles user data for UK GDPR and Google Play Data Safety review.

## Architecture Diagram

```mermaid
flowchart TD
    classDef device fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#0f172a
    classDef cloud fill:#f8fafc,stroke:#94a3b8,stroke-width:2px,color:#0f172a
    classDef thirdparty fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0f172a

    subgraph Device ["User Device (PWA / Android App)"]
        UI["React + Zustand UI"]
        LocalData[("Local Storage\nHealth Data,\nLogs,\nJournal,\nVitals")]
    end

    subgraph Backend ["Cloudflare Workers & D1"]
        API["Hono API Gateway"]
        AuthDB[("D1 Database\nEmail,\nSubscription Status,\nGoogle Play Token")]
    end

    subgraph Services ["Third-Party Services"]
        GoogleAuth["Google Sign-In\nAccount Authentication"]
        Play["Google Play Billing\nSubscription Purchase + RTDN"]
    end

    UI <-->|Reads and Writes| LocalData
    UI -->|Google ID Token| API
    API -->|Verify Sign-In| GoogleAuth

    API <-->|Auth Records| AuthDB

    UI -->|Verify Android Purchase| API
    API -->|Verify Subscription| Play
    Play -->|RTDN Webhook| API
    API -->|Update Status| AuthDB

    class Device device
    class Backend cloud
    class Services thirdparty
```

## Compliance Breakdown

### UK GDPR

1. **Data minimization**
   Health logs, weight entries, injection schedules, water tracking, and journal entries remain on-device in local storage. Broono servers do not store that health data.

2. **Explicit consent**
   During login, users must agree to the Terms, Privacy Policy, and the local health-data processing disclosure before continuing.

3. **Data portability**
   Pro users can export their local profile, logs, and journal history from Settings for clinical or personal use.

4. **Right to erasure**
   The in-app Delete Account action removes the server-side account record and clears local persisted app data on success.

### Google Play Data Safety

- **Health and fitness data**
  Entered by the user and stored locally on-device. It is not transmitted to Broono servers.

- **Personal info**
  Email address is used for authentication. Subscription status and Google Play purchase references are used for billing verification.

- **Data deletion**
  Users can delete their account in-app. Local app data is cleared during successful account deletion and can also be removed by clearing app storage or uninstalling.

- **Encryption in transit**
  All traffic between the app and backend for authentication and subscription verification uses HTTPS/TLS.

### Billing Model

- Broono Pro is sold only through Google Play in the Android app.
- There is no web checkout path.
- Billing management and cancellation happen in Google Play subscriptions.
