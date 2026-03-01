'use client';

import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/Sidebar';
import { Toaster } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/admin/login';

    if (isLoginPage) {
        return (
            <>
                {children}
                <Toaster position="top-right" richColors />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <AdminSidebar />
            <main className="lg:ml-60 min-h-screen">
                <div className="p-4 md:p-6 lg:p-8 pt-14 lg:pt-8">
                    {children}
                </div>
            </main>
            <Toaster position="top-right" richColors />
        </div>
    );
}
