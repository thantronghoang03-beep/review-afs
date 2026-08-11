import { getSupabase } from "@/lib/supabase/client";

export const BUCKET_NAME = "review-afs-uploads";

let bucketEnsured = false;

async function ensureBucket(): Promise<void> {
  if (bucketEnsured) return;
  const supabase = getSupabase();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET_NAME);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: "50MB",
    });
    // Ignore "already exists" race — two concurrent requests could both miss the listBuckets check.
    if (error && !/already exists/i.test(error.message)) {
      throw error;
    }
  }
  bucketEnsured = true;
}

export async function uploadFile(storagePath: string, buffer: Buffer): Promise<string> {
  await ensureBucket();
  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, { contentType: "application/pdf", upsert: true });
  if (error) throw error;
  return storagePath;
}

export async function downloadFile(storagePath: string): Promise<Buffer> {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(storagePath);
  if (error) throw error;
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function deleteFiles(storagePaths: string[]): Promise<void> {
  if (storagePaths.length === 0) return;
  const supabase = getSupabase();
  const { error } = await supabase.storage.from(BUCKET_NAME).remove(storagePaths);
  // Deleting an already-missing file shouldn't block the caller (e.g. re-deleting a check).
  if (error && !/not found/i.test(error.message)) throw error;
}

export function uploadPathFor(checkId: string, filename: string): string {
  return `${checkId}/${filename}`;
}
