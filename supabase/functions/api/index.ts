// Deno entry point of the API Edge Function. Keep it to wiring only: the logic lives in app.ts.
import { withSupabase } from '@supabase/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { createApp } from './app.ts';
import { createProfileRepository } from './profile-repository.ts';
import { createAccounts, createAvatarStorage } from './supabase-services.ts';

// The connection may go through the transaction pooler, which does not support prepared statements.
const client = postgres(Deno.env.get('SUPABASE_DB_URL')!, { prepare: false, max: 3 });

const app = createApp({
  profiles: createProfileRepository(drizzle({ client })),
  newId: () => crypto.randomUUID(),
  now: () => new Date(),
});

export default {
  fetch: withSupabase({ auth: 'user' }, (request, ctx) => {
    const userId = ctx.userClaims?.id;
    if (!userId) {
      return Response.json({ error: 'unauthorized' }, { status: 401 });
    }
    return app.fetch(request, {
      userId,
      avatars: createAvatarStorage(ctx.supabaseAdmin),
      accounts: createAccounts(ctx.supabaseAdmin),
    });
  }),
};
