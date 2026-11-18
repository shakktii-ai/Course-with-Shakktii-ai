import './globals.css';

export const metadata = {
  title: 'AI Academy — Enterprise AI-Native Learning Management Platform',
  description: 'Scalable multi-tenant LMS with source-grounded AI course generation, AI video studio, assessments, and verifiable certifications.',
  keywords: ['AI LMS', 'Learning Management System', 'Enterprise Training', 'AI Course Generator'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900"
      >
        {children}
      </body>
    </html>
  );
}

