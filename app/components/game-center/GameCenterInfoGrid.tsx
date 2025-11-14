interface Info {
  label: string;
  value: string;
}

interface Props {
  items: Info[];
}

export function GameCenterInfoGrid({ items }: Props) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-base font-medium text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
