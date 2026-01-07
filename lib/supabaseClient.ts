import { createClient } from '@supabase/supabase-js'

// --- MODIFIKASI DIMULAI ---
// Kita tambahkan "||" (OR) string kosong. 
// Ini trik agar saat Vercel melakukan build, dia tidak error "Required".
// Saat website jalan beneran, dia akan pakai process.env yang asli.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

// --- MODIFIKASI SELESAI ---

export const supabase = createClient(supabaseUrl, supabaseAnonKey)