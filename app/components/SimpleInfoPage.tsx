import type { ReactNode } from "react";

export function SimplePageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_42%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-24">
          <header className="max-w-3xl">
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              {title}
            </h1>
            {intro ? (
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/68 sm:text-lg">
                {intro}
              </p>
            ) : null}
          </header>

          <main className="mt-12 space-y-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function SimpleSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.8rem]">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[15px] leading-7 text-white/68 sm:text-base">
        {children}
      </div>
    </section>
  );
}

export function SimpleCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.025] p-6">
      <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-white/62">{body}</p>
    </div>
  );
}

export function SimpleList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/70" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
