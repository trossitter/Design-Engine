# Source library and intent-ranked testimonials

**Status:** locked product requirement  
**Recorded:** 2026-07-21  
**Source:** direct CEO feedback relayed by Thalia

Foundry must treat compliance notes, claims support, testimonials, and similar proof as
maintained source material—not copy pasted into a brief and allowed to go stale.

## Required experience

- A user can paste a Google Drive or other file link.
- Foundry checks whether the current workspace can access that resource before it is
  used. A pasted link is never assumed to be readable.
- A user can drag and drop or browse for a local file instead.
- The source’s role is explicit: testimonial, compliance, or reference.
- Testimonial libraries remain updateable at their source. The CEO can change the
  library without rebuilding Foundry’s internal copy store.
- A user can state the page intent and review ranked testimonial matches before
  generation. Human selection overrides ranking.

Example: intent `stress` should rank an `oxidative stress` testimonial highly, alongside
other relevant approved proof. The UI proposes; the user chooses.

## Track B now

The MOCK surface stores linked and uploaded resources separately from the locked A3
intake, represents access checking honestly as a demo, ranks testimonial metadata by
intent, and records the user’s selected IDs. It does not perform real Google OAuth.

## Live contract addendum

The current `POST /generate-page` A3 request has only one `referenceUrl`; it cannot carry
this requirement safely. Track A and Track B must agree on:

```json
{
  "intake": {
    "resources": [
      {
        "resourceId": "resolved-server-side-id",
        "kind": "testimonials",
        "sourceType": "google-drive"
      }
    ],
    "testimonialSelection": {
      "intent": "stress",
      "selectedIds": ["oxidative-stress", "daily-calm"]
    }
  }
}
```

Access verification needs either a small preflight contract or a signed resource token
returned by a Drive connector. OAuth credentials and raw long-lived access tokens must
not be placed in `POST /generate-page` or browser state. Uploaded files need the same
resolved-resource shape after upload.

Until that contract exists, `contractIntake()` remains exactly A3-compatible and the
new resource data stays in the MOCK-only `resourceContext` seam.
