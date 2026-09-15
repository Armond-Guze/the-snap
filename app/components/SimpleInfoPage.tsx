import type { ReactNode } from "react";
import "./information-pages.css";

export function SimplePageShell({ eyebrow, title, intro, children }: {
  eyebrow?: string; title: string; intro?: string; children: ReactNode;
}) {
  return (
    <div className="snap-info-page">
      <div className="snap-info-container">
        <header className="snap-info-header">
          {eyebrow ? <p className="snap-info-eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {intro ? <p className="snap-info-intro">{intro}</p> : null}
        </header>
        <main className="snap-info-content">{children}</main>
      </div>
    </div>
  );
}

export function SimpleSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="snap-info-section"><h2>{title}</h2><div className="snap-info-section-body">{children}</div></section>;
}

export function SimpleCard({ title, body }: { title: string; body: string }) {
  return <div className="snap-info-card"><h3>{title}</h3><p>{body}</p></div>;
}

export function SimpleList({ items }: { items: string[] }) {
  return <ul className="snap-info-list">{items.map(item => <li key={item}>{item}</li>)}</ul>;
}
