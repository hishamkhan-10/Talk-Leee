"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Phone,
    Users,
    Megaphone,
    Settings,
    LogOut,
    BarChart2,
    Volume2,
    Cpu,
    CalendarDays,
    Mail,
    Bell,
    Bot,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewportDrawer } from "@/components/ui/viewport-drawer";
import { HoverTooltip, useHoverTooltip } from "@/components/ui/hover-tooltip";
import { useSidebarActions, useSidebarState } from "@/lib/sidebar-client";
import { Button } from "@/components/ui/button";

const DUMMY_USER = {
    id: "user-001",
    email: "demo@talk-lee.ai",
    name: "Demo User",
    business_name: "Talk-Lee Demo Inc.",
};

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Campaigns", href: "/campaigns", icon: Megaphone },
    { name: "Call History", href: "/calls", icon: Phone },
    { name: "Contacts", href: "/contacts", icon: Users },
    { name: "Email", href: "/email", icon: Mail },
    { name: "Analytics", href: "/analytics", icon: BarChart2 },
    { name: "Recordings", href: "/recordings", icon: Volume2 },
    { name: "AI Options", href: "/ai-options", icon: Cpu },
    { name: "Meetings", href: "/meetings", icon: CalendarDays },
    { name: "Reminders", href: "/reminders", icon: Bell },
    { name: "Assistant", href: "/assistant", icon: Bot },
];

const bottomNavigation = [
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({
    className,
}: {
    className?: string;
}) {
    const pathname = usePathname();
    const { collapsed, mobileOpen } = useSidebarState();
    const { toggleCollapsed, closeMobile } = useSidebarActions();
    const tooltip = useHoverTooltip();

    const desktopWidth = collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-expanded-width)";
    const desktopNavItemClass = collapsed ? "justify-center px-2" : "justify-start px-3";
    const desktopTextClass = collapsed ? "hidden" : "block";

    const handleLogout = () => {
        window.location.href = "/";
    };

    const onClose = () => {
        closeMobile();
        tooltip.hide();
    };

    const maybeShowTooltip = (e: React.MouseEvent<HTMLElement>, content: string) => {
        if (!collapsed) return;
        const isDesktop = window.matchMedia?.("(min-width: 1024px)")?.matches;
        if (!isDesktop) return;
        tooltip.show(e.clientX + 18, e.clientY + 24, content);
    };

    const NavContent = (
        <div className="flex flex-col h-full">
            <div className={cn("relative h-20 flex items-center justify-between border-b border-gray-200/60", collapsed ? "px-2" : "px-6")}>
                <div className={cn("flex items-center justify-between w-full gap-3", collapsed ? "justify-start" : "")}>
                    <div className="flex items-center min-w-0">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={toggleCollapsed}
                            className={cn(
                                "hidden lg:inline-flex group rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-900/5 transition-[opacity,transform,max-width,color,background-color] duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20",
                                collapsed ? "max-w-9 opacity-100 translate-x-0" : "max-w-0 opacity-0 -translate-x-2 pointer-events-none"
                            )}
                            aria-label="Expand sidebar"
                            aria-expanded={!collapsed}
                        >
                            <PanelLeftOpen
                                className="h-5 w-5 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5"
                                aria-hidden
                            />
                        </Button>

                        <Link
                            href="/dashboard"
                            className={cn(
                                "flex items-center gap-3 min-w-0 overflow-hidden transition-[opacity,transform,max-width] duration-300 ease-in-out",
                                collapsed ? "max-w-0 opacity-0 -translate-x-2 pointer-events-none" : "max-w-[260px] opacity-100 translate-x-0"
                            )}
                            onClick={onClose}
                        >
                            <img src="/favicon.svg" alt="Talk-Lee" width={28} height={28} className="w-7 h-7" />
                            <div className="leading-tight min-w-0">
                                <div className="text-base font-black text-gray-900 tracking-tight">Talk-Lee</div>
                                <div className="text-[11px] font-semibold text-gray-600">Voice Ops</div>
                            </div>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="lg:hidden inline-flex group rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-900/5 transition-[transform,color,background-color] duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20"
                            aria-label="Close sidebar"
                        >
                            <PanelLeftClose
                                className="h-5 w-5 transition-transform duration-300 ease-in-out group-hover:-translate-x-0.5"
                                aria-hidden
                            />
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={toggleCollapsed}
                            className={cn(
                                "hidden lg:inline-flex group rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-900/5 transition-[opacity,transform,color,background-color] duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20",
                                collapsed ? "opacity-0 translate-x-2 pointer-events-none" : "opacity-100 translate-x-0"
                            )}
                            aria-label="Collapse sidebar"
                            aria-expanded={!collapsed}
                        >
                            <PanelLeftClose
                                className="h-5 w-5 transition-transform duration-300 ease-in-out group-hover:-translate-x-0.5"
                                aria-hidden
                            />
                        </Button>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 py-5 space-y-1.5">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            onMouseEnter={(e) => maybeShowTooltip(e, item.name)}
                            onMouseMove={(e) => maybeShowTooltip(e, item.name)}
                            onMouseLeave={() => tooltip.hide()}
                            className={cn(
                                "group flex items-center gap-3 py-2.5 rounded-xl text-sm font-semibold transition-colors border",
                                desktopNavItemClass,
                                isActive
                                    ? "bg-gray-900/5 border-gray-900/10 text-gray-900"
                                    : "bg-transparent border-transparent text-gray-700 hover:bg-gray-900/5 hover:border-gray-900/10 hover:text-gray-900"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900")} />
                            <span className={cn("truncate", desktopTextClass)}>{item.name}</span>
                            {collapsed ? <span className="sr-only">{item.name}</span> : null}
                        </Link>
                    );
                })}
            </nav>

            <div className="px-4 pb-4 border-t border-gray-200/60 pt-4 space-y-1.5">
                {bottomNavigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            onMouseEnter={(e) => maybeShowTooltip(e, item.name)}
                            onMouseMove={(e) => maybeShowTooltip(e, item.name)}
                            onMouseLeave={() => tooltip.hide()}
                            className={cn(
                                "group flex items-center gap-3 py-2.5 rounded-xl text-sm font-semibold transition-colors border",
                                desktopNavItemClass,
                                isActive
                                    ? "bg-gray-900/5 border-gray-900/10 text-gray-900"
                                    : "bg-transparent border-transparent text-gray-700 hover:bg-gray-900/5 hover:border-gray-900/10 hover:text-gray-900"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900")} />
                            <span className={cn("truncate", desktopTextClass)}>{item.name}</span>
                            {collapsed ? <span className="sr-only">{item.name}</span> : null}
                        </Link>
                    );
                })}

                <button
                    type="button"
                    onClick={handleLogout}
                    className={cn(
                        "w-full group flex items-center gap-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-900/5 hover:text-gray-900 transition-colors border border-transparent hover:border-gray-900/10",
                        desktopNavItemClass
                    )}
                    onMouseEnter={(e) => maybeShowTooltip(e, "Logout")}
                    onMouseMove={(e) => maybeShowTooltip(e, "Logout")}
                    onMouseLeave={() => tooltip.hide()}
                >
                    <LogOut className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                    <span className={cn("truncate", desktopTextClass)}>Logout</span>
                    {collapsed ? <span className="sr-only">Logout</span> : null}
                </button>
            </div>

            <div className="px-4 pb-5">
                <div className="content-card">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                            <span className="text-sm font-black text-gray-900">{DUMMY_USER.email?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">{DUMMY_USER.name}</p>
                            <p className="text-xs text-gray-600 font-semibold truncate">{DUMMY_USER.business_name}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <aside
                className={cn("hidden lg:block fixed left-0 top-0 bottom-0 z-20 transition-[width] ease-in-out", className)}
                style={{
                    width: desktopWidth,
                    transitionDuration: "var(--sidebar-transition-ms)",
                    willChange: "width",
                }}
            >
                <div className="w-full h-full bg-white/70 backdrop-blur-xl border-r border-gray-200/60 shadow-sm overflow-y-auto overscroll-contain">
                    {NavContent}
                </div>
            </aside>

            <ViewportDrawer
                open={mobileOpen}
                onOpenChange={(next) => {
                    if (!next) onClose();
                }}
                side="left"
                size={320}
                margin={10}
                ariaLabel="Sidebar"
                className="lg:hidden"
            >
                {NavContent}
            </ViewportDrawer>

            <HoverTooltip state={tooltip.state} />
        </>
    );
}
