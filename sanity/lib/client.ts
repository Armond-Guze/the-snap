import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

const useCdn = process.env.NEXT_PUBLIC_SANITY_USE_CDN !== 'false'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn,
})
