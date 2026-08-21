import type { Metadata } from 'next';
import '../styles/globals.css';
import { ThemeProvider } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'Orkestra — Enterprise Autonomous Workflow Orchestration',
  description: 'An intelligent enterprise operating system where humans direct complex production workflows while autonomous AI agents orchestrate execution.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased selection:bg-accent selection:text-white">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
