
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const rolesToAssign = ['SuperAdmin', 'Administrador'];
const modulesToAssign = ['Carreras', 'Materias', 'Asignación'];

async function assignModules() {
  console.log('Fetching roles and modules...');

  // Fetch Roles
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('id, nombre')
    .in('nombre', rolesToAssign);

  if (rolesError) {
    console.error('Error fetching roles:', rolesError);
    return;
  }

  // Fetch Modules
  const { data: modules, error: modulesError } = await supabase
    .from('modulos')
    .select('id, nombre')
    .in('nombre', modulesToAssign);

  if (modulesError) {
    console.error('Error fetching modules:', modulesError);
    return;
  }

  console.log(`Found ${roles.length} roles and ${modules.length} modules.`);

  const assignments = [];
  for (const role of roles) {
    for (const module of modules) {
      assignments.push({
        rol_id: role.id,
        modulo_id: module.id
      });
    }
  }

  console.log(`Preparing to insert ${assignments.length} assignments...`);

  // Insert assignments (ignoring duplicates if possible, but Supabase simple insert might fail on conflict if not handled. 
  // We'll check existence first to be safe or use upsert if constraint exists)
  
  for (const assignment of assignments) {
      const { data: existing, error: checkError } = await supabase
          .from('roles_modulos')
          .select('*')
          .eq('rol_id', assignment.rol_id)
          .eq('modulo_id', assignment.modulo_id)
          .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existence:', checkError);
          continue;
      }

      if (!existing) {
          const { error: insertError } = await supabase
              .from('roles_modulos')
              .insert([assignment]);
          
          if (insertError) {
              console.error(`Failed to assign module ${assignment.modulo_id} to role ${assignment.rol_id}:`, insertError);
          } else {
              console.log(`Assigned module ${assignment.modulo_id} to role ${assignment.rol_id}`);
          }
      } else {
          console.log(`Assignment already exists for role ${assignment.rol_id} and module ${assignment.modulo_id}`);
      }
  }
  
  console.log('Assignment process completed.');
}

assignModules();
