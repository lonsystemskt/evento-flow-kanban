
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ssatcprunifhywduyjxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzYXRjcHJ1bmlmaHl3ZHV5anh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTk4NjYsImV4cCI6MjA2MzU5NTg2Nn0.F32CEaJdobmbHMKi57vEREH82N9rzwY9f_SHewql42Q";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
