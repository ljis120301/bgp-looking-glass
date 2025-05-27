"use client";

export default function Header() {
  return (
    <header className="flex items-center justify-between p-3 bg-gray-800/50 border-b border-gray-700">
      <div className="flex items-center gap-2">
        <h1 className="text-base font-semibold text-blue-400">BGP Looking Glass</h1>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-300">beta</span>
      </div>
      <div className="flex items-center gap-4">
        <a href="/" className="text-sm text-gray-300 hover:text-blue-400 transition-colors">Home</a>
        <a href="/about" className="text-sm text-gray-300 hover:text-blue-400 transition-colors">About</a>
      </div>
    </header>
  );
} 