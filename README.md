# Biorica Visuals

Build a modern, mobile- and tablet-responsive Pharmaceutical MR Detailing & AI Visual Aid web application for **Biorica Sciences Pvt Ltd** (`visuals.biorica.in`).

### 1. Visual Design & Branding

- **Aesthetic:** Clean, clinical, high-trust SaaS dashboard (similar to intralifevisuals.com). Plenty of whitespace, crisp typography (Inter / Plus Jakarta Sans), subtle slate borders (`#E2E8F0`), and soft shadows.

- **Color Palette:** Deep Medical Navy (`#0F2942`) primary, Clinical Teal (`#0D9488`) accent, pure white (`#FFFFFF`) cards on a very light cool-gray (`#F8FAFC`) background.

- **Top Navigation Bar (Sticky):**

  - Left: **Biorica Visuals** logo/brand mark (with a subtle link back to `biorica.in`).

  - Center/Right Nav Links: **AI Studio**, **Divisions**, **360° Search**, and an **Admin** button (for adding/editing products).

  - Mobile-friendly bottom navigation bar on small screens so Medical Representatives (MRs) can use it easily on phones and iPads.

---

### 2. Core Pages & Features

#### A. Homepage (`/`) — AI Visual Aid Studio

- Clean hero header: *"Biorica AI Visual Aid Studio — Upload a product pack to generate doctor detailing creatives."*

- **Multi-Image Upload Zone:** Drag-and-drop uploader accepting up to 5 pack images (PNG/JPG, transparent pack shots supported) with instant thumbnail previews and automatic client-side image compression.

- **Smart Form Controls:**

  - **Select Division** dropdown (populated from the database).

  - **Product Name / Brand Hint** text input.

  - **Target Doctor Specialty** selector (e.g., Gynecologist, Neurologist, Orthopedic, General Physician, Urologist).

  - **Creative Type** toggle: *Detailing Visual Aid Slide (16:9)*, *Promotional Poster (4:5)*, or *WhatsApp Doctor Card (1:1)*.

  - **Number of Variations** selector (1 to 3).

- **Action Button:** *"Auto-Generate Indications & Visual Aids"*.

  - Uses an edge function / AI integration to analyze the uploaded pack image, extract the brand name and composition, suggest key clinical indications & USPs, and generate/compose structured detailing visual aids with a clean Biorica Sciences footer.

- **Output Gallery:** Displays generated creatives with **Download PNG**, **Save to Product Library**, and **Open in Flipbook** buttons.

#### B. Divisions Directory (`/divisions`)

- Clean, scannable responsive card grid (1 column mobile, 2 tablet, 3–4 desktop).

- Include 2 highlighted utility cards at the top: **Top Products** and **Upcoming Launches**, followed by the therapeutic division cards.

- Each division card must be minimalist and show only:

  1. **Division Name** (bold)

  2. **2–4 word therapeutic focus tag** (e.g., *Neurology & Neuropathy*)

  3. **Product count badge**

  4. **Open Division** button

#### C. Individual Division Page (`/divisions/:slug`)

- Header with division title, therapy description, and a quick filter bar by dosage form (Tablets, Capsules, Nano Shots, Softgels).

- Product cards displaying:

  - **Product Pack Image** (with fallback placeholder)

  - **Brand Name** (e.g., `MIBICAL-D3`)

  - **Full Chemical Composition** (clearly readable)

  - **Key Clinical Indications / USPs** (2–3 bullet points)

  - **3 Instant Action Buttons:** `Flipbook`, `Generate Visual Aid` (pre-fills the AI Studio with this product), and `Download Pack/Card`.

#### D. Digital Flipbook Viewer (Modal or `/flipbook/:divisionSlug`)

- Full-screen, distraction-free doctor detailing mode designed for tablets and smartphones.

- Supports swipe gestures (left/right), keyboard arrow navigation, pinch-to-zoom, and a thumbnail strip at the bottom to jump directly to any brand in that division.

- Includes a quick toggle to hide all UI controls for clean presentation in front of a doctor.

#### E. 360° Smart Search (`/search`)

- Instant, real-time unified search bar with debounced filtering across:

  - **Brand Names**

  - **Chemical Compositions / Molecules** (e.g., searching "Cholecalciferol" or "Pregabalin" finds matching brands instantly)

  - **Therapeutic Divisions**

  - **Clinical Indications**

  - **Saved Visual Aids**

- Group search results cleanly by category with direct links to open the product in the Flipbook or AI Studio.

#### F. Protected Admin Panel (`/admin`)

- Simple email/password authentication via Supabase Auth.

- Allows adding/editing Divisions, adding/editing Products, bulk-importing products via CSV upload, and uploading official PDF/PNG Visual Aid slides for the Flipbook.

---

### 3. Database Schema (Supabase) & Seed Data

Set up Supabase tables with Row Level Security (public read for catalog/flipbooks, authenticated write for Admin):

1. `divisions`: `id`, `name`, `slug`, `therapy_tag`, `description`, `display_order`

2. `products`: `id`, `division_id`, `brand_name`, `composition`, `dosage_form`, `indications` (text array), `pack_image_url`, `is_top_product` (boolean), `is_upcoming` (boolean)

3. `visual_aids`: `id`, `product_id`, `title`, `creative_type`, `image_url`, `prompt_used`, `created_at`

Pre-populate the database with these initial **Biorica Sciences** divisions and products so the app is immediately testable:

- **Neurology & Neuropathy:** `LIGANERVE 75MG SR`, `GINKGORICA`, `REGANTIN-NT`, `NuroMib`, `MIBICA-PEA`

- **Gynecology & Women's Health:** `OVYNOVA`

- **Bone, Joint & Calcium:** `MIBICAL-D3` (Cholecalciferol 60,000 IU Nano Shots), `CAL2ALL-XT`

- **Gastroenterology & General:** `MIBICA-DSR`, `MIBICA-Bio`, `TOLRICA`

- **Urology & Wellness:** `DECISTON`, `MIBICA-Q10`

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d2f4d64b-fcb8-56b7-89c5-42f4e275c5c0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
