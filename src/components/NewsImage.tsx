import type { ImgHTMLAttributes } from 'react';

const FALLBACK_NEWS_IMAGE = '/assets/tugurejo.webp';

/** Delivers Cloudinary images at the displayed size while keeping every card on a local fallback. */
export function getNewsImageSrc(source: string | undefined, width: number): string {
  const url = (source || '').trim();
  if (!url) return FALLBACK_NEWS_IMAGE;
  if (url.includes('res.cloudinary.com/') && url.includes('/image/upload/')) {
    return url.replace('/image/upload/', `/image/upload/f_auto,q_auto:good,c_fill,g_auto,w_${width},dpr_auto/`);
  }
  return url;
}

interface NewsImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  widthHint?: number;
}

export default function NewsImage({ src, alt = '', widthHint = 960, loading = 'lazy', decoding = 'async', onError, ...props }: NewsImageProps) {
  return (
    <img
      {...props}
      src={getNewsImageSrc(typeof src === 'string' ? src : undefined, widthHint)}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onError={(event) => {
        const image = event.currentTarget;
        if (image.src !== new URL(FALLBACK_NEWS_IMAGE, window.location.origin).href) {
          image.src = FALLBACK_NEWS_IMAGE;
          image.onerror = null;
        }
        onError?.(event);
      }}
    />
  );
}
