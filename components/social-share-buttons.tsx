'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Facebook, Twitter, Linkedin, MessageCircle, Mail, Link2, Check } from 'lucide-react';

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
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  };

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {navigator.share && (
        <Button
          variant="outline"
          size="sm"
          onClick={shareNative}
          className="gap-2"
          title="Share"
        >
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
        <Facebook className="w-4 h-4" />
        <span className="hidden sm:inline">Facebook</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => shareVia('twitter')}
        className="gap-2 text-sky-500 hover:text-sky-600"
        title="Share on Twitter"
      >
        <Twitter className="w-4 h-4" />
        <span className="hidden sm:inline">Twitter</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => shareVia('linkedin')}
        className="gap-2 text-blue-700 hover:text-blue-800"
        title="Share on LinkedIn"
      >
        <Linkedin className="w-4 h-4" />
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
