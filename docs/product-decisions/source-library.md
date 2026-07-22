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

## Current implementation

The live surface sends linked and uploaded resources with the intake. The backend can
extract plain-text, Markdown, CSV, JSON, and XML uploads today; unsupported documents
and links remain attached but produce an explicit warning. There is no fake access
verification or seeded testimonial ranking. Google OAuth, Drive folder traversal, PDF/
DOCX extraction, and ranking over extracted testimonial records remain deployment work.

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

The current proof-of-concept sends resource metadata and small uploaded text files in the
intake. Production should replace raw uploads with short-lived, server-resolved resource
IDs before accepting large folders or long-lived Drive access.
