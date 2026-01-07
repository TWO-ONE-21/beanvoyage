import { createClient } from '@supabase/supabase-js'

// --- AREA TEMPEL KUNCI ---

// 1. Masukkan URL Supabase Anda di antara tanda kutip di bawah:
const supabaseUrl = "https://vyguofxpodgolidpehox.supabase.co"

// 2. Masukkan Key Supabase (ANON KEY) Anda di antara tanda kutip di bawah:
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5Z3VvZnhwb2Rnb2xpZHBlaG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MTU2MDEsImV4cCI6MjA4MjA5MTYwMX0.cEtUXtabt0V39ryRJ3mlMdxkcwrYUx-UvOvyqvrol8k"

// -------------------------

export const supabase = createClient(supabaseUrl, supabaseAnonKey)