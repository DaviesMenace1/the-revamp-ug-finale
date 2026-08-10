'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface NewsletterSignupProps {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  className?: string;
}

export function NewsletterSignup({
  title = 'Stay Updated',
  subtitle = 'Get the latest design trends and inspiration delivered to your inbox',
  placeholder = 'Enter your email',
  buttonText = 'Subscribe',
  className = '',
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      // Safely parse JSON response only if returned by server
      const contentType = response.headers.get('content-type');
      let data: { error?: string; message?: string } | null = null;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(
          data?.error || `Server error (${response.status}). Please try again later.`
        );
      }

      setStatus('success');
      setMessage(data?.message || 'Thank you for subscribing!');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error ? error.message : 'Something went wrong'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className={`w-full py-12 ${className}`}>
      <div className="mx-auto max-w-md text-center">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            placeholder={placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          />
          <Button
            type="submit"
            disabled={isLoading || !email}
            className="w-full"
          >
            {isLoading ? 'Subscribing...' : buttonText}
          </Button>
        </form>

        {status === 'success' && (
          <p className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {message}
          </p>
        )}
        {status === 'error' && (
          <p className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-400">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
