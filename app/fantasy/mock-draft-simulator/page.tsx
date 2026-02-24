import type { Metadata } from 'next'
import SimulatorClient from '@/app/fantasy/mock-draft-simulator/SimulatorClient'

export const metadata: Metadata = {
  title: 'Fantasy Mock Draft Simulator | The Snap',
  description:
    'Run a fantasy football mock draft simulation with configurable league settings, AI bot picks, and instant grade plus value insights.',
}

export default function FantasyMockDraftSimulatorPage() {
  return <SimulatorClient />
}
