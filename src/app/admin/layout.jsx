import React from 'react';
import { AdminShell } from '@/components/layout/AdminShell';

export const metadata = {
  title: 'Organization Studio & LMS Administration — AI Academy',
  description: 'Enterprise Course Studio, AI Video Studio, Curriculum, Assessments, and Member Management',
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}

