import { createClient } from '@supabase/supabase-js'

// --- CARA BARBAR (HARDCODE) ---
// Langsung tempel nilainya di sini sebagai teks biasa.
// Jangan lupa pakai tanda kutip dua ("...")

const supabaseUrl = "https://vyguofxpodgolidpehox.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5Z3VvZnhwb2Rnb2xpZHBlaG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MTU2MDEsImV4cCI6MjA4MjA5MTYwMX0.cEtUXtabt0V39ryRJ3mlMdxkcwrYUx-UvOvyqvrol8k"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)