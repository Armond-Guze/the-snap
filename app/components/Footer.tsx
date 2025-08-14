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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">
              Connect
            </h4>
            <div className="space-y-3">
              <a
                href="mailto:TheGameSnap@yahoo.com"
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <Mail size={16} />
                <span>Contact Us</span>
              </a>
              <a
                href="https://www.instagram.com/thegamesnap"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <Instagram size={16} />
                <span>Instagram</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="text-xs text-gray-500">
              &copy; {currentYear} The Game Snap. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <Link href="/privacypolicy" className="hover:text-gray-400 transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/contact" className="hover:text-gray-400 transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
