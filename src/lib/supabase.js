import { createClient } from "@supabase/supabase-js";

// Supabase client for storage usage only
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export { supabase };
