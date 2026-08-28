'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { LoadingState } from '@/components/PageState';
import { isAuthed, onAuthLost } from '@/lib/api';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthed()) {
      router.replace('/login');
      return;
    }
    setChecked(true);

    return onAuthLost(() => {
      router.replace('/login');
    });
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <LoadingState label="Verifying security session…" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        {/* Pass mobile toggle handler via event or React context if needed; also attach a global event listener */}
        <div
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('button[aria-label="Open navigation menu"]')) {
              setMobileSidebarOpen(true);
            }
          }}
          className="flex-1 flex flex-col min-w-0 w-full"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
