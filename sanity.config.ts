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
import { createRankingsSnapshotAction, publishAndSnapshotAction } from './sanity/plugins/rankingsSnapshotAction'
import { migrateTeamCategoryToTagAction } from './sanity/plugins/migrateTeamCategoriesToTags'
import snapshotFromLivePowerRankingsAction from './sanity/plugins/snapshotFromLiveAction'
import duplicatePowerRankingWeekAction from './sanity/plugins/duplicatePowerRankingWeek'
import powerRankingHelpersAction from './sanity/plugins/powerRankingHelpersAction'
import suggestPrimetimeTagAction from './sanity/plugins/suggestPrimetimeTag'
import seoRegenerateAction from './sanity/plugins/seoRegenerateAction'

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
      let actions = [...prev]

      if (context.schemaType === 'rankings') {
        actions = [...actions, createRankingsSnapshotAction, publishAndSnapshotAction]
      }
      if (context.schemaType === 'article') {
        actions = [...actions, snapshotFromLivePowerRankingsAction, duplicatePowerRankingWeekAction, powerRankingHelpersAction]
      }
      if (context.schemaType === 'headline') {
        actions = [...actions, suggestPrimetimeTagAction]
      }
      if (context.schemaType === 'category') {
        actions = [...actions, migrateTeamCategoryToTagAction]
      }
      if (['headline', 'rankings', 'category'].includes(context.schemaType)) {
        actions = [...actions, seoRegenerateAction]
      }

      return actions
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
