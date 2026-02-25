# AGENTS.md

This is a monorepo of services used to power my personal website. Each top-level directory represents a Cloudflare Worker:

* `web`: The front-end of the website
* `cms`: The content management system
* `cms-db`: Database functions
* `cms-backup`: Data backup

For project-specific context, see `AGENTS.md` within each directory.

## Making Changes

When making code changes, follow these rules:

1. Use `volta` to manage node versions, `pnpm` for package management.
2. Make changes on a new branch off of `master`. The branch name should be prefixed with `ai/`.
3. Validate code changes by running `pnpm run dryrun` and `pnpm run typecheck`.
4. Format code with `pnpm run format`.
5. If you're asked to open a pull request, the pull request must be prefixed with: "AI:", and the description should contain a note disclosing that the changes were AI generated.

When asking questions, use the question format.
