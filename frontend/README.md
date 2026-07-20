<div align="center">

<h1>🧬 TraceNet Frontend</h1>

<h3><strong>I</strong>nteractive <strong>N</strong>etwork <strong>T</strong>racing and <strong>E</strong>xploration for <strong>R</strong>esistance <strong>F</strong>low</h3>

<p><em>A Next.js interface for exploring the TraceNet graph, walking through algorithm execution, and presenting the project as a polished interactive story.</em></p>

[![Next.js](https://img.shields.io/badge/Next.js-16.2.7-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Status](https://img.shields.io/badge/Status-Interactive_Demo-brightgreen)](#overview)

<br/>

[**Overview**](#overview) · [**Why this frontend**](#why-this-frontend) · [**Pages**](#pages) · [**Stack**](#stack) · [**Run**](#getting-started) · [**Scripts**](#scripts)

</div>

---

## Overview

This folder contains the **TraceNet Next.js frontend**: a polished, interactive web app that presents the same resistance-network story as the main project, but in a more visual and presentation-friendly format.

It wraps the TraceNet graph data in a browser UI and turns the project into something that can be:
- explored as a landing page narrative,
- demonstrated as an animated network walkthrough,
- and used as a viva / presentation aid for the algorithms.

The frontend is centered around two experiences:

1. **Landing experience** — a scrollable, story-driven homepage that explains the problem, graph model, pipeline, algorithms, and findings.
2. **Network explorer** — an interactive visualization of the graph with filters, a node drawer, and connected-component controls.

The app consumes precomputed graph data from `public/data/hgt_graph.json` and does not rebuild the graph in the browser.

---

## Why this frontend

TraceNet is not just a code project; it is also a presentation-heavy DAA project. This frontend exists to make the algorithms easier to explain.

It helps with:
- **visual storytelling** — turning graph theory into a guided narrative,
- **algorithm explanation** — showing one algorithm at a time with data structures and result interpretations,
- **interactive exploration** — filtering nodes, inspecting species, and comparing graph structure,
- **demo readiness** — making the project look clean and coherent during review.

In short: the root project does the graph analysis, and this folder makes that analysis look good.

---

## Pages

### `/`
The main landing page.

It is assembled from the sections in `src/components/landing/`:
- hero section,
- threat section,
- network section,
- pipeline section,
- algorithms section,
- findings section,
- and a closing CTA.

### `/demo`
A demo-oriented canvas view.

This route renders the graph using the animation stack from `src/components/demo/` and `src/hooks/`, making it useful for live walkthroughs.

### `/network`
An interactive network explorer.

This page loads the graph data, displays the network canvas, and provides controls for:
- toggling node roles,
- toggling Gram categories,
- showing / hiding connected components,
- and inspecting node details in a side drawer.

---

## Stack

| Layer | Tools |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Language | TypeScript |
| Animation | Framer Motion |
| Graph rendering | D3 |
| State | Zustand |
| Styling | Tailwind CSS v4 + custom CSS |
| Testing | Node test runner for the frontend-specific tests |

---

## Data flow

TraceNet frontend uses a simple browser-side data contract:

```text
public/data/hgt_graph.json
  └─ loadGraphData()
      └─ pages and components render the network + algorithm results
```

The graph JSON includes:
- node metadata,
- weighted directed edges,
- algorithm outputs,
- and summary metrics used by the UI.

That means the frontend is fast to load and easy to deploy because it only reads static data.

---

## Project structure

```text
nextjs-frontend/
├── src/
│   ├── app/                 # App Router pages: /, /demo, /network
│   ├── components/          # Landing, demo, network, and UI components
│   ├── hooks/               # Animation / interaction hooks
│   ├── lib/                 # Graph data model, constants, execution helpers
│   └── store/               # Zustand state for demo playback
├── public/
│   └── data/                # Static graph JSON consumed by the UI
├── tests/                   # Frontend tests
├── package.json             # Scripts and dependencies
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind configuration
└── tsconfig.json            # TypeScript configuration
```

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

Then open the app in your browser at the local URL shown by Next.js.

### 3. Build for production

```bash
npm run build
```

### 4. Start the production server

```bash
npm run start
```

---

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the local Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production server after building |
| `npm run lint` | Lint the frontend code |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |
| `npm run test` | Run the Node-based frontend tests |

---

## Key UI areas

### Landing experience
The landing page is designed to feel like a polished project showcase rather than a generic dashboard.

It emphasizes:
- the biological motivation,
- the graph model,
- the algorithm map,
- and the final findings.

### Graph explorer
The explorer focuses on comprehension instead of raw density.

Highlights include:
- node inspection,
- edge and component context,
- role-based filtering,
- and a compact legend for presentation use.

### Demo canvas
The demo page is built for motion and narrative flow.

It is useful when you want the graph to feel alive during a presentation.

---

## Notes

- This frontend assumes the graph JSON already exists in `public/data/`.
- The main TraceNet preprocessing pipeline is still responsible for generating the underlying data.
- The UI is presentation-oriented, so it favors readability and visual flow over dense analytical controls.
- The app is intended as part of a course project, not a clinical or diagnostic tool.

---

## Related project files

- `src/app/page.tsx` — landing page composition
- `src/app/demo/page.tsx` — animated demo view
- `src/app/network/page.tsx` — interactive network explorer
- `src/lib/graph-data.ts` — graph JSON schema and loading logic
- `src/lib/algorithm-lessons.ts` — explanation content for the algorithm lessons
- `src/components/landing/` — homepage sections
- `src/components/network/` — explorer UI pieces
- `src/components/demo/` — demo graph canvas and animation layers

---

## Closing note

This subproject turns TraceNet from “an algorithms repo” into a site you can actually show to people without a backup slide deck and a nervous smile.

It keeps the project coherent: the root repository explains the graph, and this frontend helps the audience understand it.
