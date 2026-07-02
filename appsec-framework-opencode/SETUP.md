# OpenCode Setup — AppSec Testing Framework

This package is pre-converted into OpenCode's native skill format so it works
across ALL your projects/websites, not just one repo.

## 1. Install globally (recommended, since you'll reuse this on future sites)

Copy the two folders into OpenCode's global config directory:

```bash
mkdir -p ~/.config/opencode
cp -r skills ~/.config/opencode/skills          # merges with any existing skills
cp -r security ~/.config/opencode/security       # phases/tools/checklist reference docs
```

If ~/.config/opencode/skills already has other skills, this just adds these
33 alongside them (folder names won't collide unless you already made one
named e.g. "jwt-review").

## 2. Verify it loaded

```bash
opencode
```
Then inside the TUI, ask: "what skills do you have available?" — you should
see all 33 (access-control, pentest-orchestrator, audit-log-integrity, etc.)
listed by OpenCode's native `skill` tool.

## 3. Run an assessment against a real target

You do NOT need to be inside any specific project folder for this, since the
skills are global. Just cd anywhere (or into the target site's repo if you
want white-box/source-level checks) and run:

```bash
cd ~/projects/my-other-website     # or any folder, e.g. ~/projects/antpay-api
opencode
```

Then type a prompt like:

> I own and am authorized to test [mywebsite.com]. Use the pentest-orchestrator
> skill to run a black-box + grey-box assessment. I have two test accounts:
> [describe roles]. No source access for this one, so skip white-box/phase 5/9.

Or for source-level review of a repo you're sitting in:

> Use pentest-orchestrator against this repo. I have admin access to the code
> and a staging environment at [url]. Run the full pipeline including
> white-box and secure-code-review.

The orchestrator skill will pull in `technology-detector`, `recon-agent`, and
the framework-specific skills (express-security, vue-security, etc.) as
needed, and hand findings to `report-generator` at the end.

## 4. Every new site — restate authorization explicitly

The framework's safety contract (in `security/methodology.md`) requires
explicit authorization to be confirmed before any module runs. For each NEW
target you point this at, say plainly in your prompt that you own it or are
authorized to test it. This isn't just a formality — it's what keeps every
skill in scope for what it was built for.

## 5. Optional: project-local instead of global

If you'd rather scope this to just one repo (e.g. only ANTPAY_API) instead of
all future projects, copy into the repo instead of home directory:

```bash
cp -r skills .opencode/skills
cp -r security .opencode/security
```
Commit `.opencode/` to that repo's git if you want teammates to get it too.
