'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `\app\studio\[[...tool]]\page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './sanity/env'
import {schemaTypes} from './sanity/schemaTypes'
import {structure} from './sanity/structure'
import {biggerContentTextPlugin} from './sanity/plugins/biggerContentText'
import { createRankingsSnapshotAction } from './sanity/plugins/rankingsSnapshotAction'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema: {
    types: schemaTypes,
  },
  document: {
    actions(prev, context) {
      if (context.schemaType === 'rankings') {
        return [...prev, createRankingsSnapshotAction]
      }
      return prev
    },
  },
  plugins: [
    structureTool({structure}),
    biggerContentTextPlugin(),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
  ],
})
