# Security

Report suspected vulnerabilities privately to **support@ugurlabs.com** with the affected revision, reproduction steps, and expected impact. Do not open public issues containing exploit details, credentials, tenant records, or personal data. We will coordinate disclosure after investigating.

Only the current main branch is maintained. Update dependencies and deployments regularly.

## Deployment boundaries

- Use HTTPS for real users and keep PostgreSQL off the public network.
- Separate schema-migration and application credentials.
- Tenant isolation is enforced in application code. Database access is privileged: the runtime role can access all workspace rows.
- Keep `AUTH_SECRET`, `DATA_ENCRYPTION_KEY`, and backups confidential. Preserve the encryption key for restoration.
- Review connector permissions and exported remediation scripts before using them.
- Keep the optional demo limited to synthetic data.
- Self-hosting does not inherit hosted legal terms, security operations, retention, or infrastructure guarantees.

Environment files, keys, database files, and generated output must stay out of Git and Docker build contexts. Scan history before publishing a fork. If a credential was committed, rotate it; deleting today's file does not erase history.
