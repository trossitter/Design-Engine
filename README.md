# Foundry — product surface

Foundry is a build-free product surface that forges a brief, wireframe, Figma link, or
reference URL into a planned, reviewable landing page. It also preserves the
quick-section flow and adds a focused plain-language tweak path.

The interface follows the [quiet confidence](docs/quiet-confidence.md) principle:
structure and affordance first, explanation only when it earns its place.

Product decision: [source library and intent-ranked testimonials](docs/product-decisions/source-library.md).

**▶ Try it live: https://trossitter.github.io/Design-Engine/**

The site uses native ES modules and hash routing, so it remains directly deployable to
GitHub Pages without rewrite rules or a build step. Phase 1 runs against the `MOCK`
adapter in `src/api.js`; switching `ADAPTER` to `LIVE` is the Phase 2 wiring seam for
`POST /generate-page`.

Serve the folder from any static web server, then open `#/` and walk each mode. Opening
`index.html` directly is not supported because browsers block ES-module imports from
`file://` URLs.

Run `npm test` for the route, intake-contract, mock-plan, mock-generation, and live-response
normalization checks. No dependencies, API keys, or network access are required.

## Product tour

| Choose a path | Bring the spark |
| --- | --- |
| <img src="docs/screenshots/foundry-hub-light.jpg" alt="Foundry hub in the light theme" width="360"> | <img src="docs/screenshots/foundry-intake-light.jpg" alt="Foundry brief intake in the light theme" width="360"> |

| Review the work | Fresh off the anvil |
| --- | --- |
| <img src="docs/screenshots/foundry-review-dark.jpg" alt="Foundry review scorecard in the dark theme" width="360"> | <img src="docs/screenshots/foundry-published-dark.jpg" alt="Foundry publish screen with ember details in the dark theme" width="360"> |

### Bring trusted source material

<img src="docs/screenshots/foundry-source-library-dark.jpg" alt="Foundry source library with a verified Drive link and intent-ranked testimonials" width="720">
