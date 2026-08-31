# The Revamp UG - Cleanup and 360px Audit

## Scope

This pass continued the site-wide editorial cleanup on the `Homepage-fixes` branch of `DaviesMenace1/the-revamp-ug-finale`. The review covered public editorial pages, shared homepage sections, service detail pages, the global header, and the persistent account navigation.

## Completed cleanup

| Area | Result |
|---|---|
| Journal listing | Removed `01 - Featured story`, `02 - The archive`, and `03 - Keep looking` prefixes. Normalized the supporting sentence so it no longer uses decorative dash spacing. |
| Services listing | Removed numbered section labels, service-card indices, approach-step indices, material-card indices, and the large decorative `01` watermark. |
| Shared homepage services section | Removed the numbered `The practice` labels from the service cards. |
| Homepage editorial sections | Removed numbered service-card and project-card overlays. Removed numeric prefixes from the process rows and simplified their mobile grid. |
| Service detail pages | Removed numeric prefixes from the process rows while preserving the existing process hierarchy. |
| About page | Preserved the earlier removal of decorative title numbering. |
| Em dashes | No em dashes remain in the reviewed `app`, `components`, or `lib` source trees. |

## Validation

The edited files pass targeted ESLint with **zero errors**. The repository TypeScript check passes with `pnpm tsc --noEmit`. The targeted lint run still reports warnings that predate or are unrelated to this cleanup, primarily existing `<img>` optimization notices, one unused import, and an unused homepage process component.

The repository-wide lint command remains non-clean because of one existing React hooks lint error in `lib/theme-provider.tsx` concerning synchronous state-setting inside an effect, plus 102 warnings. That issue was not introduced by this pass.

## 360px compatibility audit

A clean development server was started and representative routes were requested and captured at a 360px viewport. The homepage, About page, Collections page, Contact page, and Cart page returned usable rendered captures. The homepage capture was visually blocked by the site's cookie-consent dialog and the sandbox authentication/configuration notice, so the underlying hero and collage could not be fully judged from that capture.

The Services and Journal routes, along with Portfolio, FAQs, and Book Consultation, intermittently stalled during headless rendering while Next.js compiled or waited on data-dependent rendering. Direct requests showed that this was route-rendering latency in the local audit environment rather than a confirmed CSS overflow failure. Those pages should receive a follow-up visual pass against a warmed production build or a seeded preview environment.

| Route or feature | 360px status | Finding |
|---|---|---|
| Global header | No confirmed horizontal overflow | The mobile action cluster uses fixed-size controls with a non-shrinking account/cart/menu set. The 360px calculation is tight but fits with the current logo and 16px side padding. |
| Mobile theme extension | Compatible by structure | The theme switcher is positioned below the menu control and does not add horizontal width to the header. |
| Homepage collage and hero | Not fully verifiable in capture | Cookie consent and the sandbox configuration overlay obscured the page. Source layout is mobile-first, with one-column service/project cards and two-column collection cards. |
| Homepage collection cards | No source-level failure found | Two-column layout is present at the base breakpoint, with short labels and overflow-hidden image wrappers. Verify the longest category label on real content. |
| About page | No visible failure found in capture | Sections collapse to one column before the `sm` breakpoint. Long headings wrap within max-width containers. |
| Services listing | Not confirmed | Route rendering was slow in the local data environment. The source uses one-column service chapters at base width, horizontal scrolling for category filters, and a two-column materials grid. The materials grid and the search/filter strip are the highest-risk areas to verify visually. |
| Journal listing | Not confirmed | Route rendering was slow in the local data environment. The archive intentionally uses a two-column grid at base width, so long article titles and metadata should be checked with production-length content. |
| Collections | No visible failure found in capture | The product grid and filters render within the viewport in the captured route. Verify longest product names and the Add to Cart control with real catalogue data. |
| Cart | No visible failure found in capture | The route rendered at 360px without an obvious horizontal overflow in the initial viewport. Checkout and empty-cart states should still be tested interactively. |
| Contact | No visible failure found in capture | The initial route rendered at 360px. Form field and validation states were not exhaustively exercised. |
| Account navigation | No source-level failure found | The mobile account shell uses a full-width header, 44px controls, and an off-canvas menu capped at `min(92vw, 25rem)`, which is suitable for 360px. Member pages should still be checked behind authentication. |
| Membership and trade portals | Not fully audited | Entitlement logic is implemented, but authenticated member states were not available in the clean headless session. Payment UI suppression requires a signed-in active-member test. |
| Client portal routes | Not fully audited | Persistent account navigation is present in source, but authenticated data states and long project/message content need a real member-session pass. |

## Recommended follow-up

The remaining audit risk is not a confirmed 360px CSS defect. It is the inability to complete reliable visual captures for data-dependent routes in the local environment, combined with the cookie and sandbox overlays. The next verification should run against a warmed production or preview build with cookie consent already stored, a seeded services and journal dataset, and an authenticated member session for account, membership, trade, and client portal routes.
