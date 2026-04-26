# AGENTS.md

This is a monorepo of services used to power my personal website. Each top-level directory represents a Cloudflare Worker:

* `web`: The front-end of the website
* `cms`: The content management system
* `cms-backup`: Data backup
* `files`: File serving and caching

For project-specific context, see `AGENTS.md` within each directory.

## Making Changes

When making code changes, follow these rules:

1. Use `volta` to manage node versions, `pnpm` for package management.
2. Validate code changes by running `pnpm run dryrun` and `pnpm run typecheck`.
3. Format code with `pnpm run format`.

## Running Commands Across All Projects

This repo uses pnpm workspaces. Use `-r` (recursive) to run a script in every package:

```sh
pnpm -r run typecheck
pnpm -r run format
pnpm -r run dryrun
pnpm -r run deploy
```

When asking questions, use the question format.
