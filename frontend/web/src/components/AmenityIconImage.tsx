"use client";

import { useState } from "react";

type AmenityIconImageProps = {
  src: string;
  alt: string;
  className?: string;
};

const FALLBACK_ICON = "/icons/amenities/default.svg";

export default function AmenityIconImage({
  src,
  alt,
  className,
}: AmenityIconImageProps) {
  const [iconSrc, setIconSrc] = useState(src.trim() || FALLBACK_ICON);

  return (
    <img
      src={iconSrc}
      alt={alt}
      width={14}
      height={14}
      className={className}
      onError={() => setIconSrc(FALLBACK_ICON)}
    />
  );
}
