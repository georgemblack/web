# AGENTS.md

This repository contains standalone services used to power my personal website. Each top-level directory can be moved into its own repository and represents a Cloudflare Worker:

* `web`: The front-end of the website (also serves files from R2 at `/files/*`)
* `cms`: The content management system
* `cms-backup`: Data backup

For project-specific context, see `AGENTS.md` within each directory.

## Making Changes

When making code changes, follow these rules:

1. Use `volta` to manage node versions, `pnpm` for package management.
2. Validate code changes by running `pnpm run dryrun` and `pnpm run check`.
3. Use `pnpm run check -- --fix` to apply formatting and safe lint fixes.

## Running Commands

Run pnpm commands from the individual project directory. Each project has its own
`package.json` and `pnpm-lock.yaml`.

When asking questions, use the question format.
