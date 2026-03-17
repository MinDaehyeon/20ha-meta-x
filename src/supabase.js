import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "https://qyazcvhgvsxtkqfikpov.supabase.co"
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5YXpjdmhndnN4dGtxZmlrcG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzI3ODgsImV4cCI6MjA4ODU0ODc4OH0.rxon3PijaQzKKd1WYnRbREFBH3-hoSh0QEIr7gR44oI"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
