WHEELWISE ADMIN DASHBOARD

1. Keep the admin folder inside your main "wheel wise" folder.
2. Keep dashboard.html, dashboard.css and dashboard.js together inside admin.
3. The root folder must contain api-config.js and api.js.
4. Open the website through your hosting URL, then visit:
   https://YOUR-WEBSITE/admin/dashboard.html
5. First configure the real Apps Script /exec URL in the root api-config.js.
6. Deploy the latest Code.gs version before testing.

CURRENT SCOPE:
- Live published article count.
- Popular article count.
- Published category count.
- Recent published articles.
- Searchable list of published articles.
- Article preview links.

NOT YET ENABLED:
- Draft listing and draft count.
- Add, edit, delete, or publish actions.
These require a secure authenticated write API. The public read-only API must not be used for editing.
