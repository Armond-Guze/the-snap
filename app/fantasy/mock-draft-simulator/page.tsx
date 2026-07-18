import type { Metadata } from 'next'
import SimulatorClient from '@/app/fantasy/mock-draft-simulator/SimulatorClient'
import { SITE_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Fantasy Mock Draft Simulator | The Snap',
  description:
    'Run a fantasy football mock draft simulation with configurable league settings, AI bot picks, and instant grade plus value insights.',
  alternates: { canonical: `${SITE_URL}/fantasy/mock-draft-simulator` },
  openGraph: {
    title: 'Fantasy Mock Draft Simulator | The Snap',
    description: 'Run a configurable fantasy football mock draft with AI bot picks, instant grades and value insights.',
    url: `${SITE_URL}/fantasy/mock-draft-simulator`,
    type: 'website',
  },
}

export default function FantasyMockDraftSimulatorPage() {
  return <SimulatorClient />
}
