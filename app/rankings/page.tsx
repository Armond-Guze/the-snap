import { redirect } from 'next/navigation';

export const revalidate = 0;

interface RankingsRedirectPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function serializeSearchParams(params: Record<string, string | string[] | undefined>) {
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.length > 0) nextParams.append(key, item);
      }
      continue;
    }

    if (typeof value === 'string' && value.length > 0) {
      nextParams.set(key, value);
    }
  }

  return nextParams.toString();
}

export default async function RankingsRedirectPage(props: RankingsRedirectPageProps) {
  const searchParams = await props.searchParams;
  const query = serializeSearchParams(searchParams);
  redirect(query ? `/articles?${query}` : '/articles');
}
