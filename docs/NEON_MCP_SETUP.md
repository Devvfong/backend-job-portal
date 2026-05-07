# Neon MCP Server — Quick setup (prepare-only)

This document explains how to wire the Neon MCP Server into your local development environment. The changes here are "prepare-only": they add scripts and documentation so you can connect or provision Neon safely. Do not add real secrets to the repository.

Prerequisites

- Node.js >= 18
- An account on Neon (optional for prepare-only steps)
- `NEON_API_KEY` if you want to run a local MCP server or connect remote agents

Quick commands (prepare-only)

- Add Neon MCP to your editor/project (interactive/OAuth):

```bash
npx neonctl@latest init
```

- Register Neon MCP server without OAuth (useful for remote agents):

```bash
npx add-mcp https://mcp.neon.tech/mcp --header "Authorization: Bearer $NEON_API_KEY"
```

- Start a local Neon MCP server (uses `NEON_API_KEY`):

```bash
npx -y @neondatabase/mcp-server-neon start $NEON_API_KEY
```

On Windows (cmd):

```bash
cmd /c "npx -y @neondatabase/mcp-server-neon start %NEON_API_KEY%"
```

What we added in this repository

- `package.json` scripts: `mcp:init`, `mcp:add`, `mcp:add:with-key`, `mcp:local`, `mcp:local:win`
- `.env.example`: placeholders for `NEON_API_KEY`, `NEON_PROJECT_ID`, and `DATABASE_URL`
- This `docs/NEON_MCP_SETUP.md` file with usage notes and security guidance

Security & guidance

- Treat `NEON_API_KEY` as a secret. Store it in your local `.env` (ignored by git), your CI secrets, or GitHub Actions secrets — never commit it.
- Use MCP for local development and testing only. Avoid connecting MCP to production databases or data containing PII.
- When using `add-mcp` with `--header`, prefer an organization-scoped API key with least privileges.

Next steps (pick one)

1. Provision a Neon project via the Neon API (requires `NEON_API_KEY`) — I can do this if you provide the API key or tell me where it is stored (CI/GitHub secrets).
2. Link an existing Neon project — provide `NEON_PROJECT_ID` and a service token/connection string.
3. Run migrations on a Neon branch via MCP — requires access to the Neon project and may create a temporary branch.

If you want me to proceed, tell me which option above to perform and how you'd like to provide credentials (paste here, point to CI secret, or say "I'll run locally").
