'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-cyan-400 mb-8">BagBot 2.0</h1>
        <p className="text-xl text-gray-400 mb-12">Quantum Trading Intelligence</p>
        <Link href="/dashboard" className="px-8 py-4 bg-cyan-500 text-black rounded-lg text-lg font-bold hover:bg-cyan-400 transition-all">
          Enter Dashboard →
        </Link>
      </div>
    </div>
  );
}
