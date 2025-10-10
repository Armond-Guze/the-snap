#!/usr/bin/env node
import sanityClient from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config()

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || process.env.SANITY_STUDIO_API_VERSION || '2024-06-01'
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN

if (!projectId || !dataset) {
  console.error('Missing SANITY projectId/dataset in env')
  process.exit(1)
}
if (!token) {
  console.error('Missing SANITY write token (SANITY_WRITE_TOKEN). Aborting to avoid partial writes.')
  process.exit(1)
}

const client = sanityClient({ projectId, dataset, apiVersion, token, useCdn: false })

const TAGS = [
  { title: 'Monday Night Football', aliases: ['MNF', 'Monday Night'] },
  { title: 'Thursday Night Football', aliases: ['TNF', 'Thursday Night'] },
  { title: 'Sunday Night Football', aliases: ['SNF', 'Sunday Night'] },
]

async function ensureTag({ title, aliases }) {
  const existing = await client.fetch(`*[_type=="tag" && title==$title][0]{ _id, title }`, { title })
  if (existing?._id) {
    // Merge aliases
    const current = await client.fetch(`*[_type=="tag" && _id==$id][0]{ aliases }`, { id: existing._id })
    const merged = Array.from(new Set([...(current?.aliases||[]), ...aliases]))
    await client.patch(existing._id).set({ aliases: merged }).commit({ autoGenerateArrayKeys: true })
    console.log(`Updated tag: ${title}`)
    return existing._id
  }
  const doc = await client.create({ _type: 'tag', title, slug: { _type: 'slug', current: title.toLowerCase().replace(/\s+/g,'-') }, aliases })
  console.log(`Created tag: ${title}`)
  return doc._id
}

async function main() {
  for (const t of TAGS) {
    await ensureTag(t)
  }
  console.log('Primetime tags ensured.')
}

main().catch(err => { console.error(err); process.exit(1) })
