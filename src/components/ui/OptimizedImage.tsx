import Image from "next/image";

type OptimizedImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

function isCloudinaryImage(src: string) {
  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export function OptimizedImage({
  src,
  alt,
  className,
  sizes = "100vw",
  priority = false,
}: OptimizedImageProps) {
  if (isCloudinaryImage(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={className}
      />
    );
  }

  /*
   * Fallback for manually added external image URLs.
   * Prefer Cloudinary URLs for production products so images can be optimized by Next.js.
   */
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}
