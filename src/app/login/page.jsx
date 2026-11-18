'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { BookOpen, ShieldCheck, Eye, EyeOff, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('TENANT');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const qEmail = searchParams?.get('email');
    if (qEmail) {
      setEmail(qEmail);
      setPassword('Password123!');
      if (qEmail.includes('superadmin')) {
        setUserType('PLATFORM');
      } else {
        setUserType('TENANT');
      }
    }
  }, [searchParams]);

  const executeLogin = async (loginEmail, loginPass, loginType) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass, userType: loginType }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Login failed. Please check your credentials.');
        return;
      }

      const user = data.data?.user;
      if (loginType === 'PLATFORM' || user?.role === 'SUPER_ADMIN') {
        router.push('/platform/dashboard');
      } else if (
        user?.roles?.includes('ORG_ADMIN') ||
        user?.roles?.includes('INSTRUCTOR')
      ) {
        router.push('/admin/dashboard');
      } else {
        router.push('/learn/dashboard');
      }
    } catch {
      setErrorMessage('Network connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }
    executeLogin(email, password, userType);
  };

  const handleQuickLogin = (quickEmail, quickType) => {
    setEmail(quickEmail);
    setPassword('Password123!');
    setUserType(quickType);
    executeLogin(quickEmail, 'Password123!', quickType);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-bold text-2xl text-slate-900 tracking-tight">AI Academy</span>
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to your account</h2>
        <p className="text-sm text-slate-500 mt-1">Enterprise AI-native learning ecosystem</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <Card className="shadow-md">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Quick Demo Login Launchpad */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> 1-Click Demo Login:
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Password123!</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('student@acme.edu', 'TENANT')}
                  disabled={isLoading}
                  className="px-3 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors text-left flex flex-col shadow-xs"
                >
                  <span className="font-bold text-xs flex items-center justify-between">
                    <span>Autonomous Student</span>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                  </span>
                  <span className="text-[10px] text-emerald-100 truncate">student@acme.edu</span>
                  <span className="text-[9px] text-emerald-200/90 font-mono mt-0.5">Uploads & Auto-Generates</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@acme.edu', 'TENANT')}
                  disabled={isLoading}
                  className="px-3 py-2.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-900 font-medium hover:bg-slate-200 transition-colors text-left flex flex-col"
                >
                  <span className="font-bold text-xs text-slate-800">Organization Admin</span>
                  <span className="text-[10px] text-slate-500 truncate">admin@acme.edu</span>
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5">Academy Management</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('superadmin@aiacademy.local', 'PLATFORM')}
                  disabled={isLoading}
                  className="px-3 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors text-left flex flex-col"
                >
                  <span className="font-bold text-xs text-emerald-400">Super Admin</span>
                  <span className="text-[10px] text-slate-400 truncate">superadmin@aiacademy.local</span>
                  <span className="text-[9px] text-slate-500 font-mono mt-0.5">Global Multi-Tenant</span>
                </button>
              </div>
            </div>

            {/* Account Scope Toggle */}
            <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setUserType('TENANT')}
                className={`flex-1 py-1.5 rounded-md transition-all ${
                  userType === 'TENANT'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Learner / Organization
              </button>
              <button
                type="button"
                onClick={() => setUserType('PLATFORM')}
                className={`flex-1 py-1.5 rounded-md transition-all ${
                  userType === 'PLATFORM'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Platform Super Admin
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="flex-1 font-medium leading-relaxed">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" required>
                  Work Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="password" required className="mb-0">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                  Sign In
                </Button>
              </div>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Don&apos;t have an account yet?{' '}
                <Link
                  href="/register"
                  className="text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
