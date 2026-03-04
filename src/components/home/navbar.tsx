"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, PhoneCall, Sparkles, Moon, Sun, X, Headphones, BadgeCheck } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { getBrowserAuthToken, setBrowserAuthToken } from "@/lib/auth-token";
import { industryNavItems } from "@/Industries/industries";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAiVoices = pathname === "/ai-voices" || pathname.startsWith("/ai-voices/");
  const isUseCasesPage = pathname.startsWith("/use-cases");
  const isIndustriesPage = pathname.startsWith("/industries");
  const isProductsPage =
    pathname === "/ai-voice-dialer" ||
    pathname.startsWith("/ai-voice-dialer/") ||
    pathname === "/ai-assist" ||
    pathname.startsWith("/ai-assist/") ||
    pathname === "/ai-voice-agent" ||
    pathname.startsWith("/ai-voice-agent/");
  const mobileMenuRef = useRef<HTMLDetailsElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isCompact = true;
  const [isInHeroZone, setIsInHeroZone] = useState(true);
  const [suppressedDropdownLabel, setSuppressedDropdownLabel] = useState<string | null>(null);

  const menuItems = [
    { label: "Home", href: "/" },
    {
      label: "Products",
      items: [
        {
          label: "AI Voice Dialer",
          href: "/ai-voice-dialer",
          description: "Automate calls, emails, and workflows with human-like voice agents.",
          icon: PhoneCall,
        },
        {
          label: "AI Assist",
          href: "/ai-assist",
          description: "Real-time guidance, call insights, and automated follow-ups for teams.",
          icon: Sparkles,
        },
        {
          label: "AI Voice Agent",
          href: "/ai-voice-agent",
          description: "Smarter conversations with natural dialogue and seamless handoffs.",
          icon: Bot,
        },
      ],
    },
    {
      label: "Use Cases",
      items: [
        {
          label: "Customer Services & Support",
          href: "/use-cases/customer-services-support",
          description: "Deliver faster resolutions and consistent support with AI-powered conversations.",
          icon: Headphones,
        },
        {
          label: "Automated Lead Qualification",
          href: "/use-cases/automated-lead-qualification",
          description: "Engage, score, and route leads instantly so reps focus on high-intent prospects.",
          icon: BadgeCheck,
        },
      ],
    },
    { label: "Industries", items: [...industryNavItems] },
    { label: "FAQ", href: isHome ? "#faq" : "/#faq" },
    { label: "Contact", href: isHome ? "#contact" : "/#contact" },
  ];

  type MenuItem = (typeof menuItems)[number];
  type DropdownWithChildrenItem = Extract<MenuItem, { items: unknown[] }>;
  type LinkItem = Extract<MenuItem, { href: string }>;

  const isDropdownWithChildrenItem = (item: MenuItem): item is DropdownWithChildrenItem =>
    "items" in item && Array.isArray(item.items) && item.items.length > 0;

  const isLinkItem = (item: MenuItem): item is LinkItem => "href" in item && typeof item.href === "string";

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const token = getBrowserAuthToken();
    if (token) return;
    setBrowserAuthToken("dev-token");
  }, []);

  const closeMobileMenu = useCallback(() => {
    const details = mobileMenuRef.current;
    if (details?.hasAttribute("open")) details.removeAttribute("open");
    setMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    closeMobileMenu();
  }, [closeMobileMenu, pathname]);

  useEffect(() => {
    setSuppressedDropdownLabel(null);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      closeMobileMenu();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [closeMobileMenu, mobileMenuOpen]);

  useEffect(() => {
    if (!isHome) return;

    let rafId = 0;
    const update = () => {
      rafId = 0;
      const heroEndY = window.innerHeight - 1;
      setIsInHeroZone(window.scrollY < heroEndY);
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isHome]);

  return (
    <nav
      aria-label="Primary"
      className={[
        "home-navbar-fixed dark px-4 sm:px-6 md:px-8 flex items-center h-[var(--home-navbar-height)]",
        isAiVoices || isUseCasesPage || isIndustriesPage || isProductsPage || (isHome && !isInHeroZone) ? "home-navbar-scrolled" : "",
        mobileMenuOpen ? "home-navbar-menu-open" : "",
      ].join(" ")}
      data-theme={theme}
      style={{
        fontFamily: "var(--font-manrope)",
        ...(isAiVoices
          ? {
              background: theme === "dark" ? "#001022" : "#ecfeff",
            }
          : null),
      }}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid w-full h-full grid-cols-[auto_1fr_auto] items-center px-2 sm:px-4">
          <div className="flex items-center gap-3 justify-self-start">
            <details
              ref={mobileMenuRef}
              className="relative md:hidden group"
              onToggle={(event) => {
                setMobileMenuOpen(event.currentTarget.open);
              }}
            >
              <summary
                className="home-menu-toggle list-none cursor-pointer"
                style={{
                  color: isAiVoices ? (theme === "dark" ? "#7dd3fc" : "#0b2a6f") : "rgba(226, 232, 240, 0.95)",
                }}
                aria-label="Open navigation menu"
                aria-haspopup="menu"
                aria-expanded={mobileMenuOpen}
              >
                {!mobileMenuOpen ? (
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
                ) : null}
              </summary>

              <div
                className="home-mobile-overlay"
                aria-hidden="true"
                onClick={() => {
                  closeMobileMenu();
                }}
              />

              <div className="home-mobile-panel" role="menu" aria-label="Mobile">
                <div className="flex items-center justify-between pb-2">
                  <Link
                    href="/"
                    className={[
                      "home-mobile-link text-sm font-medium tracking-tight focus-visible:outline-none text-foreground/90 hover:text-foreground",
                    ].join(" ")}
                    onClick={() => {
                      closeMobileMenu();
                    }}
                  >
                    Talk-Lee
                  </Link>
                  <button
                    type="button"
                    className="home-menu-toggle"
                    aria-label="Close navigation menu"
                    onClick={() => {
                      closeMobileMenu();
                    }}
                  >
                    <X width={20} height={20} aria-hidden />
                  </button>
                </div>
                <ul className="grid gap-1" role="list">
                  {menuItems.map((item) => {
                    return (
                      <li key={item.label}>
                        {isDropdownWithChildrenItem(item) ? (
                          <details className="group">
                            <summary
                              className={[
                                "home-mobile-link text-sm font-medium focus-visible:outline-none text-foreground/90 hover:text-foreground cursor-pointer list-none",
                              ].join(" ")}
                            >
                              {item.label}
                            </summary>
                            <div className="ml-3 mt-1 grid gap-1">
                              {item.items.map((child) => (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={[
                                    "home-mobile-link text-sm font-medium focus-visible:outline-none text-foreground/90 hover:text-foreground",
                                  ].join(" ")}
                                  onClick={() => {
                                    closeMobileMenu();
                                  }}
                                >
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                          </details>
                        ) : isLinkItem(item) ? (
                          <Link
                            href={item.href}
                            className={[
                              "home-mobile-link text-sm font-medium focus-visible:outline-none text-foreground/90 hover:text-foreground",
                            ].join(" ")}
                            onClick={() => {
                              closeMobileMenu();
                            }}
                          >
                            {item.label}
                          </Link>
                        ) : null}
                      </li>
                    );
                  })}
                  <li className="mt-1 border-t border-border/60 pt-1">
                    <Link
                      href="/dashboard"
                      className={[
                        "home-mobile-link text-sm font-medium focus-visible:outline-none text-foreground/90 hover:text-foreground",
                      ].join(" ")}
                      onClick={() => {
                        closeMobileMenu();
                      }}
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard"
                      className={[
                        "home-mobile-link text-sm font-medium focus-visible:outline-none text-foreground/90 hover:text-foreground",
                      ].join(" ")}
                      onClick={() => {
                        closeMobileMenu();
                      }}
                    >
                      Start Free Trial
                    </Link>
                  </li>
                </ul>
              </div>
            </details>
            <Link
              href="/"
              className={[
                "font-medium tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg transition-[font-size] duration-200 ease-out",
                isCompact ? "text-lg" : "text-xl",
                "text-foreground hover:text-foreground",
              ].join(" ")}
              aria-label="Talk-Lee home"
            >
              Talk-Lee
            </Link>
          </div>

          <ul className="hidden md:flex items-center justify-center gap-5 lg:gap-8 xl:gap-10" role="list">
            {menuItems.map((item) => {
              const isIndustriesDropdown = item.label === "Industries";
              const dropdownWidthClass = isIndustriesDropdown ? "w-[680px]" : item.label === "Products" || item.label === "Use Cases" ? "w-[345px]" : "w-[520px]";
              const dropdownGridClass = isIndustriesDropdown ? "grid-cols-2" : "grid-cols-1";
              return (
                <li key={item.label} className="relative">
                  {isDropdownWithChildrenItem(item) ? (
                    <div
                      className="group relative"
                      onMouseLeave={() => {
                        setSuppressedDropdownLabel(null);
                      }}
                    >
                      <button
                        type="button"
                        className={[
                          "home-nav-link text-sm font-medium focus-visible:outline-none",
                          "text-foreground/80 hover:text-foreground",
                          "inline-flex items-center gap-1",
                        ].join(" ")}
                        aria-haspopup="menu"
                      >
                        {item.label}
                        <ChevronDown
                          className="h-4 w-4 transition-transform duration-200 ease-out group-hover:rotate-180 group-focus-within:rotate-180"
                          aria-hidden
                        />
                      </button>
                      <div
                        className={[
                          `absolute left-1/2 top-full z-50 -translate-x-1/2 ${dropdownWidthClass} max-w-[92vw]`,
                          "opacity-0 pointer-events-none translate-y-2 scale-[0.98] transition-[opacity,transform] duration-200 ease-out",
                          "group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:scale-100",
                          "group-focus-within:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:scale-100",
                          suppressedDropdownLabel === item.label
                            ? "opacity-0 pointer-events-none translate-y-2 scale-[0.98] duration-100"
                            : "",
                        ].join(" ")}
                        role="menu"
                        aria-label={item.label}
                        style={
                          suppressedDropdownLabel === item.label
                            ? {
                                opacity: 0,
                                pointerEvents: "none",
                              }
                            : undefined
                        }
                      >
                        <div className="rounded-3xl border border-border/70 bg-cyan-100/90 dark:bg-cyan-950/90 backdrop-blur-sm p-2 shadow-xl">
                          <ul className={`grid ${dropdownGridClass} gap-1.5`} role="list">
                            {item.items.map((child) => (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  className={[
                                    "group/card block h-full rounded-2xl border border-border/70 bg-transparent px-3 py-2.5",
                                    "transition-[transform,background-color,box-shadow,border-color,filter] duration-200 ease-out",
                                    "hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.02] hover:shadow-md hover:bg-foreground/5",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                  ].join(" ")}
                                  onClick={() => {
                                    setSuppressedDropdownLabel(item.label);
                                    (document.activeElement as HTMLElement | null)?.blur?.();
                                  }}
                                  style={{
                                    backgroundImage: "var(--home-card-gradient)",
                                    backgroundSize: "cover",
                                    backgroundRepeat: "no-repeat",
                                    ...(item.label === "Products" || item.label === "Use Cases"
                                      ? {
                                          width: 329,
                                        }
                                      : null),
                                  }}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-white">
                                      {"icon" in child && child.icon ? (
                                        <child.icon className="h-4 w-4 text-black" aria-hidden />
                                      ) : null}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold text-foreground">{child.label}</div>
                                      {"description" in child && child.description ? (
                                        <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
                                          {child.description}
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : isLinkItem(item) ? (
                    <Link
                      href={item.href}
                      className={[
                        "home-nav-link text-sm font-medium focus-visible:outline-none",
                        "text-foreground/80 hover:text-foreground",
                      ].join(" ")}
                      aria-current={item.href === "/" ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-4 lg:gap-5 justify-self-end">
            <div className="hidden md:inline-flex">
              <Link
                href="/dashboard"
                className={[
                  "home-nav-link text-sm font-medium focus-visible:outline-none",
                  "text-foreground/80 hover:text-foreground",
                ].join(" ")}
              >
                Dashboard
              </Link>
            </div>
            <Link
              href="/dashboard"
              className={[
                "hidden md:inline-flex px-4 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 transition-[background-color,box-shadow] duration-200 ease-out shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isCompact ? "py-1.5" : "py-2",
              ].join(" ")}
            >
              Start Free Trial
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className={[
                "inline-flex items-center justify-center rounded-full hover:scale-[1.03] transition-[background-color,transform,color,width,height] duration-[250ms] ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "text-foreground/80 hover:text-foreground hover:bg-white/10",
                isCompact ? "w-9 h-9" : "w-10 h-10",
              ].join(" ")}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              aria-pressed={theme === "dark"}
              title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? (
                <Sun width={18} height={18} aria-hidden />
              ) : (
                <Moon width={18} height={18} aria-hidden />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
