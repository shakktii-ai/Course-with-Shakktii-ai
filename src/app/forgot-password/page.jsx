'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { BookOpen, ArrowLeft, MailCheck, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Unable to process password reset request.');
        return;
      }

      setMessage(data.message);
      if (data.data?.resetToken) {
        setResetToken(data.data.resetToken);
      }
    } catch (err) {
      setErrorMessage('Network connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-bold text-2xl text-slate-900 tracking-tight">AI Academy</span>
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reset your password</h2>
        <p className="text-sm text-slate-500 mt-1">
          Enter your registered email and we will issue a secure reset link
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-md">
          <CardContent className="p-6 sm:p-8">
            {errorMessage && (
              <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="flex-1 font-medium">{errorMessage}</p>
              </div>
            )}

            {message ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MailCheck className="w-6 h-6" />
                </div>
                <h4 className="text-base font-semibold text-slate-900 mb-2">Instructions Sent</h4>
                <p className="text-xs text-slate-600 mb-6 leading-relaxed">{message}</p>

                {resetToken && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-6 text-left">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Active Reset Token:
                    </p>
                    <p className="font-mono text-xs text-slate-800 break-all">{resetToken}</p>
                    <div className="mt-3">
                      <Link href={`/reset-password?token=${resetToken}`}>
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          Proceed to Reset Password Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                <Link href="/login" className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 font-medium">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" required>Registered Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                    Send Reset Link
                  </Button>
                </div>

                <div className="pt-4 text-center">
                  <Link href="/login" className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 font-medium">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

