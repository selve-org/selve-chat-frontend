export default function LoadingScreen() {
  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-[#0c0c0b] text-white">
      {/* Atmospheric glows */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-gradient-to-br from-amber-500/25 via-red-500/15 to-transparent blur-3xl" />
        <div className="absolute -right-16 top-10 h-72 w-72 rounded-full bg-gradient-to-bl from-emerald-400/20 via-cyan-400/10 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-gradient-to-tl from-white/8 via-white/0 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center rounded-2xl border border-white/5 bg-white/5 px-10 py-9 shadow-2xl backdrop-blur-md">
        <div className="mb-6 flex items-center gap-3 text-sm uppercase tracking-[0.35em] text-white/70">
          <span className="h-px w-10 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          Selve
          <span className="h-px w-10 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>

        <div className="relative mb-6 h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-amber-400/80 border-l-red-400/60" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/10 via-white/5 to-white/0" />
          <div className="absolute inset-4 rounded-full bg-[#0c0c0b]" />
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold text-white">Warming up your space</p>
          <p className="mt-2 text-sm text-white/70">Fetching your conversations and getting ready to chat.</p>
        </div>
      </div>
    </div>
  )
}
