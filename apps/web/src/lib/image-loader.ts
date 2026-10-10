"use client";

type ImageLoaderParams = { src: string; width: number; quality?: number };

const UPLOAD_SEGMENT = "/image/upload/";

/**
 * next/image loader (DEC-012): Cloudinary resizes at the width asked for (`f_auto,q_auto,c_limit,w_N`).
 * Local files from `public/` are served as they are; the width query only tells the sizes apart.
 */
export default function imageLoader({ src, width }: ImageLoaderParams): string {
  if (src.startsWith("https://res.cloudinary.com/") && src.includes(UPLOAD_SEGMENT)) {
    return src.replace(UPLOAD_SEGMENT, `${UPLOAD_SEGMENT}f_auto,q_auto,c_limit,w_${width}/`);
  }
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
}
