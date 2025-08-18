# Security Policy — MedicoX

Thank you for responsibly reporting security issues in MedicoX. This document describes how to report vulnerabilities, our expectations for responsible disclosure, and the steps we take to protect patient data and the project.

## Reporting a Vulnerability
If you discover a security vulnerability in MedicoX, please report it **privately** to us:

- Preferred: Create a GitHub Security Advisory (recommended) or open a private issue and mark it `security`, or
- Email: security@medicox.example (please replace with your real security contact)
- PGP (optional):  `Replace-with-your-PGP-fingerprint` — use this to encrypt sensitive reports.

When reporting, please include:
- A clear description of the issue, steps to reproduce, and affected versions.
- Proof-of-concept (PoC) if available (without exposing real patient data).
- Any suggested mitigations.
- A preferred contact method so we can follow up.

Do **not** post details publicly until the issue is resolved or coordinated with the security contact.

## Response Policy & Timeline
We aim to handle reports quickly and transparently:

- **Acknowledgement:** within **72 hours** of receipt.
- **Initial assessment & priority:** within **7 calendar days**.
- **Fix & disclosure coordination:** target is **30–90 days** depending on severity and remediation complexity. If immediate risk to patients or production systems exists, we will prioritize an urgent fix and coordinate an accelerated timeline.
- We follow responsible disclosure best practices; we will coordinate public disclosure with the reporter and provide credit where appropriate.

## Severity & Prioritization
We triage using a standard risk-based approach (impact × exploitability). Examples:
- **Critical:** Remote code execution, unauthenticated access to PHI, full DB compromise.
- **High:** Broken authentication/authorization allowing access to other users’ PHI, severe SQL injection.
- **Medium:** Sensitive data exposure in logs, CSRF in high-privilege workflows.
- **Low:** UI issues, minor info leaks without PHI exposure.

We may ask for a CVSS vector or provide one in our internal tracking.

## Responsible Disclosure Rules
- Do not access, exfiltrate, or modify real patient data. Use synthetic/demo data for PoC.
- Do not publicly disclose the vulnerability before we publish a fix or coordinate disclosure.
- Avoid social engineering or denial-of-service tests against production systems.
- If you need to share sensitive details with multiple parties, ask for our secure channel info.

## Data Protection & Controls (summary)
MedicoX is built with the following security controls (replace with your exact implementations):
- Encryption in transit (TLS 1.2/1.3) and at rest (AES-256 or equivalent).
- Role-based access control (RBAC) and least-privilege principles.
- Audit logging for access to protected health information (PHI).
- Secure secrets management (do not store secrets in repo or images).
- Regular dependency and container scanning, and CI-based security checks prior to merge.

## Compliance Notes
If you intend to use MedicoX in a regulated environment (e.g., HIPAA, GDPR), you must:
- Execute a Business Associate Agreement (BAA) where applicable.
- Follow local data residency and data-subject-request procedures.
- Audit and document any production deployments for compliance.

## Security contact & triage
- Primary contact: `medicox270@gmail.com` 
- If you do not receive a response within 7 days, open an issue titled: `SECURITY: undisclosed vulnerability report follow-up`.

## Public disclosures / CVEs
We will coordinate public advisories and CVE assignments for confirmed issues. We will notify impacted users and provide mitigation steps and upgrade instructions.

## Development & Contribution Guidelines (security-specific)
- Do not commit secrets, credentials, or private keys. Use the secret scanning tool and CI checks.
- All pull requests touching authentication, encryption, or data access must have at least one security-savvy reviewer and pass automated security checks.
- Follow secure-coding guidelines (input validation, parameterized queries, safe deserialization).

## Acknowledgements
We appreciate vulnerability reports and credit contributors who follow our disclosure policy. If you would like to be credited, state your preferred name/handle in your report.

