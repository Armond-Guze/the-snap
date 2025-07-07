'use client';

import { useState } from 'react';
import { Share2, Twitter, Facebook, Linkedin, Link2, Check } from 'lucide-react';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'floating';
}

export default function SocialShare({ 
  url, 
  title, 
  description = '', 
  className = '',
  variant = 'default' 
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShare = (platform: keyof typeof shareUrls) => {
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Share2 className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-500 mr-2">Share:</span>
        <button
          onClick={() => handleShare('twitter')}
          className="p-1 text-gray-500 hover:text-white transition-colors"
          aria-label="Share on Twitter"
        >
          <Twitter className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleShare('facebook')}
          className="p-1 text-gray-500 hover:text-white transition-colors"
          aria-label="Share on Facebook"
        >
          <Facebook className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleShare('linkedin')}
          className="p-1 text-gray-500 hover:text-white transition-colors"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <div className={`fixed left-4 top-1/2 transform -translate-y-1/2 z-40 ${className}`}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 space-y-2">
          <button
            onClick={() => handleShare('twitter')}
            className="block p-2 text-gray-600 hover:text-black hover:bg-gray-50 rounded transition-colors"
            aria-label="Share on Twitter"
          >
            <Twitter className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleShare('facebook')}
            className="block p-2 text-gray-600 hover:text-black hover:bg-gray-50 rounded transition-colors"
            aria-label="Share on Facebook"
          >
            <Facebook className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleShare('linkedin')}
            className="block p-2 text-gray-600 hover:text-black hover:bg-gray-50 rounded transition-colors"
            aria-label="Share on LinkedIn"
          >
            <Linkedin className="h-5 w-5" />
          </button>
          <button
            onClick={handleCopyLink}
            className="block p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
            aria-label="Copy link"
          >
            {copied ? <Check className="h-5 w-5 text-green-500" /> : <Link2 className="h-5 w-5" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share this article
        </h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleShare('twitter')}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black border border-gray-300 rounded-lg transition-colors"
        >
          <Twitter className="h-4 w-4" />
          Twitter
        </button>
        
        <button
          onClick={() => handleShare('facebook')}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black border border-gray-300 rounded-lg transition-colors"
        >
          <Facebook className="h-4 w-4" />
          Facebook
        </button>
        
        <button
          onClick={() => handleShare('linkedin')}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-black border border-gray-300 rounded-lg transition-colors"
        >
          <Linkedin className="h-4 w-4" />
          LinkedIn
        </button>
        
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  );
}
