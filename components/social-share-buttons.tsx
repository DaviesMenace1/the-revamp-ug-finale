'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, MessageCircle, Mail, Link2, Check } from '@/components/ui/luxury-icons';

interface SocialShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  className?: string;
}

export function SocialShareButtons({
  url,
  title,
  description = '',
  image = '',
  className = '',
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodeURL = (str: string) => encodeURIComponent(str);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURL(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURL(url)}&text=${encodeURL(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURL(url)}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURL(url)}&description=${encodeURL(title)}${image ? `&media=${encodeURL(image)}` : ''}`,
    whatsapp: `https://wa.me/?text=${encodeURL(`${title} ${url}`)}`,
    email: `mailto:?subject=${encodeURL(title)}&body=${encodeURL(description || title)}%0A%0A${encodeURL(url)}`,
  };

  const shareVia = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareNative = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: description, url });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  };

  const canShareNatively = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {canShareNatively && (
        <Button variant="outline" size="sm" onClick={shareNative} className="gap-2" title="Share">
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => shareVia('facebook')}
        className="gap-2 text-blue-600 hover:text-blue-700"
        title="Share on Facebook"
      >
        {/* Facebook icon */}
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
        </svg>
        <span className="hidden sm:inline">Facebook</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => shareVia('twitter')}
        className="gap-2 text-sky-500 hover:text-sky-600"
        title="Share on X (Twitter)"
      >
        {/* X / Twitter icon */}
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span className="hidden sm:inline">X</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => shareVia('linkedin')}
        className="gap-2 text-blue-700 hover:text-blue-800"
        title="Share on LinkedIn"
      >
        {/* LinkedIn icon */}
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
        <span className="hidden sm:inline">LinkedIn</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => shareVia('pinterest')}
        className="gap-2 text-red-600 hover:text-red-700"
        title="Share on Pinterest"
      >
        <span className="text-red-600">📌</span>
        <span className="hidden sm:inline">Pin</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => shareVia('whatsapp')}
        className="gap-2 text-green-600 hover:text-green-700"
        title="Share on WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">WhatsApp</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => shareVia('email')}
        className="gap-2"
        title="Share via Email"
      >
        <Mail className="w-4 h-4" />
        <span className="hidden sm:inline">Email</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={copyToClipboard}
        className="gap-2"
        title="Copy link"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            <span className="hidden sm:inline">Copied</span>
          </>
        ) : (
          <>
            <Link2 className="w-4 h-4" />
            <span className="hidden sm:inline">Copy</span>
          </>
        )}
      </Button>
    </div>
  );
}
