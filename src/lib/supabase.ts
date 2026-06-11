import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export const BUCKET = 'thesis-files'

export async function uploadFile(file: File, path: string): Promise<string> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true })
  if (error) throw error
  return path
}

export async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}
