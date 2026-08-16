# NotebookLM / Gemini Notebook MCP

> How NorthPaw's knowledge base stays queryable from Cursor via Gemini Notebook (formerly NotebookLM).

Last updated: 2026-08-01

---

## What we use

**Package:** [`notebooklm-mcp-cli`](https://github.com/jacob-bd/gemini-notebook-mcp-cli) (PyPI / `uv tool`)

- CLI: `nlm`
- MCP server binary: `notebooklm-mcp`
- Why this one: supports Google's **Gemini Notebook** rebrand at `notebook.google.com`. The old `npx notebooklm-mcp@latest` (PleasePrompto 2.0.0) only detects `notebooklm.google.com` and hangs forever on login.

## Cursor config

`~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "notebooklm-mcp": {
      "command": "/Users/fiegellansknowledge/.local/bin/notebooklm-mcp",
      "args": []
    }
  }
}
```

After changing config: **restart the MCP server** (Cursor Settings → MCP) or reload the window.

## First-time / re-auth

Run in a normal terminal (not via an MCP tool — login needs an uninterrupted browser flow):

```bash
export PATH="$HOME/.local/bin:$PATH"
nlm login
nlm login --check
nlm doctor
```

Cookies live in `~/.notebooklm-mcp-cli/profiles/default/`. They last ~2–4 weeks; when Chat/CLI starts failing, re-run `nlm login`.

## Keeping the notebook in sync with `gpt_project/`

Manual upload in the browser works. For bulk updates after editing docs:

```bash
# List notebooks to get the id
nlm notebook list

# Add / refresh a source from a local markdown file
nlm source add <notebook-id> --file documentation/gpt_project/01_PRODUCT_VISION.md
# …repeat, or script over the folder
```

Prefer one source per numbered file so updates stay surgical.

## Upgrading the MCP

```bash
uv tool upgrade notebooklm-mcp-cli
# or reinstall:
uv tool install --force notebooklm-mcp-cli

nlm --version   # confirm latest
nlm doctor
```

Then restart the Cursor MCP server.

## What not to use

| Package | Why skip |
|---|---|
| `npx notebooklm-mcp@latest` (PleasePrompto) | Stuck on 2.0.0; login detection broken after Gemini Notebook rename |
| Local patched copy at `~/.local/share/notebooklm-mcp-patched` | Temporary band-aid — remove when ready; replaced by this CLI |

## Optional cleanup

```bash
rm -rf ~/.local/share/notebooklm-mcp-patched
# Old PleasePrompto browser profile (if still present):
rm -rf ~/Library/Application\ Support/notebooklm-mcp
```
