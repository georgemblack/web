# AGENTS.md

This repo contains a web app that runs on Cloudflare Workers and uses:

- TanStack Start
- Tailwind CSS for styles
- Kumo (`@cloudflare/kumo`) for components
- Cloudflare D1 for data storage

The app itself is a simple blog editor that allows the user to view and edit blog posts. The contents of each blog post is made of up "blocks", each of which can represent Markdown text, an image, a video, etc.

The database schema is stored in `schemas/db.sql`.
