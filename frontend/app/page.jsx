'use client';

import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-7xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
        RK Cab
      </h1>
      <SignedOut>
        <SignInButton forceRedirectUrl="/book">
          <button className="px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xl font-bold hover:scale-105 transition-all shadow-2xl">
            Sign in to book a ride
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
        <Link href="/book">
          <button className="mt-6 px-10 py-5 bg-gradient-to-r from-green-500 to-teal-500 rounded-full text-xl font-bold hover:scale-105 transition-all shadow-2xl">
            Book a Ride Now
          </button>
        </Link>
      </SignedIn>
    </div>
  );
}