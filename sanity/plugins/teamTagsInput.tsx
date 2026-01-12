import {useCallback, useState} from 'react'
import {ArrayOfObjectsInputProps, ReferenceValue, set, useClient} from 'sanity'
import {Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {apiVersion} from '../env'

// Convenience control for the Articles "teams" field: one-click select all 32 teams
const TEAM_TITLES = [
  'Arizona Cardinals',
  'Atlanta Falcons',
  'Baltimore Ravens',
  'Buffalo Bills',
  'Carolina Panthers',
  'Chicago Bears',
  'Cincinnati Bengals',
  'Cleveland Browns',
  'Dallas Cowboys',
  'Denver Broncos',
  'Detroit Lions',
  'Green Bay Packers',
  'Houston Texans',
  'Indianapolis Colts',
  'Jacksonville Jaguars',
  'Kansas City Chiefs',
  'Las Vegas Raiders',
  'Los Angeles Chargers',
  'Los Angeles Rams',
  'Miami Dolphins',
  'Minnesota Vikings',
  'New England Patriots',
  'New Orleans Saints',
  'New York Giants',
  'New York Jets',
  'Philadelphia Eagles',
  'Pittsburgh Steelers',
  'San Francisco 49ers',
  'Seattle Seahawks',
  'Tampa Bay Buccaneers',
  'Tennessee Titans',
  'Washington Commanders',
]

type TeamTagDoc = {
  _id: string
  title: string
}

export function TeamTagsInput(props: ArrayOfObjectsInputProps<ReferenceValue>) {
  const client = useClient({apiVersion})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTeamRefs = useCallback(async () => {
    const docs = await client.fetch<TeamTagDoc[]>(
      '*[_type == "tag" && title in $teamTitles]{_id, title} | order(title asc)',
      {teamTitles: TEAM_TITLES},
    )
    const refs = docs.map((doc) => ({_type: 'reference', _ref: doc._id}))
    const missing = TEAM_TITLES.filter((name) => !docs.some((doc) => doc.title === name))
    return {refs, missing}
  }, [client])

  const handleSelectAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const {refs, missing} = await fetchTeamRefs()
      props.onChange(set(refs))
      if (missing.length) {
        setError(`Missing team tags in CMS: ${missing.join(', ')}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load team tags'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [fetchTeamRefs, props])

  const handleClear = useCallback(() => {
    props.onChange(set([]))
  }, [props])

  return (
    <Stack space={3}>
      <Card padding={3} radius={2} shadow={1} tone="primary" border>
        <Flex gap={2} wrap="wrap" align="center">
          <Button
            text="Select all 32 teams"
            tone="primary"
            onClick={handleSelectAll}
            loading={loading}
          />
          <Button text="Clear teams" tone="caution" onClick={handleClear} disabled={loading} />
          {error ? (
            <Text size={1} tone="critical" style={{whiteSpace: 'pre-wrap'}}>
              {error}
            </Text>
          ) : null}
        </Flex>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  )
}

export default TeamTagsInput
