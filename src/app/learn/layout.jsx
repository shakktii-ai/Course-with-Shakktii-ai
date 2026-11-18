import React from 'react';
import { LearnerShell } from '@/components/layout/LearnerShell';

export const metadata = {
  title: 'Learner Workspace — AI Academy',
  description: 'AI-Native Learning Management System with adaptive AI tutor, verifiable certificates and interactive lessons',
};

export default function LearnerLayout({ children }) {
  return <LearnerShell>{children}</LearnerShell>;
}

