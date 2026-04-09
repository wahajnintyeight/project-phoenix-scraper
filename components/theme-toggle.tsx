"use client";

import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <motion.button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center border-2 border-primary/50 bg-background transition-all hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95"
      whileTap={{ scale: 0.9 }}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 md:h-5 md:w-5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 md:h-5 md:w-5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
    </motion.button>
  );
}
