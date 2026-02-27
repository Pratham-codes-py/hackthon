import Link from "next/link";
import { Leaf, Twitter, Github, Instagram, Linkedin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  return (
    <footer className="bg-[#0B3B2A] dark:bg-[#0A1F18] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#6BAA75] flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">EcoTrack <span className="text-[#4CD964]">AI</span></span>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed mb-6">
              Your personal AI carbon coach. Helping you measure, plan, and reduce your environmental impact — one action at a time.
            </p>
            <div className="flex items-center gap-3">
              {[Twitter, Github, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#6BAA75] flex items-center justify-center transition-colors duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-white/40 mb-4">Product</h4>
            <ul className="space-y-2.5">
              {["Dashboard", "AI Suggestions", "Simulation Lab", "Gamification", "History"].map((item) => (
                <li key={item}>
                  <Link href={`/${item.toLowerCase().replace(/ /g, "-")}`} className="text-sm text-white/60 hover:text-[#4CD964] transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-white/40 mb-4">Company</h4>
            <ul className="space-y-2.5">
              {["About Us", "Blog", "Press", "Careers", "Contact"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-white/60 hover:text-[#4CD964] transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-white/40 mb-4">Stay Green</h4>
            <p className="text-sm text-white/60 mb-4">Get weekly eco tips and sustainability insights.</p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#6BAA75] h-9 text-sm"
              />
              <Button size="sm" className="bg-[#6BAA75] hover:bg-[#5a9964] text-white px-3">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">© 2026 EcoTrack AI. All rights reserved. Built for a greener future.</p>
          <div className="flex items-center gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
              <a key={item} href="#" className="text-xs text-white/40 hover:text-white/70 transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
