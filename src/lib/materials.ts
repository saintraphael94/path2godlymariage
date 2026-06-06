import { supabase } from "@/integrations/supabase/client";

/**
 * Existing rows may store either a full legacy public URL or a storage path.
 * Normalize to a storage path inside the `materials` bucket.
 */
export function toMaterialsPath(value: string): string {
  const marker = "/storage/v1/object/public/materials/";
  const idx = value.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(value.slice(idx + marker.length).split("?")[0]);
  }
  // Already a path
  return value.replace(/^\/+/, "");
}

export function fileNameFromMaterial(value: string): string {
  const path = toMaterialsPath(value);
  const last = path.split("/").pop() ?? path;
  return decodeURIComponent(last).replace(/^\d+-/, "");
}

export async function getMaterialSignedUrl(value: string, expiresInSeconds = 3600): Promise<string | null> {
  const path = toMaterialsPath(value);
  const { data, error } = await supabase.storage
    .from("materials")
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}