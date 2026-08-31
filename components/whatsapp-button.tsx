'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle } from '@/components/ui/luxury-icons';
import { useCallback } from 'react';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  type?: 'product' | 'service' | 'inquiry' | 'custom';
  productName?: string;
  serviceName?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
}

export function WhatsAppButton({
  phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '256',
  message,
  type = 'inquiry',
  productName,
  serviceName,
  className = '',
  variant = 'default',
  size = 'default',
  children,
}: WhatsAppButtonProps) {
  // Generate default message based on type if not provided
  const defaultMessages: Record<string, string> = {
    product: `Hi Revamp UG! I'm interested in ${productName || 'this product'} - can we discuss pricing and customization options?`,
    service: `Hello! I'd like to book a consultation for ${serviceName || 'your services'}. When are you available?`,
    inquiry: "Hi Revamp UG! I'm interested in learning more about your services. Can we chat?",
    custom: 'Hello! I have a question about your offerings.',
  };

  const finalMessage = message || defaultMessages[type];

  const openWhatsApp = useCallback(() => {
    // Clean phone number (remove +, spaces, dashes)
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

    // Ensure it's in international format (starts with country code)
    const fullNumber = cleanNumber.startsWith('256') ? cleanNumber : `256${cleanNumber.slice(-9)}`;

    // Detect if mobile
    const isMobile =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());

    const whatsappUrl = isMobile
      ? `https://wa.me/${fullNumber}?text=${encodeURIComponent(finalMessage)}`
      : `https://web.whatsapp.com/send?phone=${fullNumber}&text=${encodeURIComponent(finalMessage)}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }, [phoneNumber, finalMessage]);

  return (
    <Button
      onClick={openWhatsApp}
      variant={variant}
      size={size}
      className={`gap-2 bg-green-600 hover:bg-green-700 text-white ${className}`}
      title={`Chat on WhatsApp: ${finalMessage}`}
    >
      <MessageCircle className="w-4 h-4" />
      {children || 'Message on WhatsApp'}
    </Button>
  );
}

/**
 * Hook for WhatsApp functionality
 * Usage: const openWhatsApp = useWhatsApp();
 * Then: openWhatsApp('product', 'Mahogany Dining Table');
 */
export function useWhatsApp(phoneNumber?: string) {
  const cleanPhoneNumber = phoneNumber || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '256';

  return useCallback(
    (type: 'product' | 'service' | 'inquiry', name?: string) => {
      const messages: Record<string, string> = {
        product: `Hi Revamp UG! I'm interested in ${name || 'this product'} - can we discuss pricing and customization options?`,
        service: `Hello! I'd like to book a consultation for ${name || 'your services'}. When are you available?`,
        inquiry: `Hi Revamp UG! I'm interested in learning more about your services. Can we chat?`,
      };

      const message = messages[type];
      const cleanNumber = cleanPhoneNumber.replace(/[^0-9]/g, '');
      const fullNumber = cleanNumber.startsWith('256') ? cleanNumber : `256${cleanNumber.slice(-9)}`;

      const isMobile =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          navigator.userAgent.toLowerCase()
        );

      const whatsappUrl = isMobile
        ? `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`
        : `https://web.whatsapp.com/send?phone=${fullNumber}&text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    },
    [cleanPhoneNumber]
  );
}
