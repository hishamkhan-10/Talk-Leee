"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const menuItems = [
    { label: "Home", href: "/" },
    { label: "Services", href: isHome ? "#services" : "/#services" },
    { label: "Packages", href: isHome ? "#packages" : "/#packages" },
    { label: "AI Voices", href: "/ai-voices" },
    { label: "Contact", href: isHome ? "#contact" : "/#contact" },
  ];

  return (
    <nav aria-label="Primary" className="home-navbar-fixed p-6 md:p-8">
      <div className="grid w-full grid-cols-[auto_1fr_auto] items-center">
        <Link
          href="/"
          className="justify-self-start text-xl font-bold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
          aria-label="Talk-Lee home"
        >
          Talk-Lee
        </Link>

        <div className="justify-self-center">
          {/* Mobile Menu */}
          <details className="relative md:hidden group">
            <summary
              className="home-menu-toggle list-none cursor-pointer"
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
                      className="home-mobile-link text-sm text-foreground/90 hover:text-foreground focus-visible:outline-none"
                      role="menuitem"
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
                  className="home-nav-link text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none"
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
            className="home-nav-link text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-semibold text-background bg-foreground rounded-xl hover:bg-foreground/90 hover:scale-[1.03] transition-[background-color,transform,box-shadow] duration-[250ms] ease-in-out shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </nav>
  );
}
