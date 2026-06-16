import Image from "next/image";

type OptimizedImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
  cloudinaryWidth?: number;
};


/* eslint-disable @next/next/no-img-element -- Non-Cloudinary fallback avoids Next Image remote-host configuration failures. */
function RawImageFallback({
  src,
  alt,
  className,
  loading,
}: Pick<OptimizedImageProps, "src" | "alt" | "className" | "loading">) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
    />
  );
}
/* eslint-enable @next/next/no-img-element */

function isCloudinaryImage(src: string) {
  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export function getOptimizedCloudinarySrc(src: string, width = 1200) {
  if (!isCloudinaryImage(src)) {
    return src;
  }

  try {
    const url = new URL(src);
    const pathnameParts = url.pathname.split("/");
    const uploadIndex = pathnameParts.findIndex((part) => part === "upload");

    if (uploadIndex === -1) {
      return src;
    }

    const safeWidth = Math.max(80, Math.min(Math.round(width), 2000));
    const transformation = `f_auto,q_auto,c_limit,w_${safeWidth}`;
    const nextPathPart = pathnameParts[uploadIndex + 1] ?? "";

    if (nextPathPart.includes("f_auto") || nextPathPart.includes("q_auto")) {
      return src;
    }

    pathnameParts.splice(uploadIndex + 1, 0, transformation);
    url.pathname = pathnameParts.join("/");

    return url.toString();
  } catch {
    return src;
  }
}

export function OptimizedImage({
  src,
  alt,
  className,
  sizes = "100vw",
  priority = false,
  loading = "lazy",
  cloudinaryWidth = 1200,
}: OptimizedImageProps) {
  if (isCloudinaryImage(src)) {
    return (
      <Image
        src={getOptimizedCloudinarySrc(src, cloudinaryWidth)}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : loading}
        className={className}
        unoptimized
      />
    );
  }

  /*
   * Fallback for manually added external image URLs.
   * Prefer Cloudinary URLs for production products so images can be optimized by Cloudinary delivery transformations.
   */
  return (
    <RawImageFallback
      src={src}
      alt={alt}
      className={className}
      loading={loading}
    />
  );
}
