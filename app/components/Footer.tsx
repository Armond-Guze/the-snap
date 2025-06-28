"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Instagram, ExternalLink } from "lucide-react";
import NewsletterSignup from "./NewsletterSignup";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: "About", href: "/about" },
    { label: "Headlines", href: "/headlines" },
    { label: "Power Rankings", href: "/power-rankings" },
    { label: "NFL Standings", href: "/standings" },
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: "/privacypolicy" },
    { label: "Contact Us", href: "/contact" },
  ];

  return (
    <footer className="bg-black border-t border-gray-800 py-16 text-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <Image
                src="/images/the-snap-logo.png"
                alt="The Game Snap Logo"
                width={48}
                height={48}
                className="h-12 w-auto"
              />
              <h3 className="text-2xl font-bold text-white">
                The Game Snap
              </h3>
            </div>
            <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
              Your premier destination for NFL insights, power rankings, and breaking news. 
              Stay ahead of the game with expert analysis and comprehensive coverage.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="mailto:TheGameSnap@yahoo.com"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors group"
              >
                <Mail size={18} className="group-hover:scale-110 transition-transform" />
                <span className="text-sm">TheGameSnap@yahoo.com</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-gray-300 hover:text-white transition-colors text-sm font-medium group flex items-center"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      {label}
                    </span>
                    <ExternalLink size={12} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Section */}
          <div>
            <NewsletterSignup variant="footer" />
          </div>

          {/* Legal & Social */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">
              Connect & Legal
            </h4>
            <div className="space-y-6">
              {/* Social Links */}
              <div>
                <h5 className="text-sm font-medium text-gray-200 mb-3">Follow Us</h5>
                <a
                  href="https://www.instagram.com/thegamesnap"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-gray-300 hover:text-white transition-colors group"
                >
                  <Instagram size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Instagram</span>
                </a>
              </div>

              {/* Legal Links */}
              <div>
                <h5 className="text-sm font-medium text-gray-200 mb-3">Legal</h5>
                <ul className="space-y-2">
                  {legalLinks.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-gray-300 hover:text-white transition-colors text-sm"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-400">
              &copy; {currentYear} The Game Snap. All rights reserved.
            </div>
            <div className="text-sm text-gray-400">
              Made with ⚡ for NFL fans everywhere
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
