"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Instagram } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: "About", href: "/about" },
    { label: "Headlines", href: "/headlines" },
    { label: "Power Rankings", href: "/power-rankings" },
    { label: "NFL Standings", href: "/standings" },
  ];

  return (
    <footer className="bg-black border-t border-gray-800 py-12 text-gray-200">
      <div className="max-w-7xl mx-auto px-6">
  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Image
                src="/images/logo--design copy.png"
                alt="The Game Snap Logo"
                width={56}
                height={56}
                className="h-12 w-auto"
              />
              <h3 className="text-xl font-bold text-white">
                The Game Snap
              </h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your premier destination for NFL insights, power rankings, and breaking news.
            </p>
          </div>

          {/* Site Sections */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Sections</h4>
            <ul className="space-y-2">
              {quickLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Connect</h4>
            <div className="space-y-3">
              <a
                href="mailto:TheGameSnap@yahoo.com"
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm"
                aria-label="Email The Game Snap"
              >
                <Mail size={16} />
                <span>Contact Us</span>
              </a>
              <a
                href="https://www.instagram.com/thegamesnap"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm"
                aria-label="Visit The Game Snap on Instagram"
              >
                <Instagram size={16} />
                <span>Instagram</span>
              </a>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacypolicy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="text-xs text-gray-500">
              &copy; {currentYear} The Game Snap. All rights reserved.
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <Link href="/privacypolicy" className="hover:text-gray-400 transition-colors">Privacy</Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
              <span>•</span>
              <Link href="/contact" className="hover:text-gray-400 transition-colors">Contact</Link>
              <span className="hidden sm:inline">•</span>
              <span className="text-gray-600">Not affiliated with the NFL.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
