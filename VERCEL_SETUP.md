# Vercel Deployment Setup

## Environment Variables

Add these environment variables in your Vercel project settings:

### Required Variables

1. **SENDGRID_API_KEY**
   - Your SendGrid API key
   - Get it from: SendGrid Dashboard → Settings → API Keys
   - Must have "Mail Send" permissions

2. **SENDGRID_FROM_EMAIL**
   - The email address that will appear as the sender
   - Must be from a domain verified in SendGrid
   - Example: `noreply@yourdomain.com`

3. **CONTACT_EMAIL**
   - The email address where contact form submissions will be sent
   - Example: `contact@yourdomain.com`

### Optional Variables

4. **NEXT_PUBLIC_SITE_URL**
   - The main site origin. This is the only place the main domain is configured.
   - Used for canonical URLs, Open Graph metadata, and host routing.
   - Current value: `https://talonsoftware.dev`
   - If unset, the site defaults to `https://talonsoftware.dev`
   - When `talon.software` is purchased and should become the main domain, set this to `https://talon.software` and attach that domain. No page copy needs to change.

## Domains on project `talon-software-site`

Attach every domain to the same Vercel project. The app reads the `Host` header and chooses the area. Do not create a separate project per domain.

| Domain | Area | What it serves |
| --- | --- | --- |
| `talonsoftware.dev` | Main | The fractional CTO practice: home, plans, services, how we work, FAQ, contact, and the rest of the original site. Set `NEXT_PUBLIC_SITE_URL` to this origin. |
| `talon.consulting` | Consulting | Project consulting: AI, systems, assessments, and integrations. Its own contact page posts to the same `/api/contact` route. |
| `talon.engineering` | Engineering | A standalone coming-soon page. Every path on this host, including `www.talon.engineering` after its redirect to the apex, shows that page and nothing from the main site. |
| `talon.software` (later) | Main | Replace `talonsoftware.dev` by changing `NEXT_PUBLIC_SITE_URL` and attaching the domain. |

`talon.support` belongs to its own portal project. Do not attach that domain here. A request that still arrives for `talon.support` or `www.talon.support` is a 404, not the marketing site and not a redirect.

`www` on any of those hosts permanently redirects to the apex host.

Preview deployments (`*.vercel.app`) and local `next dev` have no custom host. Use a path instead:

- `/` and the original pages (`/plans`, `/contact`, `/faq`, and the rest) on the main site
- `/consulting`, `/consulting/services`, `/consulting/process`, `/consulting/contact`
- `/engineering` for the coming-soon page

On the real domains those prefixes redirect to the apex URL for that area (`https://talon.consulting/services`, not `https://talonsoftware.dev/consulting/services`), so the same page is not indexed twice. `/plans` and `/contact` on `talonsoftware.dev` stay on that domain. A request to `talon.engineering` stays on the coming-soon page instead of redirecting into the main site. Each host publishes its own `/sitemap.xml` and `/robots.txt`. Preview hosts disallow indexing.

## How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: Variable name (e.g., `SENDGRID_API_KEY`)
   - **Value**: Your actual value
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**
5. Redeploy your application for changes to take effect

## Security Checklist

✅ All sensitive data uses environment variables
✅ No API keys or secrets in code
✅ Error messages don't leak sensitive information
✅ Console logging is sanitized in production
✅ `.env` files are in `.gitignore`

## Testing After Deployment

1. Test the contact form on your live site
2. Check Vercel function logs for any errors
3. Verify emails are being sent successfully
4. Check SendGrid dashboard for email delivery status
