import { getImage, buildSrcSet } from "@/lib/images";

type Props = {
  id: string;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
  /** CSS aspect-ratio override, e.g. "4 / 5" */
  ratio?: string;
  objectPosition?: string;
  quality?: "hero" | "normal";
  decorative?: boolean;
};

/**
 * Pre-optimised responsive image. Serves AVIF/WebP with a JPG fallback and a
 * blurred LQIP background so layout and colour are stable while loading.
 * All photography on this site is served locally from /public/media.
 */
export default function VOImage({
  id,
  alt,
  sizes = "100vw",
  className,
  priority = false,
  ratio,
  objectPosition,
  quality = "normal",
  decorative = false,
}: Props) {
  const image = getImage(id);
  const avif = buildSrcSet(image, "avif");
  const webp = buildSrcSet(image, "webp");
  const fallback = image.jpg ?? image.src;
  const style: React.CSSProperties = {
    backgroundColor: image.color,
    ...(image.lqip ? { backgroundImage: `url(${image.lqip})` } : {}),
    ...(ratio ? { aspectRatio: ratio } : {}),
  };

  return (
    <div
      className={`vo-img ${className ?? ""}`}
      style={style}
      data-quality={quality}
    >
      <picture>
        {avif ? <source type="image/avif" srcSet={avif} sizes={sizes} /> : null}
        {webp ? <source type="image/webp" srcSet={webp} sizes={sizes} /> : null}
        <img
          src={fallback}
          alt={decorative ? "" : alt}
          aria-hidden={decorative ? true : undefined}
          width={image.width}
          height={image.height}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          style={{
            objectPosition: objectPosition ?? "center",
            aspectRatio: ratio ? ratio : undefined,
            backgroundColor: image.color,
          }}
        />
      </picture>
    </div>
  );
}
