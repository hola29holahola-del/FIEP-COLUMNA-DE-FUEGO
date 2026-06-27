import React from "react";

interface LogoProps {
  url?: string;
  className?: string;
  loading?: boolean;
}

export default function Logo({ url, className = "h-16 w-16" }: LogoProps) {
  const initialUrl = "https://i.postimg.cc/Hkw3jbLQ/Gemini-Generated-Image-l2ncmql2ncmql2nc.png";
  const finalUrl = url || initialUrl;

  return (
    <img
      src={finalUrl}
      alt="Logo Oficial"
      className={`${className} object-contain`}
      style={{ 
        imageRendering: "high-quality",
        WebkitImageRendering: "auto"
      }}
      referrerPolicy="no-referrer"
    />
  );
}
