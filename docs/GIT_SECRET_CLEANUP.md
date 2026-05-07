# Remove committed secrets & rotate credentials

If sensitive files (for example `.env` or `.mcp.json`) were accidentally committed, follow these steps immediately:

1. Remove the file from the repository index but keep it locally:

```bash
git rm --cached .mcp.json
git rm --cached .env
git commit -m "chore(secrets): remove sensitive files from repo"
git push origin main
```

2. Add the files to `.gitignore` (already done) and provide an example/template instead (see `.mcp.json.example`).

3. Rotate any exposed credentials right away (Neon API keys, GitHub tokens, Supabase service keys, OAuth client secrets). Log into the provider console and revoke/replace keys.

4. If you need to remove a secret from the repository history, use a history-rewriting tool **carefully** and coordinate with your team. Example with `git filter-repo` (recommended):

```bash
pip install git-filter-repo
git clone --mirror git@github.com:your-org/your-repo.git
cd your-repo.git
git filter-repo --invert-paths --paths .mcp.json --paths .env
git push --force
```

Or use the BFG Repo-Cleaner (simpler but less flexible) — follow official docs.

5. Verify CI/CD and secrets store: update GitHub Actions / CI variables to the new rotated keys and remove any plaintext references from build logs.

6. Audit other credentials in the repo (OAuth client secrets, service tokens, `*.key`/`*.pem` files) and rotate where necessary.

If you'd like, I can prepare a small script to scan the repo for common secret patterns (API keys, tokens, private keys) and list risky files. Reply `scan` to run a quick scan.
