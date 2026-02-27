"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf, Sun, Moon, Bell, Menu, X, ChevronDown,
  LayoutDashboard, Sparkles, FlaskConical, User, History, LogOut, Settings
} from "lucide-react";
import { createClient } from '@/lib/supabase/client'
import { mockNotifications } from "@/lib/mock-data";
import { NAV_LINKS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { User as SupabaseUser } from '@supabase/supabase-js'

const navIcons: Record<string, React.ReactNode> = {
  "/dashboard": <LayoutDashboard className="w-4 h-4" />,
  "/suggestions": <Sparkles className="w-4 h-4" />,
  "/simulation": <FlaskConical className="w-4 h-4" />,
  "/profile": <User className="w-4 h-4" />,
  "/history": <History className="w-4 h-4" />,
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    
    // Check user session
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });
      
      return () => subscription.unsubscribe();
    };
    
    checkUser();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const isLanding = pathname === "/";

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isLanding
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 20 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
            >
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <span className={`font-bold text-lg tracking-tight ${isLanding && !scrolled ? "text-white" : "text-foreground"}`}>
              EcoTrack <span className="text-[#6BAA75] dark:text-[#4CD964]">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? "bg-primary/10 text-primary dark:text-[#4CD964]"
                    : isLanding && !scrolled
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {navIcons[link.href]}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className={`rounded-full ${isLanding && !scrolled ? "text-white hover:bg-white/10" : ""}`}
              >
                {resolvedTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            )}

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`relative rounded-full ${isLanding && !scrolled ? "text-white hover:bg-white/10" : ""}`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <div className="px-3 py-2 font-semibold text-sm">Notifications</div>
                <DropdownMenuSeparator />
                {mockNotifications.map((n) => (
                  <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 py-2">
                    <span className={`text-sm ${!n.read ? "font-medium" : "text-muted-foreground"}`}>{n.message}</span>
                    <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 p-2 h-auto rounded-full">
                  <div className="w-8 h-8 rounded-full bg-[#6BAA75] dark:bg-[#4CD964] flex items-center justify-center text-white dark:text-[#0A1F18] font-bold text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <div className="font-medium">{user?.email || 'User'}</div>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2"><User className="w-4 h-4" /> Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/history" className="flex items-center gap-2"><History className="w-4 h-4" /> History</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-500 cursor-pointer">
                  <LogOut className="w-4 h-4" /> Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Get Started CTA (landing only) */}
            {isLanding && (
              <Link href="/input">
                <Button className="hidden md:flex bg-[#6BAA75] hover:bg-[#5a9964] dark:bg-[#4CD964] dark:hover:bg-[#3bc454] dark:text-[#0A1F18] text-white rounded-full px-4">
                  Get Started
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={`md:hidden rounded-full ${isLanding && !scrolled ? "text-white hover:bg-white/10" : ""}`}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-background/95 backdrop-blur-md border-b border-border overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {navIcons[link.href]}
                  {link.label}
                </Link>
              ))}
              <Link href="/input" onClick={() => setMobileOpen(false)}>
                <Button className="w-full mt-2 bg-[#6BAA75] dark:bg-[#4CD964] text-white dark:text-[#0A1F18] rounded-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
