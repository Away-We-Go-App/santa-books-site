# Santa Books privacy, terms and support publication review

Prepared October 19, 2026. This is a concrete publication candidate, not the
older local owner-question drafts. Website baseline: d74ad1b6.

## Scope and authorization

The readiness coordinator relayed Sebastian's explicit instruction to adapt and
publish Away We Go's privacy policy and terms for Santa Books, with Santa Books
as the approved business label. Publication remains sequenced after independent
review of this immutable candidate. No entity/address/jurisdiction, minimum age,
response-time commitment, provider contract, credential or App Store submission
is invented or changed. No new owner decision is requested by this patch.

## Sources and deliberate adaptations

Read the actual live pages on October 19:
- https://awaywegoapp.com/privacy
- https://awaywegoapp.com/terms

Both are short. Reused their plain structure: product purpose, account/content,
service operation, conditional paid features, misuse/suspension and email contact.
Replaced travel branding/content with Santa Books, Christmas years/books and
sebastian@thesantabooks.com. No copy implies that checkout is currently available
in every app version. The inactive App Store badge remains inactive.

The privacy page adds the verified Santa photo-pool sync and notification/provider
boundaries, in-app deletion entry point and already-approved accepted-order/refund
policy. It does not carry over AWG's categorical no-sale sentence or a promise
that every provider uses data exclusively for one purpose; source/configuration
review cannot newly attest those business/provider practices. Those omissions
match the coordinator's instruction, rather than inventing replacement claims.

Retention qualifications follow the coordinator's read-only
`retention-request-handling-evidence.md` and backend owner's
`backend-retention-inventory.txt`, both dated October 19. Their source baseline
20867ca9 has the backend trees matching deployed d6988ae9. Specifically:

- Personal library/Auth and OneSignal external-user deletion, with interrupted
  cleanup retried; current-device cleanup is separate from other-device exports.
- Accepted fulfillment retains order/contact/payment snapshots, recipient-bearing
  email records and print files containing printed photos/text, not merely a
  postal address. Purge is 30 days after the latest required account-deletion,
  payment, delivery or final recovery resolution. Stuck/unresolved work can delay
  eligibility; the rule is not a maximum from tapping Delete.
- Minimal deletion/payment/tax replay references and immutable operational audit
  records survive, with no found coded TTL. Operational logs can retain IDs.
  No universal erasure, anonymization, fixed provider retention or automatic
  financial-record destruction is promised.
- Stripe Customer cleanup does not erase all transaction history. Provider
  records/backups/logs, support correspondence and downloaded copies are separate.
- Already-issued print-file URLs retain the existing up-to-30-minute expiry;
  deleted accounts cannot create new links.

No raw report, customer record, provider configuration or key is included here.
This is not an assertion that the policy satisfies every jurisdiction or that
App Privacy labels/provider retention have been independently accepted.

## Implementation and checks

- Static pages in `public/{privacy,terms,support}/index.html`; existing Vercel
  static-directory output unchanged. Extensionless routes resolve locally via
  canonical trailing-slash redirects. Validate Vercel behavior after deployment.
- Footer links on every page; linked logo/Home navigation on information pages.
  Original homepage hero/logo/art/badge markup unchanged; no added marketing
  claim or third-party script, no accounts/forms or dependency/build step.
- Local HTTP checks: `/`, `/privacy`, `/terms`, `/support` finish at HTTP 200.
  Static HTML, one H1, local route/assets and approved mailto checks pass.
- Chromium local review: 1440px homepage, 390px privacy, 320px terms/support;
  assets load, no horizontal overflow, console has no errors/warnings.
- Screenshots (ignored local artifacts): `output/playwright/legal-home-desktop.png`,
  `legal-privacy-mobile.png`, `legal-terms-mobile.png`.
- `git diff --check` passes. No iOS build is applicable to these static pages.

## Remaining deployment sequence

1. Independent reviewer inspects this commit and reports blocking issues without
   being asked to approve a desired result. Fix confirmed findings first.
2. Push the reviewed branch, create ready-for-review PR, read back hosted diff/body.
   Git-linked Vercel may create a preview on push; no push is done before review.
3. Merge the reviewed revision under the publication authorization. Existing
   Vercel project `santa-books-site` in the existing team auto-deploys `main` to
   https://thesantabooks.com. No DNS/project/auth/secret changes are needed.
4. Match deployment to the merge SHA, require READY, then verify public HTTPS,
   all information pages/footer/email links and mobile appearance. Preserve the
   actual deployment URL/ID and screenshots. Only then report published.
5. App/ASC URL changes and store submission remain separate owners/actions.
