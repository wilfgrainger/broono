# Security policy

## Supported code

Security fixes are made against the current `main` branch. Older deployments and abandoned product branches are not supported.

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability.

Use GitHub's **Report a vulnerability** option in the repository Security tab so the report and any proof remain private while it is assessed.

Include, where possible:

- the affected component, platform or workflow;
- the conditions required to reproduce the issue;
- the likely impact;
- a minimal proof that does not expose real personal or health data;
- any safe mitigation already identified.

Do not access other people's devices or data, disrupt hosting, perform denial-of-service testing, publish secrets, or continue testing after confirming the issue.

## Security and privacy boundary

Broono's intended boundary is:

- user-entered profile, check-in and journal data remains in local browser or app storage;
- the application has no account, API, remote database, analytics or billing service;
- the production Content Security Policy blocks runtime connections with `connect-src 'none'`;
- the Android build has no internet or billing permission;
- local export is user-initiated and local erasure removes the current device state.

Treat any ability to transmit local records without an explicit export action, bypass local erasure, inject executable content into stored entries, reintroduce network permissions, or load untrusted remote code as high priority.

Loss of local data after browser/app storage is cleared is expected product behaviour, but misleading backup or recovery claims are a security and trust defect.

We will acknowledge valid reports through the private GitHub advisory and coordinate remediation and disclosure there.
