<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Authenticated pages live under the client-only `_authenticated` gate; catalog writes use the authenticated browser client and database admin policies, so UI guards cannot bypass authorization.
- Convert uploaded PDF visual aids to individual PNG pages with dynamically imported browser PDF.js, so every official page supports the same flipbook swipe and zoom gestures.
- Validate the complete CSV before one bulk insert, so an invalid row cannot leave a partial catalog import.
- Compose greeting text, portraits, and branding locally over AI-generated backgrounds using CSS palette tokens, so downloaded PNGs preserve exact doctor details and company identity.
- Keep greeting history and its storage bucket owner-private; use expiring signed image URLs rather than the public catalog media proxy to protect doctor details.
- Themes write hex values onto the shared semantic CSS tokens at runtime (ThemeSync), so presets, logo-matched palettes and canvases all follow one source of truth.
- Logo finishes (original/white/gold) are applied client-side to the transparent master logo via src/lib/logo.ts; never draw a plate or box behind the logo.
- Product pack uploads preserve original image bytes in product-packs and use the public media proxy while workspace public buckets are blocked; both /manage and /admin reuse AdminPanel to keep editing behavior identical.
- MR downloads live in the private mr-downloads bucket; the media proxy 302-redirects them to signed storage URLs (?download= sets attachment) so large files stream directly, not through the worker; counts increment through a security-definer RPC so visitors never get UPDATE rights.

- Team user accounts are created/updated only through admin-checked server functions using the service client; individual passwords are never stored readable (shown once on create/reset).
- Every portal page lives under the client-only `_authenticated` gate (only /auth, /reset-password and api routes are public) and self sign-up is disabled, because the portal is team-only with admin-created logins.
- Login User IDs map to the real email when given, else a private <id>@team.biorica.local address; sign-in resolves User ID/email server-side and returns only session tokens, so handles never expose emails.
- Verification editors and live previews share the Studio draft; final generation snapshots that edited draft and omits only empty list rows, so no raw AI response can overwrite user changes.
- Product taxonomy lives in products.division_ids/specialties/focus_tags (jsonb arrays) with division_id kept as the first entry; always filter via inDivision/matchesTaxonomy so legacy single-division screens stay consistent.
- Card design templates are canvas-painted presets in src/lib/card-design.ts plus admin rows in card_templates (images in the card-templates bucket via the media proxy); text is always typeset locally over the template, never by AI.
- Clinical evidence (patient case, mechanism, prescribed-for, trial data) is only sent to the AI for case_poster; product visual aid prompts explicitly exclude it.
