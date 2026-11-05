# Pick my perfect

A responsive storefront for the Pick my perfect acrylic print collection. Customers can search and filter the catalogue, add prints to a shopping bag, and send an order enquiry through WhatsApp. The storefront uses GBP and starts with sample listings based on the supplied images. Online payment is not enabled.

## Run locally

1. Install Node.js (version 20.19+ or 22.12+).
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Run `npm run dev` and open the local URL printed by Vite.

The shop works as a demo without environment variables. The sample listings use £70 and size `24 × 16` as requested; the size unit has not been specified. Confirm product names, descriptions, prices, image rights, and the size unit before launch.

## WhatsApp

Set `VITE_WHATSAPP_NUMBER` to the WhatsApp Business phone number in international format, digits only (for example `447700900123`). Do not include a plus sign, spaces, or punctuation. The number is public storefront configuration, not a secret. Set the same variable in Vercel and redeploy. Until a number is set, the checkout button explains that WhatsApp is not configured.

WhatsApp checkout opens a prefilled message containing the selected products, quantities, and subtotal. Customers confirm availability and shipping with the shop owner in WhatsApp. This site does not collect payment or calculate shipping.

## Secure product admin with Supabase

1. Create a Supabase project.
2. Open the SQL Editor and run [`supabase/setup.sql`](./supabase/setup.sql).
3. In Supabase Authentication settings, disable public sign-ups. Create or invite only the shop administrator from the dashboard. The admin screen supports email/password sign-in; there is no public registration flow.
4. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the project URL and publishable/anon key from Supabase. Never put a Supabase service-role/secret key in a `VITE_` variable or browser code.
5. Restart the dev server and open `/#admin` to sign in, add products, edit them, upload images, or hide/delete listings.
6. To deploy, push the project to a GitHub repository and import it in Vercel. Add the three `VITE_` variables in Vercel project settings. Add the local and deployed site URLs to Supabase's allowed redirect URLs if you later add an email-based authentication flow.

The SQL enables Row Level Security: visitors can read active products and public product images; signed-in users can manage products and images. Since this starter has no role-management backend, keep public account creation disabled and issue accounts only to trusted administrators.

Without Supabase configuration, the storefront uses the editable-in-code sample catalogue and the admin page shows connection instructions. Running the setup SQL seeds the Supabase table with the same 19 sample listings and their supplied image URLs, so the first configured deployment is populated and ready for edits.

## Project structure

- `index.html` — storefront, shopping bag, and admin shell
- `src/` — catalogue, WhatsApp checkout, Supabase integration, and styling
- `public/assets/` — supplied brand and product images used by the site
- `supabase/setup.sql` — product table, access policies, and image storage setup
