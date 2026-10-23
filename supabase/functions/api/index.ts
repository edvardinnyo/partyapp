// Deno entry point of the API Edge Function. Keep it to wiring only: the logic lives in app.ts.
import { withSupabase } from '@supabase/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { createAdminRepository } from './admin-repository.ts';
import { createApp, createPublicApp } from './app.ts';
import { createEventRepository } from './event-repository.ts';
import { createPartnerNotifier } from './partner-notifier.ts';
import { createPartnerRepository } from './partner-repository.ts';
import { createProfileRepository } from './profile-repository.ts';
import { createSettingsRepository } from './settings-repository.ts';
import { createTasteRepository } from './taste-repository.ts';
import { createAccounts, createAvatarStorage } from './supabase-services.ts';

// The connection may go through the transaction pooler, which does not support prepared statements.
const client = postgres(Deno.env.get('SUPABASE_DB_URL')!, { prepare: false, max: 3 });

const db = drizzle({ client });
const profiles = createProfileRepository(db);

const app = createApp({
  profiles,
  partners: createPartnerRepository(db),
  // Secrets: `npx supabase secrets set RESEND_API_KEY=… PARTNER_REVIEW_EMAIL=…`
  partnerNotifier: createPartnerNotifier({
    apiKey: Deno.env.get('RESEND_API_KEY'),
    to: Deno.env.get('PARTNER_REVIEW_EMAIL'),
  }),
  admins: createAdminRepository(db),
  tastes: createTasteRepository(db),
  settings: createSettingsRepository(db),
  events: createEventRepository(db),
  newId: () => crypto.randomUUID(),
  now: () => new Date(),
});

const publicApp = createPublicApp({ profiles });

// Everything needs a signed-in user, except the few routes under /api/public.
const handleUser = withSupabase({ auth: 'user' }, (request, ctx) => {
  const userId = ctx.userClaims?.id;
  if (!userId) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  return app.fetch(request, {
    userId,
    email: ctx.userClaims?.email ?? null,
    avatars: createAvatarStorage(ctx.supabaseAdmin),
    accounts: createAccounts(ctx.supabaseAdmin),
  });
});

const handlePublic = withSupabase({ auth: 'publishable' }, (request) => publicApp.fetch(request));

export default {
  fetch: (request: Request) =>
    new URL(request.url).pathname.startsWith('/api/public/')
      ? handlePublic(request)
      : handleUser(request),
};
