export const headlineQuery = `
  *[(_type == "headline" || _type == "rankings") && published == true] | order(priority asc, _createdAt desc, publishedAt desc) {
    _id,
    _type,
    title,
  homepageTitle,
    slug,
    summary,
    coverImage {
      asset->{
        url
      }
    },
    priority,
    date,
    publishedAt,
    rankingType,
    author->{
      name
    },
  tags,
  twitterUrl,
  instagramUrl,
  tiktokUrl
  }
`;

// Detailed headline query for individual articles
export const headlineDetailQuery = `
  *[_type == "headline" && slug.current == $slug && published == true][0] {
    _id,
    title,
  homepageTitle,
    slug,
    summary,
    coverImage {
      asset->{
        url
      },
      alt
    },
    author->{
      name,
      image {
        asset->{
          url
        }
      },
      bio
    },
    category->{
      title,
      slug,
      color,
      description,
      seo {
        metaTitle,
        metaDescription,
        focusKeyword,
        additionalKeywords,
        ogImage {
          asset->{
            url
          }
        },
        noIndex
      }
    },
    tags[]->{
      title,
      slug
    },
    seo {
      metaTitle,
      metaDescription,
      focusKeyword,
      additionalKeywords,
      ogTitle,
      ogDescription,
      ogImage {
        asset->{
          url
        }
      },
      noIndex,
      canonicalUrl
    },
    date,
    body[]{
      ...,
      _type == 'playerHeading' => {
        ...,
        headshot{asset->{url}, alt},
        player->{name, team, position, headshot{asset->{url}, alt}}
      }
    },
    youtubeVideoId,
    videoTitle,
  twitterUrl,
  twitterTitle,
  instagramUrl,
  instagramTitle,
  tiktokUrl,
  tiktokTitle,
    _createdAt,
    _updatedAt
  }
`;

// Query for related articles based on category and tags
export const relatedHeadlinesQuery = `
  *[_type == "headline" && published == true && _id != $currentId && 
    (category._ref == $categoryId || count((tags[]._ref)[@ in $tagIds]) > 0)] 
  | order(priority asc, _createdAt desc)[0...6] {
    _id,
    title,
  homepageTitle,
    slug,
    summary,
    coverImage {
      asset->{
        url
      }
    },
    category->{
      title,
      color
    },
    date
  }
`;

// Categories query - simplified since no categories exist yet
export const categoriesQuery = `
  *[_type == "category"] | order(priority asc, title asc) {
    _id,
    title,
  homepageTitle,
    slug,
    description,
    color,
    priority,
    seo {
      metaTitle,
      metaDescription,
      focusKeyword,
      additionalKeywords,
      ogImage {
        asset->{
          url
        }
      },
      noIndex
    }
  }
`;

// Tags query - fixed to work with string tags in headlines
export const tagsQuery = `
  *[_type == "tag"] | order(trending desc, title asc) {
    _id,
    title,
    slug,
    description,
    trending,
    "articleCount": count(*[_type == "headline" && published == true && tags match "*" + ^.title + "*"])
  }
`;

// Trending tags query - fixed to work with string tags
export const trendingTagsQuery = `
  *[_type == "tag" && trending == true] | order(title asc) {
    title,
    slug,
    "articleCount": count(*[_type == "headline" && published == true && tags match "*" + ^.title + "*"])
  }
`;

// Headlines by category - fixed to work without requiring category references
export const headlinesByCategoryQuery = `
  *[_type == "headline" && published == true && category->slug.current == $categorySlug] 
  | order(priority asc, _createdAt desc) {
    _id,
    title,
    slug,
    summary,
    coverImage {
      asset->{
        url
      }
    },
    author->{
      name
    },
    category->{
      title,
      color
    },
    tags,
    date
  }
`;

// Headlines by tag - fixed to work with string tags
export const headlinesByTagQuery = `
  *[_type == "headline" && published == true && tags match "*" + $tagTitle + "*"] 
  | order(priority asc, _createdAt desc) {
    _id,
    title,
    slug,
    summary,
    coverImage {
      asset->{
        url
      }
    },
    author->{
      name
    },
    category->{
      title,
      color
    },
    tags,
    date
  }
`;

export const powerRankingsQuery = `*[_type == "powerRanking"] | order(rank asc) {
  _id,
  rank,
  teamName,
  teamLogo,
  summary,
  body,
  teamColor,
  date,
  previousRank
}`;

export const standingsQuery = `
  *[_type == "standings"] | order(division asc, wins desc, losses asc) {
    _id,
    teamName,
    teamLogo,
    wins,
    losses,
    ties,
    "winPercentage": (wins + ties * 0.5) / (wins + losses + ties),
    conference,
    division,
    season,
    lastUpdated
  }
`;

export const featuredGamesQuery = `
  *[_type == "game" && published == true && featured == true] | order(gameDate asc) {
    _id,
    homeTeam,
    awayTeam,
  homeRecord,
  awayRecord,
    homeTeamLogo,
    awayTeamLogo,
    gameDate,
    tvNetwork,
    gameImportance,
    preview,
    week
  }
`;

export const upcomingGamesQuery = `
  *[_type == "game" && published == true && gameDate > now()] | order(gameDate asc)[0...6] {
    _id,
    homeTeam,
    awayTeam,
  homeRecord,
  awayRecord,
    homeTeamLogo,
    awayTeamLogo,
    gameDate,
    tvNetwork,
    gameImportance,
    preview,
    week,
    featured
  }
`;

export const rankingsQuery = `
  *[_type == "rankings" && published == true] | order(publishedAt desc) [0..2] {
    _id,
    title,
    slug,
    rankingType,
    summary,
    coverImage {
      asset->{
        url
      }
    },
    author->{
      name
    },
    publishedAt,
    teams[0..2] {
      rank,
      teamName,
      teamLogo {
        asset->{
          url
        }
      }
    }
  }
`;

// Fantasy Football Query
export const fantasyFootballQuery = `
  *[_type == "fantasyFootball" && published == true] | order(priority asc, publishedAt desc) {
    _id,
    title,
    slug,
    summary,
    coverImage {
      asset->{
        url
      }
    },
    author->{
      name
    },
    publishedAt,
    fantasyType,
    priority,
    tags
  }
`;