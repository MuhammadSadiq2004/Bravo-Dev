import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl p-12 max-w-4xl w-full flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />

        {/* Left Side: Text */}
        <div className="flex-1 z-10 text-center md:text-left">
          <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-sm font-medium mb-6 border border-white/10">
            ✨ AI-Powered Captions
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Connect with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Clarity
            </span>
          </h1>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            Experience seamless video calls with real-time AI transcription.
            Break language barriers and never miss a word.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link
              href="/invite"
              className="bg-white text-black px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-200 transition shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
            >
              Start a Call
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Right Side: Visual/Abstract */}
        <div className="flex-1 w-full max-w-sm z-10">
          <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 p-1 shadow-2xl rotate-3 hover:rotate-0 transition duration-500">
            <div className="w-full h-full bg-black/40 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-white/20 rounded w-24 mx-auto"></div>
                  <div className="h-2 bg-white/10 rounded w-32 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
