# Deploying SelfDiscovery to Vercel

Repository: `owusuadjei122-tech/SD-Dashboard` (branch `main`)
Vercel project: `theolencer1s-projects/sd-dashboard`
Production URL: https://sd-dashboard-theolencer1s-projects.vercel.app
Supabase project: `wzwqtgcoezkblkhsggbg`

The project is already deployed and its environment variables are set. Steps 2
and 3 below are kept as reference for rebuilding it from scratch; the only step
still outstanding is step 4, the Supabase URL configuration.

---

## 1. Confirm the database is migrated

The app will build without these, but authentication, approval, and the admin
console will fail at runtime. In **Supabase → SQL Editor**, run in order:

1. `supabase/migrations/00000000000003_rbac_and_approval.sql`
2. `supabase/migrations/00000000000004_fix_rls_recursion.sql`
3. `supabase/migrations/00000000000005_security_and_invitations.sql`

Migration 04 must come after 03 — it replaces the recursive RLS policies that
03 creates. All three are idempotent and safe to re-run.

To verify, check that `email_outbox`, `security_events`, and `invitations`
tables exist and that `select public.is_platform_admin(auth.uid())` resolves
without error.

---

## 2. Import the project into Vercel

1. Go to https://vercel.com/new
2. Import **owusuadjei122-tech/SD-Dashboard**
3. Framework preset is detected as **Next.js**; leave build, output, and
   install commands at their defaults. `vercel.json` already sets the security
   headers and function timeouts.

Do not deploy yet — add the environment variables first, otherwise the first
build produces a site that cannot reach Supabase.

---

## 3. Environment variables

Add these under **Settings → Environment Variables**, scoped to Production,
Preview, and Development.

| Variable | Value | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wzwqtgcoezkblkhsggbg.supabase.co` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key | Public by design, protected by RLS |
| `NEXT_PUBLIC_SITE_URL` | Your Vercel production URL | See warning below |
| `RESEND_API_KEY` | Your Resend key | Omit to disable delivery |
| `EMAIL_FROM` | `SelfDiscovery <no-reply@yourdomain.com>` | Must match a verified domain |

**`NEXT_PUBLIC_SITE_URL` is the one that breaks things silently.** Invitation
links, password-reset links, and the OAuth callback are all constructed from
it. If it still points at `http://localhost:3000`, invited users receive links
back to their own machine and sign-in redirects fail. Set it to the real
production URL as soon as Vercel assigns one, then redeploy so the value is
baked into the client bundle.

Without `RESEND_API_KEY` and `EMAIL_FROM` the platform still works: every
message is recorded in `email_outbox` with status `queued`, and the admin UI
shows a copyable invitation link instead of relying on delivery.

---

## 4. Point Supabase at the deployment

In **Supabase → Authentication → URL Configuration**:

- **Site URL**: `https://sd-dashboard-theolencer1s-projects.vercel.app`
- **Redirect URLs**, add both:
  - `https://sd-dashboard-theolencer1s-projects.vercel.app/**`
  - `https://sd-dashboard-theolencer1s-projects.vercel.app/auth/callback`

Keep `http://localhost:3000/**` in the list so local development continues to
work.

If Google sign-in is enabled, add the same callback to the Google Cloud OAuth
client under **Authorized redirect URIs**, alongside the Supabase-hosted one
(`https://wzwqtgcoezkblkhsggbg.supabase.co/auth/v1/callback`).

---

## 5. Email domain

Resend's sandbox sender (`onboarding@resend.dev`) only delivers to the address
that owns the Resend account. Every approval, rejection, and invitation email
to anyone else is rejected with a 403 and lands in the outbox marked `failed`.

To email real members, verify a domain at https://resend.com/domains, add the
DNS records it gives you, then set `EMAIL_FROM` to an address on that domain.

---

## 6. Smoke test the deployment

1. Sign in as an existing admin and confirm the sidebar shows **Access control**
2. Open `/admin/email` and send a test message; confirm it appears as `sent`
3. Sign up with a fresh address and confirm it lands on **Waiting for approval**
   rather than the dashboard
4. Approve that account from `/admin/members` and confirm the sidebar reflects
   only the modules it was granted
5. Send an invitation and confirm the accept link resolves on the production
   domain, not localhost
6. Fail a login five times and confirm the lockout message appears

---

## Troubleshooting

**Build succeeds but every page redirects to login.** The Supabase environment
variables are missing or scoped to the wrong environment. `NEXT_PUBLIC_*`
values are read at build time, so redeploy after changing them.

**OAuth returns to localhost.** `NEXT_PUBLIC_SITE_URL` was not updated, or the
deployment was not rebuilt after updating it.

**"Infinite recursion detected in policy for relation user_profiles."**
Migration 04 has not been applied to this database.

**Invitations never arrive.** Expected on the sandbox sender. Check
`/admin/email` for the failure reason and use the copyable link in the invite
modal until a domain is verified.
