import { Toaster } from 'sonner';
import Navbar from '@/components/store/Navbar';
import MobileNav from '@/components/store/MobileNav';
import Footer from '@/components/store/Footer';
import WhatsAppButton from '@/components/store/WhatsAppButton';
import AnnouncementBar from '@/components/store/AnnouncementBar';
import CookieConsent from '@/components/store/CookieConsent';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="store-bg min-h-screen flex flex-col">
            <AnnouncementBar />
            <Navbar />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <Footer />
            <MobileNav />
            <WhatsAppButton />
            <CookieConsent />
            <Toaster position="top-center" richColors />
        </div>
    );
}
