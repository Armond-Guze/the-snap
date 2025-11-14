export default function LoadingGameCenter() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 lg:px-0">
      <div className="h-56 animate-pulse rounded-3xl bg-slate-800/60" />
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="h-32 animate-pulse rounded-2xl bg-slate-800/40" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-800/40" />
      </div>
    </div>
  );
}
