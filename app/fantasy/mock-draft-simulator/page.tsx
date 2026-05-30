import type { Metadata } from 'next'
import SimulatorClient from '@/app/fantasy/mock-draft-simulator/SimulatorClient'
import { buildPageMetadata } from '@/lib/page-metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Fantasy Mock Draft Simulator | The Snap',
  description:
    'Run a fantasy football mock draft simulation with configurable league settings, AI bot picks, and instant grade plus value insights.',
  path: '/fantasy/mock-draft-simulator',
})

export default function FantasyMockDraftSimulatorPage() {
  return <SimulatorClient />
}
