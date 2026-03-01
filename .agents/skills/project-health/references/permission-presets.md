# Permission Presets

Curated permission presets for `settings.local.json`. Each preset is a JSON array of permission strings grouped with `//` comments. Compose presets by stacking: Universal Base + language preset + deployment preset + extras.

## Syntax Reference

| Pattern | Meaning |
|---------|---------|
| `Bash(git *)` | Space before `*` = word boundary. Matches `git status` but not `gitk`. **Preferred syntax.** |
| `Bash(git*)` | No space = prefix match. Matches `git status` AND `gitk`. |
| `Bash(nvidia-smi)` | Exact match — no arguments. Use for bare commands. |
| `WebFetch` | Blanket web fetch (all domains) |
| `WebFetch(domain:example.com)` | Domain-scoped web fetch |
| `WebSearch` | Blanket web search |
| `mcp__servername__*` | All tools on one MCP server |
| `mcp__servername__tool_name` | One specific MCP tool |
| `Read(.claude/**)` | Read files in project's .claude/ (recursive) |
| `Edit(~/Documents/**)` | Edit files under home Documents (recursive) |
| `Read(//tmp/**)` | Read from absolute path (`//` = filesystem root) |

### Format Notes

- **Deprecated**: `Bash(git:*)` colon syntax still works but prefer space syntax `Bash(git *)`
- **"Don't ask again"** prompt uses legacy colon format (e.g. `node:*`) — it's equivalent but looks different
- **Comments**: `"// --- Section ---"` strings in the allow array are ignored and useful for organisation
- **Not hot-reloaded**: Changes to `settings.local.json` require a session restart. "Don't ask again" bypasses this because it injects into the running session directly.

**Critical**: Project `settings.local.json` **SHADOWS** global settings (does not merge). If a project has its own allow list, the global allow list is ignored entirely for that project.

Shell operators (`&&`, `||`, `;`) are handled safely — `Bash(git *)` won't match `git add && rm -rf /`.

---

## Universal Base

Every project gets these. Version control, file operations, and basic tools needed for all development.

```json
"// --- Version Control ---",
"Bash(git *)",
"Bash(gh *)",
"Bash(gh repo *)",
"Bash(gh issue *)",
"Bash(gh pr *)",
"Bash(gh api *)",
"Bash(gh search *)",
"Bash(gh run *)",
"Bash(gh release *)",

"// --- File Operations ---",
"Bash(cd *)",
"Bash(ls *)",
"Bash(cat *)",
"Bash(head *)",
"Bash(tail *)",
"Bash(wc *)",
"Bash(sort *)",
"Bash(mkdir *)",
"Bash(rm *)",
"Bash(rmdir *)",
"Bash(cp *)",
"Bash(mv *)",
"Bash(ln *)",
"Bash(touch *)",
"Bash(chmod *)",
"Bash(chown *)",
"Bash(find *)",
"Bash(tree *)",
"Bash(du *)",
"Bash(df *)",
"Bash(readlink *)",
"Bash(realpath *)",
"Bash(stat *)",
"Bash(file *)",

"// --- Archives ---",
"Bash(tar *)",
"Bash(zip *)",
"Bash(unzip *)",
"Bash(gzip *)",
"Bash(gunzip *)",

"// --- Text Processing ---",
"Bash(grep *)",
"Bash(rg *)",
"Bash(awk *)",
"Bash(sed *)",
"Bash(diff *)",
"Bash(jq *)",
"Bash(yq *)",
"Bash(echo *)",
"Bash(printf *)",
"Bash(tee *)",
"Bash(cut *)",
"Bash(tr *)",
"Bash(uniq *)",
"Bash(xargs *)",
"Bash(basename *)",
"Bash(dirname *)",

"// --- System ---",
"Bash(which *)",
"Bash(whereis *)",
"Bash(type *)",
"Bash(ps *)",
"Bash(kill *)",
"Bash(env *)",
"Bash(export *)",
"Bash(source *)",
"Bash(date *)",
"Bash(uname *)",
"Bash(make *)",
"Bash(id *)",
"Bash(whoami *)",
"Bash(hostname *)",
"Bash(uptime *)",

"// --- Process Management ---",
"Bash(pkill *)",
"Bash(lsof *)",
"Bash(pgrep *)",
"Bash(timeout *)",
"Bash(ss *)",

"// --- Security / Crypto ---",
"Bash(openssl *)",
"Bash(gitleaks *)",

"// --- System Utilities ---",
"Bash(printenv *)",
"Bash(xxd *)",
"Bash(base64 *)",
"Bash(nslookup *)",

"// --- Network ---",
"Bash(curl *)",
"Bash(wget *)",
"Bash(ssh *)",
"Bash(scp *)",
"Bash(rsync *)",
"Bash(dig *)",

"// --- Skill Scripts ---",
"Bash(python3 *)",

"// --- File Access ---",
"Read(.claude/**)",
"Edit(.claude/**)",
"Write(.claude/**)",
"Read(//tmp/**)",
"Edit(//tmp/**)",

"// --- Web ---",
"WebSearch",
"WebFetch"
```

**File access patterns** use gitignore-style syntax:
- `.claude/**` — project-relative (scripts, artifacts, screenshots)
- `//tmp/**` — absolute path (`//` prefix = filesystem root)
- `~/.claude/**` — home-relative (global rules, memory)
- `~/Documents/**` — home-relative (cross-project reads)
- `*` matches files in one directory, `**` matches recursively

Add home-relative paths to **global** `~/.claude/settings.local.json` only (not per-project):

```json
"// --- Global File Access (add to ~/.claude/settings.local.json) ---",
"Read(~/.claude/**)",
"Edit(~/.claude/**)",
"Read(~/Documents/**)",
"Edit(~/Documents/**)",
"Read(~/Downloads/**)"
```

---

## JavaScript / TypeScript

For any JS/TS project. Add to Universal Base.

```json
"// --- Node.js ---",
"Bash(node *)",
"Bash(npm *)",
"Bash(npx *)",

"// --- Alternative Runtimes ---",
"Bash(bun *)",
"Bash(bunx *)",
"Bash(deno *)",

"// --- Package Managers ---",
"Bash(pnpm *)",
"Bash(yarn *)",

"// --- TypeScript ---",
"Bash(tsc *)",
"Bash(tsx *)",

"// --- Bundlers ---",
"Bash(esbuild *)",
"Bash(vite *)",
"Bash(turbo *)",

"// --- Dev Servers ---",
"Bash(pm2 *)",

"// --- Testing ---",
"Bash(jest *)",
"Bash(vitest *)",
"Bash(playwright *)",
"Bash(playwright-cli *)",
"Bash(cypress *)",

"// --- Linting / Formatting ---",
"Bash(eslint *)",
"Bash(prettier *)",
"Bash(biome *)"
```

---

## Python

For Python projects. Add to Universal Base.

```json
"// --- Python Runtime ---",
"Bash(python *)",
"Bash(python3 *)",

"// --- Package Managers ---",
"Bash(pip *)",
"Bash(pip3 *)",
"Bash(uv *)",
"Bash(poetry *)",
"Bash(pipx *)",
"Bash(conda *)",

"// --- Testing / Quality ---",
"Bash(pytest *)",
"Bash(mypy *)",
"Bash(ruff *)",
"Bash(black *)",
"Bash(flake8 *)",
"Bash(isort *)",

"// --- Dev Servers ---",
"Bash(flask *)",
"Bash(uvicorn *)",
"Bash(gunicorn *)",
"Bash(django-admin *)",

"// --- Notebooks ---",
"Bash(jupyter *)"
```

---

## PHP

For PHP projects including WordPress and Laravel. Add to Universal Base.

```json
"// --- PHP Runtime ---",
"Bash(php *)",
"Bash(composer *)",

"// --- WordPress ---",
"Bash(wp *)",

"// --- Testing / Quality ---",
"Bash(phpunit *)",
"Bash(phpstan *)",
"Bash(phpcs *)",
"Bash(phpcbf *)",
"Bash(pest *)",

"// --- Laravel ---",
"Bash(artisan *)",
"Bash(sail *)"
```

---

## Go

For Go projects. Add to Universal Base.

```json
"// --- Go ---",
"Bash(go *)",
"Bash(golangci-lint *)"
```

---

## Rust

For Rust projects. Add to Universal Base.

```json
"// --- Rust ---",
"Bash(cargo *)",
"Bash(rustc *)",
"Bash(rustup *)"
```

---

## Ruby

For Ruby / Rails projects. Add to Universal Base.

```json
"// --- Ruby ---",
"Bash(ruby *)",
"Bash(gem *)",
"Bash(bundle *)",
"Bash(bundler *)",
"Bash(rails *)",
"Bash(rake *)",
"Bash(rspec *)"
```

---

## Cloudflare Worker

Deployment preset. Add to Universal Base + JavaScript/TypeScript.

```json
"// --- Wrangler ---",
"Bash(wrangler *)",
"Bash(npx wrangler *)"
```

---

## Vercel

Deployment preset. Add to Universal Base + JavaScript/TypeScript.

```json
"// --- Vercel ---",
"Bash(vercel *)",
"Bash(npx vercel *)",

"// --- Prisma (common with Vercel) ---",
"Bash(prisma *)",
"Bash(npx prisma *)"
```

---

## Docker / Containers

For containerised projects. Add to any stack.

```json
"// --- Docker ---",
"Bash(docker *)",
"Bash(docker-compose *)",

"// --- Kubernetes ---",
"Bash(kubectl *)",
"Bash(helm *)",

"// --- IaC ---",
"Bash(terraform *)",
"Bash(pulumi *)"
```

---

## Database

For projects that interact with databases directly. Add to any stack.

```json
"// --- SQL ---",
"Bash(psql *)",
"Bash(mysql *)",
"Bash(sqlite3 *)",

"// --- NoSQL ---",
"Bash(redis-cli *)",
"Bash(mongosh *)"
```

---

## Cloud CLIs

For cloud-deployed projects. Add to any stack.

```json
"// --- AWS ---",
"Bash(aws *)",

"// --- Google Cloud ---",
"Bash(gcloud *)",
"Bash(gsutil *)",

"// --- Azure ---",
"Bash(az *)"
```

---

## AI / GPU

For AI/ML workloads. Add to any stack.

```json
"// --- Local LLM ---",
"Bash(ollama *)",

"// --- GPU ---",
"Bash(nvidia-smi *)",
"Bash(nvidia-smi)",

"// --- API Key Passthrough ---",
"Bash(GEMINI_API_KEY=*)",
"Bash(OPENAI_API_KEY=*)",
"Bash(ANTHROPIC_API_KEY=*)"
```

Note: `Bash(nvidia-smi)` (no wildcard) matches the bare command with no arguments, which is the most common usage.

---

## MCP Servers

MCP (Model Context Protocol) servers provide tool access to external services. Permission patterns use the format `mcp__servername__toolname`.

### Per-Server Wildcards (Recommended)

Allow all tools on each MCP server you trust. You must list each server individually — `mcp__*` does NOT work as a blanket (the wildcard only matches within the last segment, not across the `__` boundary).

```json
"mcp__servername__*",
"mcp__playwright__*",
"mcp__another-server__*"
```

### Individual Tools

For maximum control, allow specific tools only:

```json
"mcp__servername__specific_tool",
"mcp__servername__another_tool"
```

---

## macOS

macOS-specific commands. Add when developing on macOS.

```json
"// --- macOS ---",
"Bash(brew *)",
"Bash(open *)",
"Bash(pbcopy *)",
"Bash(pbpaste *)",
"Bash(sips *)"
```

---

## LLM CLIs

AI/LLM command-line tools. Add when using AI assistants or review tools.

```json
"// --- LLM CLIs ---",
"Bash(claude *)",
"Bash(gemini-coach *)",
"Bash(elevenlabs *)"
```

---

## Firebase

Google Firebase CLI. Add alongside Cloud CLIs for Firebase projects.

```json
"// --- Firebase ---",
"Bash(firebase *)"
```

---

## Media Processing

Image and video processing tools. Add for projects that handle media assets.

```json
"// --- Media Processing ---",
"Bash(convert *)",
"Bash(identify *)",
"Bash(ffmpeg *)",
"Bash(ffprobe *)",
"Bash(ffplay *)"
```

---

## Combining Presets

Presets stack. Examples:

| Project Type | Presets to Combine |
|-------------|-------------------|
| Next.js on Vercel | Universal + JavaScript/TypeScript + Vercel |
| Cloudflare Worker | Universal + JavaScript/TypeScript + Cloudflare Worker |
| Django app | Universal + Python + Database + Docker |
| WordPress plugin | Universal + PHP |
| Rust CLI | Universal + Rust |
| ML project | Universal + Python + AI/GPU |
| Full-stack ops | Universal + JavaScript/TypeScript + Python + Docker + Database + MCP (blanket) |

When merging, deduplicate and keep the grouped `//` comment structure. The final `settings.local.json` should look like:

```json
{
  "permissions": {
    "allow": [
      "// --- Version Control ---",
      "Bash(git *)",
      "Bash(gh *)",
      "// --- Node.js ---",
      "Bash(node *)",
      "..."
    ],
    "deny": []
  }
}
```
