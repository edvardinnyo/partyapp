import { defineConfig } from 'drizzle-kit';

// `npm run db:generate` writes SQL migrations next to the Supabase CLI's migrations,
// which `npm run db:push` then applies to the linked project.
export default defineConfig({
  dialect: 'postgresql',
  schema: './supabase/functions/_shared/db/schema.ts',
  out: './supabase/migrations',
  schemaFilter: ['public'],
  entities: { roles: { provider: 'supabase' } },
  migrations: { prefix: 'supabase' },
});
