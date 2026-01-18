# Project Details

## Overview
- Purpose: Personal website built with Next.js + React
- Routes: `/` (projects), `/about`, `/extras`
- Status: Projects/about content aligned with resume

## Stack
- Framework: Next.js (App Router)
- Language: TypeScript
- Styling: Tailwind CSS (v4)
- Package manager: npm
- Fonts: Fraunces (display), Manrope (body)

## Structure
- `src/app/layout.tsx`: Global layout + navigation + background
- `src/app/page.tsx`: Projects landing page
- `src/app/about/page.tsx`: About page
- `src/app/extras/page.tsx`: Extras placeholder
- `src/app/globals.css`: Theme tokens and base styles

## Runbook
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build: `npm run build`
- Start production: `npm start`

## Design Notes
- Landing page is the projects list (vertical scroll).
- Navigation mirrors the reference: about, projects, extras.
- Content column is centered and narrower to match the reference.

## Decisions Log
- 2025-01-18: Selected TypeScript, Tailwind, App Router, and npm.
- 2025-01-18: Chose Fraunces + Manrope for typography.
