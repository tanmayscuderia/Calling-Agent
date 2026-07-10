import { supabaseAdmin } from '../db/supabase';
import { logger } from '../utils/logger';

const WHATSAPP_MEDIA_BUCKET = 'whatsapp-media';
const BROCHURE_BUCKET = 'brochures';

/**
 * Ensure required Supabase Storage buckets exist.
 * Called on server boot — safe to run multiple times.
 */
export async function ensureBuckets(): Promise<void> {
  const sb = supabaseAdmin();
  try {
    // List existing buckets
    const { data: buckets } = await sb.storage.listBuckets();
    const names = new Set((buckets ?? []).map((b) => b.name));

    if (!names.has(WHATSAPP_MEDIA_BUCKET)) {
      await sb.storage.createBucket(WHATSAPP_MEDIA_BUCKET, { public: false });
      logger.info({ bucket: WHATSAPP_MEDIA_BUCKET }, 'Created storage bucket');
    }
    if (!names.has(BROCHURE_BUCKET)) {
      await sb.storage.createBucket(BROCHURE_BUCKET, { public: true });
      logger.info({ bucket: BROCHURE_BUCKET }, 'Created storage bucket (public)');
    }
  } catch (err) {
    logger.warn({ err }, 'ensureBuckets failed — storage may already exist or be unavailable');
  }
}

/**
 * Upload a downloaded WhatsApp media buffer to Supabase Storage.
 * Returns the private path (not a public URL) — signed URL can be generated on demand.
 */
export async function uploadWhatsAppMedia(params: {
  orgId: string;
  buffer: Buffer;
  mimeType: string;
  fileName?: string;
}): Promise<{ path: string; url: string | null }> {
  const sb = supabaseAdmin();
  const { orgId, buffer, mimeType, fileName } = params;

  const ext = guessExtension(mimeType, fileName);
  const key = `${orgId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

  const { data, error } = await sb.storage
    .from(WHATSAPP_MEDIA_BUCKET)
    .upload(key, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw error;

  // Try to create a signed URL valid for 1 year (media is private)
  const { data: signed } = await sb.storage
    .from(WHATSAPP_MEDIA_BUCKET)
    .createSignedUrl(data.path, 60 * 60 * 24 * 365);

  return { path: data.path, url: signed?.signedUrl ?? null };
}

/**
 * Generate a short-lived signed URL for a stored media file.
 */
export async function getSignedMediaUrl(path: string, expiresInSec = 3600): Promise<string | null> {
  const { data } = await supabaseAdmin()
    .storage
    .from(WHATSAPP_MEDIA_BUCKET)
    .createSignedUrl(path, expiresInSec);
  return data?.signedUrl ?? null;
}

/**
 * Get the public URL for a brochure file stored in the brochures bucket.
 * If the input is already an http(s) URL, return as-is.
 */
export function resolveBrochureUrl(input?: string | null): string | null {
  if (!input) return null;
  if (input.startsWith('http://') || input.startsWith('https://')) return input;
  // Assume it's a path in the brochures bucket
  const { data } = supabaseAdmin().storage.from(BROCHURE_BUCKET).getPublicUrl(input);
  return data.publicUrl;
}

function guessExtension(mimeType: string, fileName?: string): string {
  if (fileName && fileName.includes('.')) {
    const ext = fileName.slice(fileName.lastIndexOf('.'));
    if (ext.length <= 5) return ext;
  }
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'audio/ogg': '.ogg',
    'audio/mpeg': '.mp3',
    'application/pdf': '.pdf',
    'application/octet-stream': '.bin',
  };
  return map[mimeType] ?? '.bin';
}