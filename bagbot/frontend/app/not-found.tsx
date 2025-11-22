export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0F0810] via-[#1A0E15] to-[#0F0810]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#F9D949] mb-4">404</h1>
        <p className="text-xl text-[#FFFBE7]/70 mb-8">Page not found</p>
        <a href="/" className="px-6 py-3 bg-[#F9D949] text-black rounded-lg hover:bg-[#FDE68A] transition-colors">
          Go Home
        </a>
      </div>
    </div>
  );
}
