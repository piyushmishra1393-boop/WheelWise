# WheelWise — Supabase Edition

This package upgrades the supplied WheelWise website without replacing its overall public-page design.

## Included structure

- `index.html`, `style.css`, `script.js` — homepage
- `news.html`, `news.css`, `news.js` — all-news listing, search, category filter, sorting and pagination
- `article.html`, `article.css`, `article.js` — article detail page
- `api-config.js`, `api.js` — Supabase configuration and shared API/auth/image-storage functions
- `admin/login.html` — email/password login
- `admin/dashboard.html` — article counts, search, edit, delete, draft/publish
- `admin/editor.html` — writing editor, formatting toolbar, featured image upload and inline article images
- `admin/*.css`, `admin/*.js` — admin interface
- `supabase/setup.sql` — database, RLS, admin allow-list and Storage policies

The old sample `articles.js` is intentionally not loaded or copied into the live package. Your Supabase `articles` table was previously confirmed empty; dummy examples should not silently appear as real published content. The old Apps Script URL/config has been removed.

## 1. Supabase project configuration

The package is preconfigured with the Supabase project URL and the publishable key you supplied in the chat. The publishable key is intended for browser use. Never put a `service_role` key, database password, or other secret in any website file.

If you move to a different Supabase project, edit `api-config.js` and replace:
- `window.SUPABASE_URL`
- `window.SUPABASE_PUBLISHABLE_KEY`

## 2. Run the database/security setup

1. Open your Supabase project.
2. Open **SQL Editor** → **New query**.
3. Open `supabase/setup.sql` in Notepad, copy all of it, paste it into SQL Editor, and run it.
4. Confirm the `articles` and `wheelwise_admins` tables exist.
5. Confirm the Storage bucket named `wheelwise-images` exists and is public for image display.
6. The SQL installs Row Level Security (RLS) rules:
   - visitors can read only rows whose status is `published`;
   - the allow-listed admin can read drafts and published rows;
   - only the allow-listed admin can insert, edit or delete articles;
   - only the allow-listed admin can upload, update or delete images;
   - images can be displayed publicly.

If SQL Editor reports an error, stop and share the exact error text. Do not switch RLS off to “fix” it.

## 3. Create the admin password account

The website does not provide public sign-up. This is deliberate.

1. In Supabase, open **Authentication** → **Users**.
2. Choose **Add user** / **Create new user**.
3. Enter the admin email and set a strong, unique password. Keep the password private; do not put it in any `.js` file.
4. Copy the new user's **UUID** from the Auth users list.
5. Open SQL Editor and run this one-time command, replacing the placeholder with that exact UUID:

```sql
INSERT INTO public.wheelwise_admins (user_id)
VALUES ('PASTE-THE-AUTH-USER-UUID-HERE');
```

6. Only users whose UUID is in `wheelwise_admins` are admins. Creating an Auth user alone does not grant admin rights.
7. Open `admin/login.html` on the hosted website and sign in with that email/password.

To remove admin access later, delete that user's row from `public.wheelwise_admins` (or delete the Auth user).

## 4. Add content

1. Sign in at `admin/login.html`.
2. Select **New article**.
3. Enter title, category, date, reading time and short description.
4. Upload a featured image. You can also paste a valid `https://` image URL.
5. Write the article in the editor. Use its toolbar for bold, italic, headings, lists, links and inline images.
6. Choose **Save draft** to keep it private, or **Publish article** to make it public.
7. Published content appears automatically on the homepage, All News page and article page. Newest dates appear first.

Image upload restrictions: JPG, PNG, WEBP or GIF; maximum 5 MB per image. The image bucket is public because article images need public URLs. Do not upload private/personal images.

## 5. Local testing and hosting

For local tests, keep all root website files together and the `admin` and `supabase` folders beside them. Open `index.html` in a browser for basic layout checks. Supabase Auth, Storage and API calls are most reliably tested on an HTTPS-hosted site (or a local HTTP development server). Do not assume that a successful local page load proves hosting is configured.

The root `index.html` script order must remain:
1. `api-config.js`
2. `api.js`
3. `script.js`

The same config/API order is used on `news.html` and `article.html`. Admin pages load `../api-config.js` and `../api.js` before their page script.

## 6. Security notes and honest limitations

- Browser code contains only the Supabase publishable key. This key is not an admin password.
- The actual permission boundary is enforced by Supabase Auth + RLS + the `wheelwise_admins` allow-list, not by hiding buttons in JavaScript.
- Do not create a public signup form or add the service-role key to this project.
- Do not disable RLS or add unrestricted `USING (true)` write policies.
- Password reset emails, newsletter subscriptions, analytics, SEO/Search Console submission, custom domain, deployment and AdSense approval are separate services/tasks and are not automatically configured by this source package.
- The code package cannot run SQL inside your Supabase account, create your Auth user, or deploy the website on your behalf. Those account-side steps in sections 2 and 3 are required before the admin/editor can work end-to-end.
- The editor provides basic rich-text writing and image insertion. It is not a full Microsoft Word clone and does not export PDF/docx.
- Existing public page design has been retained where practical. The sample article data is not migrated because it was placeholder content and the database was confirmed empty.

## Troubleshooting

- **Login says not authorized:** check that the Auth user's exact UUID was inserted into `public.wheelwise_admins`.
- **Login says invalid credentials:** confirm the email/password in Supabase Authentication > Users; do not share the password in chat.
- **Articles do not load:** check `api-config.js`, the browser Console and Supabase API errors. Confirm the row status is exactly `published`.
- **Drafts do not appear in admin:** check the admin allow-list row and rerun the SQL setup if a policy was not created.
- **Image upload fails:** check that `wheelwise-images` exists, its policies from `setup.sql` ran, the account is an authorized admin, and the image is under 5 MB.
- **Article image missing:** confirm the image URL starts with `https://` and the uploaded object is in the `wheelwise-images` bucket.
