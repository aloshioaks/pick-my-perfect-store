export const shopConfig = {
  name: "Pick my perfect",
  tagline: "Where perfect choices begin",
  currency: "GBP",
  locale: "en-GB",
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
};
