
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const targetModules = ['Carreras', 'Materias', 'Asignación'];

async function verifyAssignments() {
  console.log('Verifying assignments for:', targetModules);

  // Get Module IDs
  const { data: modules, error: modError } = await supabase
    .from('modulos')
    .select('id, nombre')
    .in('nombre', targetModules);

  if (modError) {
    console.error('Error fetching modules:', modError);
    return;
  }

  // Get Role IDs
  const { data: roles, error: roleError } = await supabase
    .from('roles')
    .select('id, nombre');

  if (roleError) {
    console.error('Error fetching roles:', roleError);
    return;
  }

  const roleMap = {};
  roles.forEach(r => roleMap[r.id] = r.nombre);

  // Check assignments
  for (const mod of modules) {
    const { data: assignments, error: assignError } = await supabase
      .from('roles_modulos')
      .select('rol_id')
      .eq('modulo_id', mod.id);

    if (assignError) {
      console.error(`Error fetching assignments for ${mod.nombre}:`, assignError);
      continue;
    }

    const assignedRoleNames = assignments.map(a => roleMap[a.rol_id]);
    console.log(`Module '${mod.nombre}' is assigned to:`, assignedRoleNames.join(', '));
  }
}

verifyAssignments();
