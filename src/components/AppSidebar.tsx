"use client";

import { useTheme } from "@/context/ThemeContext";
import SidebarDark from "@/components/sidebars/SidebarDark";
import SidebarLight from "@/components/sidebars/SidebarLight";
import { useEffect, useState } from "react";

export default function AppSidebar() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent flicker during hydration - default to Dark (Space Station)
  if (!mounted) {
    return <SidebarDark />;
  }

  return theme === "dark" ? <SidebarDark /> : <SidebarLight />;
}