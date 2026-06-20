import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("FATAL ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables");
}

// Supabase client for storage usage only
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export { supabase };
