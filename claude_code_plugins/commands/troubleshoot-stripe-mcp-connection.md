---
description: Troubleshoot your Stripe MCP connection in Claude Code
---

# Stripe MCP Connection Guide

## Quick diagnostics

Check your current status by running `/mcp` in Claude Code and look for "stripe" in the list.

---

## Not listed? Add Stripe MCP

**Option 1: Remote (Recommended)**

Run this command:

```
claude mcp add --transport http stripe https://mcp.stripe.com/
```

Then authenticate via OAuth in your browser (requires Stripe admin access).

**Option 2: Local with API key**

Run this command:

```
claude mcp add --transport stdio stripe --env STRIPE_SECRET_KEY=YOUR_KEY -- npx -y @stripe/mcp --tools=all
```

**Windows users:** Add `cmd /c` before `npx`:

```
claude mcp add --transport stdio stripe --env STRIPE_SECRET_KEY=YOUR_KEY -- cmd /c npx -y @stripe/mcp --tools=all
```

---

## Listed but not connecting?

**Remote connection issues**

Run `/mcp` in Claude Code, select Stripe, and choose "Authenticate" to refresh your OAuth token.

**Local connection issues**

Most common cause: Missing `STRIPE_SECRET_KEY`

Quick fix - set the environment variable:

```
export STRIPE_SECRET_KEY=your_key_here
```

Permanent fix - remove and re-add with the key:

```
claude mcp remove stripe
claude mcp add --transport stdio stripe --env STRIPE_SECRET_KEY=YOUR_KEY -- npx -y @stripe/mcp --tools=all
```

---

## Test your connection

Once connected, try asking Claude:

- "What's my Stripe account balance?"
- "List my recent customers"
- "Search Stripe documentation for subscription billing"

---

## Additional resources

- Full Stripe MCP documentation: https://docs.stripe.com/mcp
- Get Stripe API keys: https://dashboard.stripe.com/apikeys (use restricted keys when possible)
- Manage OAuth sessions: https://dashboard.stripe.com/settings/apps/com.stripe.mcp
- Claude Code MCP docs: https://docs.anthropic.com/en/docs/claude-code/mcp
