# Frontend Implementation Plan

## Phase 1: Project Setup
- [ ] Initialize React + Vite project with TypeScript & Tailwind CSS.
- [ ] Install Shadcn UI and configure theme (dark mode preferred).
- [ ] Set up project folder structure:
  ```
  src/
    App.tsx           # Main Entry
    pages/
      Landing.tsx     # Upload page
      Dashboard.tsx   # Results dashboard
  components/
    csv-uploader.tsx
    graph-viewer.tsx
    ring-table.tsx
    summary-cards.tsx
    node-detail-panel.tsx
  lib/
    types.ts          # Shared TypeScript interfaces
  ```

## Phase 2: CSV Upload Page (Landing)
- [ ] Build `CsvUploader` component:
  - [ ] Drag-and-drop zone with file type validation (`.csv` only).
  - [ ] Display file name and size after selection.
  - [ ] "Analyze" button to trigger upload to backend API.
  - [ ] Loading spinner / progress bar during processing.
  - [ ] Error state for invalid files.

## Phase 3: Results Dashboard
- [ ] **Summary Cards** (`summary-cards.tsx`):
  - [ ] Total Accounts Analyzed.
  - [ ] Suspicious Accounts Flagged.
  - [ ] Fraud Rings Detected.
  - [ ] Processing Time (seconds).
- [ ] **Fraud Ring Table** (`ring-table.tsx`):
  - [ ] Columns: Ring ID, Pattern Type, Member Count, Risk Score, Member IDs.
  - [ ] Sortable by Risk Score.
  - [ ] Clickable rows to highlight the ring on the graph.
- [ ] **Graph Visualization** (`graph-viewer.tsx`):
  - [ ] Integrate `react-force-graph-2d` or `vis.js`.
  - [ ] Nodes = Accounts, Directed Edges = Transactions.
  - [ ] Color-code: Red for suspicious, Blue/Gray for normal.
  - [ ] Node size proportional to suspicion score.
  - [ ] On hover/click → show `NodeDetailPanel` with account info.
  - [ ] Highlight selected ring's nodes/edges on table row click.
- [ ] **Download Button:**
  - [ ] "Download JSON Report" button.
  - [ ] Triggers download of the `results.json` blob from backend response.

## Phase 4: UI Polish & Responsiveness
- [ ] Dark mode theme with premium color palette.
- [ ] Smooth page transitions (upload → dashboard).
- [ ] Micro-animations on cards and graph interactions.
- [ ] Responsive layout for different screen sizes.
- [ ] Empty states and error boundaries.
