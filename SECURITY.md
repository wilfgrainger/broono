# Security policy

## Supported code

Security fixes are made against the current `main` branch. Older deployments and abandoned product branches are not supported.

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability.

Use GitHub's **Report a vulnerability** option in the repository Security tab so the report and any proof remain private while they are assessed.

Include, where possible:

- the affected route, component or workflow;
- the conditions required to reproduce the issue;
- the likely impact;
- a minimal proof that does not expose real user data;
- any safe mitigation you have already identified.

Do not access other users' accounts or data, disrupt the service, perform denial-of-service testing, publish secrets, or continue testing after confirming the issue.

## Security boundaries

Broono's intended privacy boundary is that health and journal data remain in local device storage. The backend handles account identity, early-access submissions and subscription state. Any finding that crosses this boundary, bypasses authentication or billing verification, exposes a secret, or permits account deletion or modification without authority should be treated as high priority.

We will acknowledge valid reports through the private GitHub advisory and coordinate remediation and disclosure there.
