import  { useMemo } from "react";

export type AnimalIconProps = {
  id: string;                 // e.g. "1F43A" or "1F415-200D-1F9BA"
  size?: number;              // default 72
  format?: "svg" | "png";     // default "svg"
  className?: string;
  alt?: string;               // pass a meaningful label when not decorative
};

function sanitizeUnicodeSequence(id: string): string {
  // allow only hex, dash and A-F letters, force uppercase
  const normalized = id.toUpperCase().replace(/[^0-9A-F-]/g, "");
  // basic guard: must start with hex and contain at least one hex digit
  if (!/^[0-9A-F][0-9A-F-]*$/.test(normalized)) return "";
  return normalized;
}

export function AnimalIcon({
  id,
  size = 72,
  format = "svg",
  className = "",
  alt = "",
}: AnimalIconProps) {
  const safeId = useMemo(() => sanitizeUnicodeSequence(id), [id]);

  const src = safeId
    ? `/assets/animals/${format}/${safeId}.${format}`
    : undefined;

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={alt}
      className={className}
      loading="lazy"
      draggable={false}
      onError={(e) => {
        // fallback svg -> png if svg missing/broken
        if (format !== "svg") return;
        const target = e.currentTarget as HTMLImageElement;
        if (!safeId) return;
        const fallback = `/assets/animals/png/${safeId}.png`;
        if (target.src.endsWith(fallback)) return;
        target.src = fallback;
      }}
    />
  );
}
