import { ClerkProvider, SignedIn, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'RK Cab',
  description: 'Book rides faster and safe',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased bg-cab-gradient text-white min-h-screen flex flex-col">
          <nav className="p-4 flex justify-between items-center bg-black/20 backdrop-blur-md border-b border-white/10">
            <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
              RK Cab
            </Link>
            <SignedIn>
              <div className="flex gap-6 items-center font-semibold">
                <Link href="/book" className="hover:text-pink-400 transition">Book Ride</Link>
                <Link href="/history" className="hover:text-pink-400 transition">History</Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </nav>
          <main className="flex-1">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}