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

// Ephemeral (non-persistent) fallback storage for when no token set
const volatileCache = new Set<string>()

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
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
        return NextResponse.json({ success: true, message: 'Already subscribed' })
      }
      await writeClient.create({
        _type: 'newsletterSubscriber',
        email: normalized,
        source: 'site',
        createdAt: new Date().toISOString(),
      })
      return NextResponse.json({ success: true, message: 'Subscribed successfully' })
    }

    if (volatileCache.has(normalized)) {
      return NextResponse.json({ success: true, message: 'Already subscribed (session)' })
    }
    volatileCache.add(normalized)
    return NextResponse.json({
      success: true,
      message: 'Subscribed (temporary). Add SANITY_WRITE_TOKEN to persist.',
      note: 'Set SANITY_WRITE_TOKEN env var and redeploy to store subscribers.'
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
