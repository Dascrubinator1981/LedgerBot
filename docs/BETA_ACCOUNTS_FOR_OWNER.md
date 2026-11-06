# The first account we need — no coding required

> Owner update, November 6: the owner reports the Free LedgerBot organization and LedgerBot Beta project are created in Oregon, with Data API disabled and public signup saved as disabled. This is reported dashboard setup, not an independently verified hosted LedgerBot deployment. The remaining hosting, database-role/migration, mail and recovery steps still apply.

You do **not** need to install Node.js on your iPhone or Steam Deck. Once a private beta is approved and hosted, those devices will open a normal HTTPS website.

Two services will eventually be involved:

- **Supabase:** holds the private database and handles verified sign-in/recovery.
- **Website hosting:** runs LedgerBot and gives it a secure web address. The application now has a tested portable container, so hosting is not tied to one vendor yet.

No hosted deployment credentials or hosting account are configured in the connected environment. No live beta URL exists. The goal is a closed manual-finance test beta in November, subject to configuration, safety gates and owner approval; this is not a promised launch date.

## The first small owner step, when ready

1. On your laptop, open your browser.
2. Go to the official `https://supabase.com` website.
3. Find its normal **Sign up / Start your project** entry point; labels may change.
4. Create **your own account** using its normal email/password or GitHub sign-in option. Read the permissions/terms displayed by the provider. Keep credentials and recovery codes private.
5. Confirm your email if asked.
6. **Stop once you can see the dashboard.** Do not enter a payment method, accept a paid upgrade or create resources with charges before we review the plan and cost together. Current prices have not been verified in this environment.
7. Tell me only: **“My Supabase account is ready.”** No password, key, database URL or verification link belongs in chat.

This creates an owner account; it does not launch LedgerBot, import records or authorize paid services. We will then review the project region, plan, hosting choice and exact secure configuration steps before creating a reviewed private staging environment. Do not guess at database/security settings just to move past a screen.

## What happens after that

The operator checklist is in `deploy/README.md`. We still need a separate beta project, application database role, secure runtime settings, mail delivery, closed signup/provider policy, encrypted backup/key recovery and an approved HTTPS host. Supplied values must go into secure provider/environment settings—not messages or source files.

Before any deployment, you should receive the exact candidate commit, test results, remaining risks, provider/region/cost proposal and an explicit approval request. Even private staging is not deployed merely because an account exists. There is no paid billing, bank connection, live AI or customer-data deletion authorized by this guide.

Once the private HTTPS test address exists and its hosted checks pass, `docs/DEVICE_TESTING_GUIDE.md` gives the detailed laptop/iPhone/Steam Deck walkthrough. Testing should start with fictional financial records. Actual device behavior and independent/legal review cannot be completed by browser emulation alone.
