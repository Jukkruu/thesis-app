import { createClient } from '@supabase/supabase-js'

export const BUCKET = 'thesis-files'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function uploadFile(file: File, path: string): Promise<string> {
  const { error } = await adminClient().storage
    .from(BUCKET)
    .upload(path, file, { upsert: true })
  if (error) throw error
  return path
}

export async function deleteFile(path: string): Promise<void> {
  const { error } = await adminClient().storage.from(BUCKET).remove([path])
  if (error) throw error
}

export async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await adminClient().storage
    .from(BUCKET)
    .createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}
