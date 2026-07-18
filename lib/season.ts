import { client as baseClient } from '@/sanity/lib/client'

export function getExpectedNFLSeason(now = new Date()): number {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  return month <= 1 ? year - 1 : year
}

export function getExpectedStandingsSeason(now = new Date()): number {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  return month <= 7 ? year - 1 : year
}

/**
 * Returns the most recent season present in teamRecord documents.
 * Falls back to the current year if none found.
 */
export async function getActiveSeason(): Promise<number> {
  try {
    const client = baseClient.withConfig({ useCdn: false })
    const season = await client.fetch<number | null>(
      '*[_type == "teamRecord" && defined(season)] | order(season desc)[0].season'
    )
    return typeof season === 'number' && Number.isFinite(season) ? season : getExpectedStandingsSeason()
  } catch {
    return getExpectedStandingsSeason()
  }
}

/**
 * Returns the newest published schedule season that is not in the future.
 * Before the next schedule is loaded, this intentionally keeps the most recent
 * complete schedule live instead of advertising an empty new-season page.
 */
export async function getScheduleSeason(): Promise<number> {
  const expectedSeason = getExpectedNFLSeason()

  try {
    const client = baseClient.withConfig({ useCdn: false })
    const rawSeasons = await client.fetch<Array<string | number>>(
      'array::unique(*[_type == "game" && published == true && defined(season)].season)'
    )
    const availableSeasons = rawSeasons
      .map((value) => Number(value))
      .filter(
        (value) =>
          Number.isInteger(value) && value >= 2000 && value <= expectedSeason
      )
      .sort((a, b) => b - a)

    return availableSeasons[0] ?? expectedSeason
  } catch {
    return expectedSeason
  }
}
