import { postType } from './postType'
import { authorType } from './authorType'
import { categoryType } from './categoryType'
import { tagType } from './tagType'
import { blockContentType } from './blockContentType'
import headlineType from './headlineType'
import powerRanking from './powerRanking'
import rankings from './rankings'
import { standingsType } from './standingsType'
import { gameType } from './gameType'
import { seoType, noteType } from './simplifiedSEOType' // Updated to use simplified SEO


export const schemaTypes = [
  postType,
  authorType,
  categoryType,
  tagType,
  blockContentType,
  headlineType,
  powerRanking,
  rankings,
  standingsType,
  gameType,
  seoType,
  noteType,
]
