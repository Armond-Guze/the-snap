import { NextRequest, NextResponse } from 'next/server'
import { client as publicClient } from '@/sanity/lib/client'
import { createClient } from '@sanity/client'

const token = process.env.SANITY_WRITE_TOKEN
const writeClient = token
  ? createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-05-03',
      token,
      useCdn: false,
      perspective: 'published',
    })
  : null

// Optional email-service sync (Beehiiv). Sanity stays the backup record of subscribers.
const BEEHIIV_API_KEY = process.env.BEEHIIV_API_KEY
const BEEHIIV_PUBLICATION_ID = process.env.BEEHIIV_PUBLICATION_ID

async function syncToBeehiiv(email: string, source: string) {
  if (!BEEHIIV_API_KEY || !BEEHIIV_PUBLICATION_ID) return
  try {
    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${BEEHIIV_PUBLICATION_ID}/subscriptions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${BEEHIIV_API_KEY}`,
        },
        body: JSON.stringify({
          email,
          reactivate_existing: false,
          send_welcome_email: true,
          utm_source: source,
        }),
      }
    )
    if (!res.ok) console.error('Beehiiv sync failed', res.status, await res.text().catch(() => ''))
  } catch (e) {
    console.error('Beehiiv sync error', e)
  }
}

// Ephemeral (non-persistent) fallback storage for when no token set
const volatileCache = new Set<string>()

export async function POST(req: NextRequest) {
  try {
    const { email, source: rawSource } = await req.json()
    const source = typeof rawSource === 'string' && /^[a-z0-9_-]{1,40}$/i.test(rawSource) ? rawSource : 'site'
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }
    const normalized = email.trim().toLowerCase()
    if (!/^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(normalized)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (writeClient) {
      const existing = await publicClient.fetch(
        `*[_type == "newsletterSubscriber" && email == $email][0]{_id}`,
        { email: normalized }
      )
      if (existing?._id) {
        await syncToBeehiiv(normalized, source)
        return NextResponse.json({ success: true, message: 'Already subscribed' })
      }
      await writeClient.create({
        _type: 'newsletterSubscriber',
        email: normalized,
        source,
        createdAt: new Date().toISOString(),
      })
      await syncToBeehiiv(normalized, source)
      return NextResponse.json({ success: true, message: 'Subscribed successfully' })
    }

    if (volatileCache.has(normalized)) {
      return NextResponse.json({ success: true, message: 'Already subscribed (session)' })
    }
    volatileCache.add(normalized)
    return NextResponse.json({
      success: true,
      message: 'Subscribed!',
      ephemeral: true,
      note: 'Add SANITY_WRITE_TOKEN to persist subscribers.'
    })
  } catch (e) {
    console.error('Newsletter subscribe error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST an { email } JSON body to subscribe',
    persistence: writeClient ? 'sanity' : 'ephemeral (set SANITY_WRITE_TOKEN to persist)',
  })
}
