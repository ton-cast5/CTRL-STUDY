/**
 * Script único de verificación / seed alternativo.
 * IMPORTANTE: Las tablas deben existir primero — ejecuta supabase/setup.sql en el SQL Editor.
 *
 * Uso: npm run db:setup
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  const envPath = resolve(root, '.env.local');
  if (!existsSync(envPath)) {
    console.error('❌ Falta .env.local con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
    process.exit(1);
  }
  const lines = readFileSync(envPath, 'utf-8').split(/\r?\n/);
  const env: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim();
    if (k) env[k] = v;
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    console.error(
      '❌ Configura VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY (o VITE_SUPABASE_ANON_KEY) en .env.local',
    );
    process.exit(1);
  }

  const supabase = createClient(url, key);

  console.log('🔍 Verificando conexión con Supabase...');
  const { count, error } = await supabase.from('tutors').select('*', { count: 'exact', head: true });

  if (error) {
    console.error('\n❌ No se encontraron las tablas. Ejecuta primero el script SQL:');
    console.error('   1. Abre https://supabase.com/dashboard');
    console.error('   2. SQL Editor → pega el contenido de: supabase/setup.sql');
    console.error(`   3. Run\n`);
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log(`✅ Conexión OK — ${count ?? 0} tutores en la base de datos.`);

  if ((count ?? 0) === 0) {
    console.log('\n⚠️  Tablas vacías. Vuelve a ejecutar supabase/setup.sql (incluye datos iniciales).');
    process.exit(1);
  }

  const { data: appointments } = await supabase.from('appointments').select('id', { count: 'exact' });
  const { data: resources } = await supabase.from('resources').select('id', { count: 'exact' });

  console.log(`   Citas: ${appointments?.length ?? 0}`);
  console.log(`   Recursos: ${resources?.length ?? 0}`);
  console.log('\n🎉 Ctrl+Study listo para usar con Supabase.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
