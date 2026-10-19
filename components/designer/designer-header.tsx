export function DesignerHeader() {
  return (
    <header className="app-header">
      <div className="flex min-w-0 items-center gap-3.5">
        <div
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center border border-white/25 font-serif text-lg text-white"
        >
          V
        </div>
        <div className="min-w-0">
          <p className="break-words text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/55">
            Villegas Headstones &amp; Monuments LLC
          </p>
          <h1 className="break-words font-serif text-[1.28rem] leading-tight tracking-[0.02em] text-white">
            MonumentStudio
          </h1>
        </div>
      </div>

      <div className="hidden items-center gap-4 md:flex">
        <div className="text-right">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/65">
            Design workspace
          </p>
          <p className="mt-0.5 text-xs text-white/80">
            Monument Design &amp; Inscription
          </p>
        </div>
      </div>
    </header>
  );
}
