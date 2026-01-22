"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone } from "lucide-react";
import React from "react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const isHome = pathname === "/";

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Services", href: isHome ? "#services" : "/#services" },
    { label: "Packages", href: isHome ? "#packages" : "/#packages" },
    { label: "AI Voices", href: "/ai-voices" },
    { label: "Contact", href: isHome ? "#contact" : "/#contact" },
  ];

  return (
    <footer className="bg-background pt-16 pb-8 px-4 md:px-6 lg:px-8 border-t border-border/60">
      <div className="max-w-7xl mx-auto">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
              <Phone className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="text-2xl font-bold text-foreground tracking-tight group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
              Talk-Lee
            </span>
          </Link>

          {/* Navigation */}
          <nav>
            <ul className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-base font-medium text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors relative after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-0.5 after:bg-indigo-600 after:transition-all hover:after:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Divider */}
        <hr className="border-border/60 mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
          <div className="text-muted-foreground">
            © {currentYear} Talk-Lee. All rights reserved.
          </div>

          <div className="flex items-center gap-6">
            <Link 
              href="/auth/login" 
              className="font-medium text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
            >
              Login
            </Link>
            <Link 
              href="/auth/register" 
              className="font-semibold text-foreground hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
