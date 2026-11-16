WHEELWISE SHOWCASE BUILD — 16 NOV 2026

WHAT'S INCLUDED
- Existing WheelWise homepage, news page, article page and existing Supabase API integration retained.
- Supabase Auth email/password admin login at admin/login.html.
- Protected admin dashboard at admin/dashboard.html.
- Admin sections for articles, brands, YouTube videos, homepage slides, newsletter subscribers and contact messages.
- Brand directory, brand detail page with Articles/Videos tabs, reviews page and comparison page.
- Full article HTML is included in the All News search matching.
- Newsletter form stores subscriber email in Supabase (after migration is run).

IMPORTANT FIRST STEP — DATABASE
1. Backup your Supabase project before schema changes.
2. Open Supabase > SQL Editor.
3. Open supabase/upgrade_existing_database.sql in Notepad and run it.
4. This is additive: it creates new tables and adds nullable brand columns. It does not drop existing tables or rows.
5. It assumes your existing public.is_wheelwise_admin() function and public.wheelwise_admins allow-list are already working, as they were in the earlier project setup.

ADMIN LOGIN
- Open https://wheelwise.pages.dev/admin/login.html
- Sign in with the existing Supabase Auth email/password.
- The user's Auth UUID must already be in public.wheelwise_admins.
- No public signup is provided. Do not put a service_role key or DB password in website files.

UPLOAD TO GITHUB
- Make a backup copy of your current local WheelWise folder first.
- Replace the matching files with this package's files; add the new pages and folders.
- Upload/commit the project files to the existing WheelWise GitHub repository (main branch). Cloudflare Pages should deploy automatically.

IMPORTANT LIMITATIONS TO VERIFY BEFORE THE COLLEGE SHOWCASE
- This package was syntax-checked locally but not live-tested against your Supabase account or Cloudflare deployment.
- The newsletter currently saves subscriber records. Automatic email campaigns/notifications are NOT enabled; they require a server-side email provider and secure server secret (for example, a Supabase Edge Function or Cloudflare Worker). Never put an email API secret in browser JavaScript.
- YouTube videos are embedded from URLs manually added in the admin dashboard. YouTube uploads are not made by WheelWise.
- Brand pages match articles/videos by brand_id or brand text. Assign the brand on records to have them appear under a brand.
- The existing homepage's original visual slider is retained. The admin slide table is ready, but dynamic slider rendering is a later integration step; added slide records do not automatically replace the current static slides yet.
- Compare page shows articles whose category contains "Comparison" and videos whose category is "comparison".
- Newsletter duplicate email insertion may return a Supabase duplicate-key error; this can be handled as already subscribed.

SHOWCASE CHECKLIST
1. Run the SQL migration and confirm Success.
2. Deploy all files to the existing GitHub repo.
3. Open admin/login.html and sign in.
4. Test creating a draft article, then publish it.
5. Add one brand, one YouTube video and one homepage slide.
6. Open the public pages and confirm data appears.
7. If any database error appears, do not disable RLS; copy the exact error and fix the policy/schema.
