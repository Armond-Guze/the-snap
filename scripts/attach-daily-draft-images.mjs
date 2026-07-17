#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN

if (!projectId || !dataset || !token) throw new Error('Missing Sanity project, dataset, or write token.')

const manifestPath = process.argv[2]
if (!manifestPath) throw new Error('Usage: node scripts/attach-daily-draft-images.mjs <manifest.json>')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const client = createClient({ projectId, dataset, token, apiVersion: '2024-06-01', useCdn: false })

for (const item of manifest) {
  if (!item.documentId.startsWith('drafts.')) throw new Error(`Refusing non-draft document ID: ${item.documentId}`)
  const document = await client.fetch('*[_id == $id][0]{_id,published,title}', { id: item.documentId })
  if (!document || document.published !== false) throw new Error(`Refusing image update for missing/published document: ${item.documentId}`)

  const imagePath = path.resolve(item.imagePath)
  const asset = await client.assets.upload('image', fs.createReadStream(imagePath), {
    filename: path.basename(imagePath),
    title: item.title,
  })

  await client.patch(item.documentId).set({
    coverImage: {
      _type: 'image',
      asset: { _type: 'reference', _ref: asset._id },
      alt: item.alt,
      caption: item.caption,
      credit: 'AI-generated editorial illustration by The Snap',
    },
  }).commit()
  console.log(`Attached ${asset._id} to ${item.documentId}`)
}
