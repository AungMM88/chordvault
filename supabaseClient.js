import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xngpfpyquislamenzow.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZ3BmcHlxdWlsYW1lbnpvd3MiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc5MzQ0MTc3OCwiZXhwIjoyMTA5MDE3Nzh9.9rqTl77qoVz7I6CUbb0FS0d7MJobH4rFpGPoIu1zhxo'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)