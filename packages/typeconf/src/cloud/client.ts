import { createClient } from "@supabase/supabase-js";
import { Database } from "../database.types.js";

const CLOUD_URL = "https://sfcheddgbldthfcxoaqn.supabase.co";
const CLOUD_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmY2hlZGRnYmxkdGhmY3hvYXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE3OTM1MzgsImV4cCI6MjA0NzM2OTUzOH0.pErXNTPwqK71LA-mC3tfZdPtE8rYySyaOo1czW-MpEs";

let _supabase: ReturnType<typeof createClient<Database>> | undefined;
export const supabase = () => {
  if (!_supabase) {
    _supabase = createClient<Database>(CLOUD_URL, CLOUD_ANON_KEY);
  }
  return _supabase;
};

