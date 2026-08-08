import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, Sun, Moon, ScanLine, Home, BookOpen, Radar as RadarIcon, LayoutDashboard, Menu, X, UserSearch, FileSearch, FileText, Siren, RadioTower, ArrowRightLeft } from "lucide-react";
import { useTheme } from "@/lib/useTheme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/analyzer", label: "Check an Offer", icon: ScanLine },
  { to: "/emergency-help", label: "Emergency Help", icon: Siren, urgent: true },
  { to: "/check-recruiter", label: "Check Recruiter", icon: UserSearch },
  { to: "/offer-dna", label: "OfferDNA", icon: FileSearch },
  { to: "/radar", label: "Scam Radar", icon: RadarIcon },
  { to: "/my-reports", label: "My Reports", icon: FileText },
  { to: "/compare", label: "Compare Scans", icon: ArrowRightLeft },
  { to: "/guide", label: "Red Flags Guide", icon: BookOpen },
  { to: "/browser-copilot", label: "Browser Copilot", icon: RadioTower },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }
];

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Left: hamburger + brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-accent"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="text-lg font-extrabold tracking-tight font-heading">JobShield AI</span>
            </Link>
          </div>

          {/* Center: clean */}
          <div className="hidden flex-1 sm:block" />

          {/* Right: theme toggle + CTA */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button asChild size="sm">
              <Link to="/analyzer" className="inline-flex items-center gap-1.5">
                <ScanLine className="h-4 w-4" />
                <span className="hidden sm:inline">Check an Offer</span>
                <span className="sm:hidden">Check</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Slide-out drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setOpen(false)}
        />
        {/* Drawer panel */}
        <aside
          className={cn(
            "absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-background shadow-2xl transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="text-lg font-extrabold tracking-tight font-heading">JobShield AI</span>
            </Link>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1 p-3">
            {links.map((l) => {
              const active = pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                    active ? "bg-accent text-accent-foreground" : l.urgent ? "text-risk hover:bg-risk/10" : "text-foreground hover:bg-accent"
                  )}
                >
                  <l.icon className="h-5 w-5" />
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="absolute inset-x-0 bottom-0 border-t border-border p-4">
            <Button asChild size="lg" className="w-full">
              <Link to="/analyzer" onClick={() => setOpen(false)}>
                <ScanLine className="mr-2 h-5 w-5" />
                Check an Offer
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}
