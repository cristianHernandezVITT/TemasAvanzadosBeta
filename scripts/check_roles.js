
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRoles() {
  const { data, error } = await supabase.from('roles').select('*');
  if (error) {
    console.error('Error fetching roles:', error);
  } else {
    console.log('Roles found:', data);
  }
}

checkRoles();
