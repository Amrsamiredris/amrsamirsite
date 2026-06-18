# Project Features

Amr Samir Edris's portfolio site integrates professional event metrics-focused UI design with self-contained administrative and analytics dashboards.

---

## 1. Visual & Typography System
* **Premium Editorial Layout:** Set-up with dynamic typography contrast using `Outfit` sans-serif for UI details and numbers paired with `Instrument Serif` italic headlines for titles and quotes.
* **Graphite Dark Palette:** Clean charcoal/carbon surfaces (#07080a, #0c0e12) combined with solid white panels, and a singular cobalt blue accent (#2e62f6).
* **Asymmetric Bento Grids:** Experiences and project credentials automatically align into a custom asymmetric bento grid grid structure (2-column and 1-column splits) that re-flows responsively.
* **Interactive Hover Spotlight:** Bento cards feature a mouse glow spotlight effect tracking the coordinate variables (`--x`, `--y`) on desktop mouse movement.

---

## 2. Interactive Document cabinetry
* **Document Drawers:** Minimalist sliders containing Curriculum Vitae and Event Portfolio cards.
* **Responsive PDF Viewports:** Toggling a drawer slides down a custom inline browser PDF viewer on desktop screen sizes, falling back to a direct download/stream link on mobile viewports.

---

## 3. Looping Hero Rotating Words
* **Text Rotator:** An animated inline word container displaying Amr's core capabilities in sequence (immersive experiences, large-scale productions, brand strategies) with vertical scroll-entry keyframes.

---

## 4. Custom Analytics Engine
* **Visual Visibility Tracker:** A custom IntersectionObserver module (`tracker.js`) measuring exact stay durations (in seconds) per major site section (Hero, Experience, CV Viewer, Portfolio Viewer) without relying on heavy third-party cookies or scripts.
* **Event Tracking:** Logs session visits, unique visitor counts, and PDF view/download clicks.

---

## 5. Console & CMS Administration
* **Login Protection:** Secured by Supabase Auth (authenticated dashboard access).
* **Metrics Dashboard:** Integrates Chart.js line charts (page views over time) and bar charts (average stay times per section) rendered inside a dashboard panel.
* **General Config Editor:** Interactive forms to update name, contact details, and rotating hero words.
* **Card Registry:** Editor panel to add, edit, or delete bento card project details.
* **Media Uploader:** Storage upload interfaces to replace Curriculum Vitae or Event Portfolio PDFs and logos dynamically.
