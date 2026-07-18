import Link from 'next/link';

export default function Header() {
  return (
    <nav aria-label="Primary">
    <ul className="flex space-x-4">
        <li>
            <Link href="/" className="text-sm px-2 py-1">Home</Link>
        </li>
        <li>
            <Link href="/headlines" className="text-sm px-2 py-1">News</Link>
        </li>
        <li>
            <Link href="/articles" className="text-sm px-2 py-1">Articles</Link>
        </li>
    </ul>
    </nav>
  );
}
