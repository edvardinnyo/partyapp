/// <reference types="node" />
// D-007/1: loads the team's event sheet (CSV) into the database. The rows are converted into the
// shared import shape, then written by `public.import_events`, like any future source.
//
//   npm run events:import -- <file.csv> [--dry-run] [--prune] [--source=csv]
//
// It runs the SQL through the Supabase CLI of this project (`supabase db query --linked`), so it
// needs a logged-in CLI (`npx supabase login`) and no database password.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { EVENT_KINDS } from '../supabase/functions/_shared/contracts/events.ts';
import { GENRES } from '../supabase/functions/_shared/contracts/genres.ts';
import {
  CSV_LIST_SEPARATOR,
  type CsvColumn,
  type CsvProblem,
  eventsFromCsv,
} from '../supabase/functions/_shared/events/sources/csv.ts';

const USAGE = `Használat: npm run events:import -- <fájl.csv> [--dry-run] [--prune] [--source=csv]
  --dry-run     csak ellenőrzi a fájlt, nem tölt fel semmit
  --prune       törli a forrás azon még le nem zárult eseményeit, amelyek nincsenek a fájlban
  --source=név  a forrás neve (alapértelmezés: csv); csak kisbetű, szám, - és _`;

const HINTS: Partial<Record<CsvColumn, string>> = {
  kind: `lehetséges értékek: ${EVENT_KINDS.join(', ')} (vagy klub, bár, koncert, fesztivál)`,
  starts_at: 'formátum: 2026-10-24 22:00, budapesti idő szerint',
  ends_at: 'formátum: 2026-10-25 05:00, budapesti idő szerint',
  genres: `lehetséges értékek: ${GENRES.join(', ')}; több műfajt „${CSV_LIST_SEPARATOR}” választ el`,
  venue_lat: 'tizedes szám, pl. 47.4979',
  venue_lng: 'tizedes szám, pl. 19.0402',
  ticket_url: 'http:// vagy https:// kezdetű webcím',
};

function describeProblem(problem: CsvProblem): string {
  switch (problem.type) {
    case 'not_utf8':
      return 'A fájl nem UTF-8 kódolású. Excelben: Mentés másként → „CSV UTF-8 (pontosvesszővel tagolt)”.';
    case 'empty':
      return 'A fájl üres.';
    case 'missing_columns':
      return `Hiányzó oszlopok: ${problem.columns.join(', ')}.`;
    case 'missing_value':
      return `${problem.row}. sor: üres a(z) „${problem.column}” mező.`;
    case 'invalid_value': {
      const hint = HINTS[problem.column];
      return `${problem.row}. sor: hibás „${problem.column}” érték: „${problem.value}”${hint ? ` (${hint})` : ''}.`;
    }
    case 'nonexistent_time':
      return `${problem.row}. sor: a(z) „${problem.column}” időpont (${problem.value}) nem létezik, mert a nyári időszámítás kezdetekor kimarad.`;
    case 'ends_before_start':
      return `${problem.row}. sor: a zárás (ends_at) nem lehet korábban, mint a kezdés (starts_at).`;
    case 'duplicate_id':
      return `${problem.row}. sor: a(z) „${problem.id}” azonosító már szerepel a(z) ${problem.firstRow}. sorban.`;
    case 'venue_mismatch':
      return `${problem.row}. sor: a(z) „${problem.venueId}” helyszín neve, címe vagy koordinátái eltérnek a(z) ${problem.firstRow}. sorétól.`;
    case 'invalid_event':
      return `${problem.row}. sor: ${problem.details}`;
  }
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

type ImportResult = {
  received: number;
  changedVenues: number;
  changedEvents: number;
  removedEvents: number;
};

/** Runs one SQL file through the project's Supabase CLI; no shell, so paths may contain spaces. */
function queryLinkedDatabase(sql: string): unknown {
  const directory = mkdtempSync(join(tmpdir(), 'nocturnal-import-'));
  try {
    const sqlFile = join(directory, 'import.sql');
    writeFileSync(sqlFile, sql);
    const cli = join(process.cwd(), 'node_modules', 'supabase', 'dist', 'supabase.js');
    const run = spawnSync(
      process.execPath,
      [cli, 'db', 'query', '--linked', '--output-format', 'json', '-f', sqlFile],
      { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
    );
    if (run.status !== 0) {
      fail(`A Supabase CLI hibát jelzett:\n${run.stderr || run.stdout}`);
    }
    return JSON.parse(run.stdout.slice(run.stdout.indexOf('{')));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function main() {
  const args = process.argv.slice(2);
  const file = args.find((arg) => !arg.startsWith('--'));
  const dryRun = args.includes('--dry-run');
  const prune = args.includes('--prune');
  const source =
    args.find((arg) => arg.startsWith('--source='))?.slice('--source='.length) ?? 'csv';
  if (!file || !/^[a-z0-9_-]{1,50}$/.test(source)) {
    fail(USAGE);
  }

  const { events, problems } = eventsFromCsv(readFileSync(file, 'utf8'));
  if (problems.length > 0) {
    fail(['A fájlt nem töltöttem fel, mert hibás:', ...problems.map(describeProblem)].join('\n- '));
  }
  if (events.length === 0) {
    fail('A fájlban nincs esemény.');
  }
  console.log(`${events.length} esemény rendben van a fájlban.`);
  if (dryRun) {
    return;
  }

  // Dollar quoting with a random tag: the JSON goes into the SQL as it is, without escaping.
  const json = JSON.stringify(events);
  const tag = `$import_${randomBytes(8).toString('hex')}$`;
  if (json.includes(tag)) {
    fail('Váratlan hiba: próbáld újra.');
  }
  const output = queryLinkedDatabase(
    `select public.import_events('${source}', ${tag}${json}${tag}::jsonb, ${prune}) as result;`,
  ) as { rows?: { result?: ImportResult }[] };
  const result = output.rows?.[0]?.result;
  if (!result) {
    fail(`Váratlan válasz az adatbázistól:\n${JSON.stringify(output)}`);
  }
  console.log(
    `Kész (forrás: ${source}): ${result.changedEvents} esemény és ${result.changedVenues} helyszín új vagy módosult` +
      (prune ? `, ${result.removedEvents} esemény törölve.` : '.'),
  );
}

main();
