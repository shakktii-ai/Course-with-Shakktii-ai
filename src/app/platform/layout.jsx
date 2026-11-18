import React from 'react';
import { PlatformShell } from '@/components/layout/PlatformShell';

export const metadata = {
  title: 'Platform Super Admin Console — AI Academy',
  description: 'Global SaaS tenant management, metrics, audit logs, and security administration',
};

export default function PlatformLayout({ children }) {
  return <PlatformShell>{children}</PlatformShell>;
}

