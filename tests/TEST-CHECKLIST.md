# Manual validation checklist — A5 Experience Suite

Run after deploying on a staging/preview URL, then on the production site if the preview passes.

- [ ] Logged-out view shows only the existing login UI; the suite adds no visible overlay.
- [ ] Login works via existing provider buttons; session handling remains unchanged.
- [ ] Home memory deck displays up to 4 cards and can still swipe/advance/open the existing viewer.
- [ ] Gallery filters, profile, yearbook, chat, upload/edit/delete flows behave as before.
- [ ] Broken thumbnail stays within its card and does not collapse the layout.
- [ ] Videos in lists do not download media before opening the existing viewer.
- [ ] `Alt + Shift + E` opens the local diagnostics panel only when signed in; the shortcut does not trigger while typing.
- [ ] Export report JSON; confirm it contains no media URLs, account names, IDs, captions, or chat text.
- [ ] Test at 360px wide and at desktop width; test with reduced-motion enabled.
- [ ] Compare Performance Lab values on the same device/network before and after; do not infer speed improvement from appearance alone.
