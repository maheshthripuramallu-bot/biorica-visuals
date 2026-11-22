# Completion roadmap
- [x] Add companion source previews and full-size review in Template Manager.
- [x] Apply the uploaded dashboard styling rules, group exactly 20 core layouts, and add six diverse clinical scenarios plus lifestyle photo upload. No reference image was attached; followed the written styling specification.
- [x] Verify CDR source preservation, uploaded/replaced preview persistence, full-size review, A4 manual export, and desktop/mobile layouts; 95 tests pass, no runtime errors. Companion previews must be supplied for CDR/non-renderable sources; no actual source artwork was provided by the user.
- [x] Expand manual Studio: 24 pharma templates, full content lists, photos, independent typography/position controls and local PNG/PDF exports.
- [x] Add admin Template Manager: search, edit, visibility, deletion, source preservation and preview/placement editing.
- [x] Verify manual exports and admin persistence with signed-in desktop/mobile checks and regression tests (94 passing). All five PNG sizes and A4 PDF page dimensions verified; no AI calls. Custom source bytes, saved coordinates, renamed templates, visibility and deletion verified; test data removed. PSD composites and PDF-compatible AI previews tested; CDR/non-previewable sources require a companion preview. Login and admin library sync still require Cloud; manual editing/export run locally.
- [x] Repair the stale Lovable Cloud binding and degraded connection behind “Project not specified”; verify signed-in Divisions, division detail, Search, Flipbook, Downloads and Studio with no runtime errors.
- [x] Add output-only multi-format selection to all four existing generation tabs, preserve page grids, and verify exact PNG dimensions and batch rules (84 tests pass).
- [x] Verify signed-in multi-format choices in all four tabs and greeting/visiting-card batch downloads with exact PNG sizes; check mobile overflow. Real AI generation is covered by the original-photo retry pending below, not rerun during Cloud recovery.
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

# Verify Data editor
- [x] Replace verification with structured editable fields, dynamic lists and a sticky live preview.
- [x] Verify edited data reaches final generation, check desktop/mobile layouts and run regression tests.
- [ ] Retry generation with the same product photo to verify the upload-size fix — waiting for the user to attach the original photo (not present in accessible uploads).

Verified signed-in real AI brief generation, edits to all text fields, list add/edit/delete, desktop and mobile previews, edited final request and completed PNG download. All 68 regression tests pass.

# Logic & design engine overhaul
- [x] Clinical data (patient cases, mechanism, trial results, p-values) routed only to Clinical Case Poster; Product Visual Aids exclude it.
- [x] Verify Data lists unrestricted (+ Add works repeatedly).
- [x] Products support multiple divisions, specialties and detailing focus (chip selectors in /manage and catalog filter).
- [x] Card design engine: 11 fonts, size/colour/alignment controls, 20 built-in templates (10 visiting, 10 greeting).
- [x] /manage Card Templates tab: upload JPG/PNG/SVG backgrounds with name, category and text position; shown in both studios.
