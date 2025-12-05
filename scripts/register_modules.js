
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const newModules = [
  {
    nombre: 'Carreras',
    descripcion: 'Gestión de carreras',
    ruta: '/carreras',
    icono: 'BookOpen',
    orden: 9,
    activo: true
  },
  {
    nombre: 'Materias',
    descripcion: 'Gestión de materias',
    ruta: '/materias',
    icono: 'BookOpen',
    orden: 10,
    activo: true
  },
  {
    nombre: 'Asignación',
    descripcion: 'Asignación de materias a docentes',
    ruta: '/asignacion-materias',
    icono: 'UserPlus',
    orden: 11,
    activo: true
  }
];

async function registerModules() {
  console.log('Registering new modules...');

  for (const modulo of newModules) {
    // Check if module already exists
    const { data: existing, error: checkError } = await supabase
      .from('modulos')
      .select('id')
      .eq('ruta', modulo.ruta)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
      console.error(`Error checking module ${modulo.nombre}:`, checkError);
      continue;
    }

    if (existing) {
      console.log(`Module ${modulo.nombre} already exists. Skipping.`);
      continue;
    }

    // Insert new module
    const { data, error } = await supabase
      .from('modulos')
      .insert([modulo])
      .select();

    if (error) {
      console.error(`Error inserting module ${modulo.nombre}:`, error);
    } else {
      console.log(`Module ${modulo.nombre} registered successfully.`);
    }
  }
}

registerModules();
