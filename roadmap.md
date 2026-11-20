# Completion roadmap
- [x] Complete sign-in, signup, recovery and session-aware navigation (email and access only).
- [x] Complete protected Admin: divisions, products, CSV and official slides.
- [x] Verify catalog, search, flipbook, AI generation and library saving with a confirmed temporary account.
- [x] Run tests, check preview errors and save changes.

Email confirmation delivery and Google/Lovable provider handoff are configured but not exercised with a real mailbox/provider account.

# Doctor greetings
- [x] Add studio tabs and greeting form with live preview and AI variations.
- [x] Add admin company logo and private greeting history.
- [x] Verify generation, download, save/reuse and mobile layout; commit changes.
- [x] Add grouped pan-India occasions, regional/bilingual messages and Noto fonts.
- [x] Add optional 0–3 featured products with text or pack footer placement.

Verified Telugu bilingual AI generation, Malayalam full-regional AI messages, PNG download, saved history after reload, template reuse, portrait/story preview, product-selection limit, admin branding controls and phone layout. Native WhatsApp sharing needs a supporting phone; desktop downloads the PNG and opens WhatsApp for manual attachment. Official logo and pack photos are not supplied, so fallbacks remain.
# Visual aid upgrades
- [x] Catalog multi-select (1–10) with portfolio mode, 10 formats, editable brief, art direction, compliance footer, print export.

# Product pack management
- [x] Add product-packs storage with public reads and admin-only writes (public bucket blocked by workspace policy).
- [x] Add /manage, drag-and-drop editor, URL fallback, color extraction and quick row uploads.
- [x] Verify signed-in uploads, transparency and persisted previews.

Verified editor upload, brand-color extraction, quick row replacement, reload and removal with a temporary product (deleted after testing). Stored PNG bytes matched the original exactly; mobile layout checked and 16 upload/catalog tests passed. Public bucket creation remains blocked by workspace policy; product pack images are publicly accessible through the app's media URLs.

# Downloads
- [x] mr-downloads storage + download_files library (public reads, admin writes, counted downloads).
- [x] Manage Downloads in /manage (any format, categories, division/brand tags, featured, replace, delete).
- [x] Downloads page in nav with search, category/format chips, sorting, download + preview.

# Team access
- [x] Team users in /manage (default password, roles, territory, active toggle, reset, bulk add, unlimited users, role counts, paged directory) + footer access/status.
