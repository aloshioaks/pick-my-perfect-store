import { createClient } from "@supabase/supabase-js";
import { shopConfig } from "./config.js";

export const hasSupabaseConfig = Boolean(shopConfig.supabaseUrl && shopConfig.supabaseAnonKey);

export const supabase = hasSupabaseConfig
  ? createClient(shopConfig.supabaseUrl, shopConfig.supabaseAnonKey)
  : null;
