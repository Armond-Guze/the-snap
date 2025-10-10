import { client as baseClient } from '@/sanity/lib/client'

/**
 * Returns the most recent season present in teamRecord documents.
 * Falls back to the current year if none found.
 */
export async function getActiveSeason(): Promise<number> {
  try {
    const client = baseClient.withConfig({ useCdn: false })
    const season = await client.fetch<number | null>(
      'coalesce(max(*[_type=="teamRecord"].season), null)'
    )
    return typeof season === 'number' && Number.isFinite(season) ? season : new Date().getFullYear()
  } catch {
    return new Date().getFullYear()
  }
}
