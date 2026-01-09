"use client";
import { usePathname } from "next/navigation";

export default function ContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = pathname === "/" || pathname === "/login";
  return <div className={isPublic ? "" : "pl-64"}>{children}</div>;
}