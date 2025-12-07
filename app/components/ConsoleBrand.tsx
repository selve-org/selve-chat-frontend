"use client";

import { useEffect } from "react";
import { printConsoleBrand } from "../utils/console-brand";

interface ConsoleBrandProps {
  children: React.ReactNode;
}

/**
 * Client-side wrapper that prints console branding on mount.
 */
export function ConsoleBrand({ children }: ConsoleBrandProps): React.ReactNode {
  useEffect(() => {
    printConsoleBrand();
  }, []);

  return <>{children}</>;
}
