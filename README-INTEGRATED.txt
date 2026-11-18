# WheelWise Integrated Upgrade

This package combines the newer showcase pages with the original working Admin Login and full Article Editor.

## Important preserved files
- `admin/login.html`, `admin/login.js`: Supabase email/password authentication.
- `admin/dashboard.html`, `admin/dashboard.js`: admin sections for articles, brands, YouTube videos, homepage slider, newsletter subscribers and contact messages.
- `admin/editor.html`, `admin/editor.js`, `admin/editor-base.css`, `admin/editor.css`: original full article editor restored from the older project.
- `api-config.js`, `api.js`: existing Supabase project configuration and API.

## Homepage and brand directory
- The original homepage Explore Popular Brands section is retained and made database-driven.
- The duplicate Explore Popular Brands section has been removed.
- `View All Brands` and the Cars navigation open `brands.html`.
- Brand pages show separate Articles and Videos tabs.
- Add brands in Admin > Brands. Existing homepage cards populate from active brand records.
- Optional starter brands can be added by running `supabase/optional_seed_brands.sql` once in Supabase SQL Editor. This file is optional and safe to run more than once.

## YouTube videos
In Admin > YouTube Videos > Add video:
1. Enter title.
2. Paste a YouTube watch URL, youtu.be URL or embed URL.
3. Enter description and category (`reviews`, `comparison` or `general`).
4. Enter the brand name if relevant.
5. Save. The video is stored in Supabase and appears in the appropriate public pages.

Videos are manually added; no YouTube API key is required.

## Search and public pages
- Global search searches published article title, category, description, brand and full article HTML content, plus video title, description, brand and category.
- Reviews page searches published review videos.
- Compare page has Articles and Videos tabs.
- About, Contact, Privacy Policy and Terms pages are present and footer links point to them.
- Contact form writes messages to `contact_messages`.
- Newsletter form stores subscriber email addresses in `newsletter_subscribers`.

## Honest newsletter limitation
Subscriber collection and CSV export are implemented. Automatic email delivery to subscribers is **not** enabled by this static package. Sending campaigns requires a server-side email provider (for example, an email service with a secured API key) and a Supabase Edge Function or equivalent backend. Do not put private email-provider keys in browser JavaScript.

## Database
This project expects the existing WheelWise Supabase project and the additive database upgrade that was already run. Do not run `setup.sql` or recreate the database. The optional brand seed file is separate and optional.

The browser uses only the Supabase publishable key. Never add a service-role key, database password or admin password to website files or GitHub.

## Deployment
1. Keep the contents of this `WheelWise` folder at the root of the GitHub repository.
2. Commit to the `main` branch.
3. Wait for Cloudflare Pages deployment to succeed.
4. Test `/admin/login.html`, login, Dashboard, Full Article Editor, public homepage, brands, search, reviews, compare, About, Privacy, Contact and Terms.

## Notes
- Homepage slider management reads active records from `homepage_slides`; if no active records exist, the original built-in slides remain as fallback.
- The dashboard uses Supabase Auth and the existing `wheelwise_admins` allow-list. Do not remove the admin allow-list or disable RLS.
- This package has been statically inspected for paths and script syntax. A live end-to-end test still requires deployment to your Supabase/Cloudflare accounts.


LATEST CORRECTIONS
- Homepage keeps the original Explore Popular Brands section and card-grid design; no duplicate section is added.
- To activate the original starter brands (Maruti Suzuki, Hyundai, Tata, Mahindra, Honda, Toyota, BMW, Mercedes-Benz, Audi, Kia), run supabase/optional_seed_brands.sql once in the existing Supabase SQL Editor. It is re-runnable and reactivates those named rows.
- Shared dark-mode toggle is included on all public pages and admin login/dashboard/editor pages. Preference is shared across pages using the same browser local storage.
