import React from "react";
import * as Icons from "lucide-react";

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function LucideIcon({ name, className, size }: LucideIconProps) {
  // Resolve icon component dynamically from the lucide-react package exports
  const IconComponent = (Icons as any)[name];

  if (!IconComponent) {
    // Elegant fallback icon if typed icon does not exist or matches incorrectly
    return <Icons.HelpCircle className={className} size={size} />;
  }

  return <IconComponent className={className} size={size} />;
}
