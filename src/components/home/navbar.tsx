"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { getBrowserAuthToken, setBrowserAuthToken } from "@/lib/auth-token";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const mobileMenuRef = useRef<HTMLDetailsElement | null>(null);
  const { theme, toggleTheme } = useTheme();
  const isCompact = true;
  const isLightTheme = theme === "light";

  const menuItems = [
    { label: "Home", href: "/" },
    { label: "Services", href: isHome ? "#services" : "/#services" },
    { label: "Packages", href: isHome ? "#packages" : "/#packages" },
    { label: "AI Voices", href: "/ai-voices" },
    { label: "Contact", href: isHome ? "#contact" : "/#contact" },
  ];

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const token = getBrowserAuthToken();
    if (token) return;
    setBrowserAuthToken("dev-token");
  }, []);

  return (
    <nav
      aria-label="Primary"
      style={
        isLightTheme
          ? ({
              ["--home-hover-bg" as never]: "rgba(255, 255, 255, 0.10)",
              ["--home-surface-border" as never]: "rgba(255, 255, 255, 0.18)",
              ["--home-focus-ring" as never]: "rgba(56, 189, 248, 0.35)",
              ["--home-panel-bg" as never]: "rgba(10, 25, 47, 0.92)",
            } as React.CSSProperties)
          : undefined
      }
      className={[
        "home-navbar-fixed bg-[#0A192F] px-6 md:px-8",
        isCompact ? "py-3 md:py-4" : "py-6 md:py-8",
      ].join(" ")}
    >
      <div className="grid w-full grid-cols-[auto_1fr_auto] items-center">
        <Link
          href="/"
          className={[
            "justify-self-start font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg transition-[font-size] duration-200 ease-out",
            isCompact ? "text-lg" : "text-xl",
            isLightTheme ? "text-sky-200 hover:text-white" : "text-foreground",
          ].join(" ")}
          aria-label="Talk-Lee home"
        >
          Talk-Lee
        </Link>

        <div className="justify-self-center">
          {/* Mobile Menu */}
          <details ref={mobileMenuRef} className="relative md:hidden group">
            <summary
              className="home-menu-toggle list-none cursor-pointer"
              style={isLightTheme ? { color: "rgba(226, 232, 240, 0.95)" } : undefined}
              aria-label="Open navigation menu"
              aria-haspopup="menu"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </summary>

            <div className="home-mobile-panel" role="menu" aria-label="Mobile">
              <ul className="grid gap-1" role="list">
                {menuItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={[
                        "home-mobile-link text-sm focus-visible:outline-none",
                        isLightTheme
                          ? "text-slate-100 hover:text-white"
                          : "text-foreground/90 hover:text-foreground",
                      ].join(" ")}
                      role="menuitem"
                      onClick={() => {
                        mobileMenuRef.current?.removeAttribute("open");
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </details>

          {/* Desktop Menu */}
          <ul className="hidden md:flex items-center justify-center gap-4 lg:gap-6" role="list">
            {menuItems.map((item) => (
              <li key={item.label} className="relative">
                <Link
                  href={item.href}
                  className={[
                    "home-nav-link text-sm focus-visible:outline-none",
                    isLightTheme
                      ? "text-slate-200 hover:text-white"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                  aria-current={item.href === "/" ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-3 justify-self-end">
          <Link
            href="/dashboard"
            className={[
              "home-nav-link text-sm focus-visible:outline-none",
              isLightTheme ? "text-slate-200 hover:text-white" : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard"
            className={[
              "px-4 text-sm font-semibold text-background bg-foreground rounded-xl hover:bg-foreground/90 hover:scale-[1.03] transition-[background-color,transform,box-shadow,padding] duration-[250ms] ease-in-out shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isCompact ? "py-1.5" : "py-2",
            ].join(" ")}
          >
            Start Free Trial
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className={[
              "inline-flex items-center justify-center rounded-xl hover:scale-[1.03] transition-[background-color,transform,color,width,height] duration-[250ms] ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isLightTheme ? "text-slate-200 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
              isCompact ? "w-9 h-9" : "w-10 h-10",
            ].join(" ")}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            aria-pressed={theme === "dark"}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? <Sun width={18} height={18} aria-hidden /> : <Moon width={18} height={18} aria-hidden />}
          </button>
        </div>
      </div>
    </nav>
  );
}
