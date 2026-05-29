import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!SUPABASE_URL) {
  throw new Error(
    "REACT_APP_SUPABASE_URL 환경변수가 설정되지 않았습니다. " +
    ".env(로컬) 또는 Vercel 대시보드 → Project Settings → Environment Variables 에 등록하세요."
  )
}
if (!SUPABASE_ANON_KEY) {
  throw new Error(
    "REACT_APP_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다. " +
    ".env(로컬) 또는 Vercel 대시보드 → Project Settings → Environment Variables 에 등록하세요."
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
