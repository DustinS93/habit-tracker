import { createClient }
from '@supabase/supabase-js';

const supabaseUrl = 'https://asplcwtabhpdvpnrdyae.supabase.co';
const supabaseKey = 'sb_publishable_ekVKOE5bGTIT_aMGyOGi6g_-mldP7Lb';

export const supabase = createClient(supabaseUrl, supabaseKey);


