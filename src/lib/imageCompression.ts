// Compressão client-side antes de upload (custo zero de IA).
import imageCompression from "browser-image-compression";

export type CompressOpts = {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string; // ex 'image/webp'
};

const DEFAULTS: Required<Omit<CompressOpts, "fileType">> & { fileType?: string } = {
  maxSizeMB: 0.4,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
};

export async function compressImage(file: File, opts: CompressOpts = {}): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const merged = { ...DEFAULTS, ...opts };
    const out = await imageCompression(file, merged);
    // imageCompression returns a Blob — wrap as File preserving the name
    return new File([out], file.name.replace(/\.(png|jpe?g|gif|bmp|webp)$/i, ".webp"), {
      type: merged.fileType || "image/webp",
      lastModified: Date.now(),
    });
  } catch (e) {
    console.warn("[imageCompression] fallback to original:", e);
    return file;
  }
}
