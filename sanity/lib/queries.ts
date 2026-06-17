// Updated ordering: show newest first strictly by publishedAt (fallback to _createdAt)
export const headlineQuery = `
  *[
    (
      _type == "article" &&
      format == "headline" &&
      published == true &&
      (!defined(seo.noIndex) || seo.noIndex == false)
    ) ||
    (
      _type == "headline" &&
      published == true &&
      (!defined(seo.noIndex) || seo.noIndex == false) &&
      !(slug.current in *[
        _type == "article" &&
        format == "headline" &&
        published == true &&
        (!defined(seo.noIndex) || seo.noIndex == false)
      ].slug.current)
    )
  ]
  | order(coalesce(publishedAt, _createdAt) desc, _createdAt desc) {
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
    featuredImage {
      asset->{ url }
    },
    image {
      asset->{ url }
    },
    priority,
    date,
    publishedAt,
    rankingType,
    author->{
      name
    },
  "tags": coalesce(tagRefs[]->{ title, slug }, []),
  twitterUrl,
  instagramUrl,
  tiktokUrl
  }
`;

// Detailed headline query for individual articles
export const headlineDetailQuery = `
  *[
    (_type == "article" && format == "headline" && slug.current == $slug && published == true && (!defined(seo.noIndex) || seo.noIndex == false)) ||
    (_type == "headline" && slug.current == $slug && published == true && (!defined(seo.noIndex) || seo.noIndex == false))
  ]
  | order(
    select(_type == "article" => 0, _type == "headline" => 1, 2) asc,
    coalesce(date, publishedAt, _createdAt) desc,
    _createdAt desc
  )[0] {
    _id,
    title,
  homepageTitle,
    slug,
    summary,
    format,
    rankingType,
    seasonYear,
    weekNumber,
    playoffRound,
    coverImage {
      asset->{
        url
      },
      alt
    },
    featuredImage { asset->{ url }, alt },
    image { asset->{ url }, alt },
    author->{
      name,
      image {
        asset->{
          url
        }
        ,alt
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
    topicHubs[]->{
      title,
      slug
    },
    "tags": coalesce(tagRefs[]->{
      title,
      slug
    }, []),
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
    publishedAt,
    body[]{
      ...,
      _type == 'playerHeading' => {
        ...,
        headshot{asset->{url}, alt},
        player->{name, team, position, headshot{asset->{url}, alt}}
      },
      _type == 'snapGraphicCard' => {
        ...,
        subject{
          ...,
          primaryPlayer->{name, team, position, headshot{asset->{url}, alt}}
        },
        media{
          ...,
          image{alt, asset->{url}}
        }
      },
      _type == 'rankingCard' => {
        ...,
        headshot{asset->{url}, alt},
        player->{name, team, position, headshot{asset->{url}, alt}},
        team->{title, slug, teamLogo{asset->{url}, alt}}
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
  *[
    (
      (_type == "article" && format == "headline") ||
      (
        _type == "headline" &&
        !(slug.current in *[
          _type == "article" &&
          format == "headline" &&
          published == true &&
          (!defined(seo.noIndex) || seo.noIndex == false)
        ].slug.current)
      )
    ) &&
    published == true &&
    (!defined(seo.noIndex) || seo.noIndex == false) &&
    _id != $currentId && 
    (category._ref == $categoryId || count((tagRefs[]._ref)[@ in $tagIds]) > 0)
  ] 
  | order(coalesce(publishedAt, _createdAt) desc)[0...6] {
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
    featuredImage { asset->{ url } },
    image { asset->{ url } },
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

// Mixed content by category for category hub pages
export const categoryContentQuery = `
  *[
    _type in ["article", "headline", "rankings", "fantasyFootball"] &&
    published == true &&
    category->slug.current == $categorySlug &&
    !(
      _type == "fantasyFootball" &&
      slug.current in *[
        _type == "article" &&
        published == true &&
        !(_id in path("drafts.**")) &&
        (!defined(seo.noIndex) || seo.noIndex == false) &&
        (format == "fantasy" || "fantasy" in coalesce(additionalFormats, []))
      ].slug.current
    )
  ]
  | order(coalesce(date, publishedAt, _createdAt) desc, _createdAt desc) {
    _id,
    _type,
    format,
    rankingType,
    seasonYear,
    weekNumber,
    playoffRound,
    title,
    homepageTitle,
    slug,
    summary,
    coverImage { asset->{ url } },
    featuredImage { asset->{ url } },
    image { asset->{ url } },
    author->{ name },
    category->{ title, slug, color },
    "tags": coalesce(tagRefs[]->{ title, slug }, []),
    date,
    publishedAt
  }
`;

// Detailed article query for all article formats (feature, ranking, analysis, fantasy, headline)
export const articleDetailQuery = `
  *[
    ((_type in ["article","rankings"] && slug.current == $slug && published == true && (!defined(seo.noIndex) || seo.noIndex == false))) ||
    (_type == "headline" && slug.current == $slug && published == true && (!defined(seo.noIndex) || seo.noIndex == false))
  ]
  | order(
    select(_type == "article" => 0, _type == "rankings" => 1, _type == "headline" => 2, 3) asc,
    coalesce(date, publishedAt, _createdAt) desc,
    _createdAt desc
  )[0] {
    _id,
    _type,
    format,
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
    featuredImage { asset->{ url }, alt },
    image { asset->{ url }, alt },
    author->{
      name,
      image {
        asset->{
          url
        }
        ,alt
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
    topicHubs[]->{
      title,
      slug
    },
    "tags": coalesce(tagRefs[]->{
      title,
      slug
    }, []),
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
    publishedAt,
    body[]{
      ...,
      _type == 'playerHeading' => {
        ...,
        headshot{asset->{url}, alt},
        player->{name, team, position, headshot{asset->{url}, alt}}
      },
      _type == 'snapGraphicCard' => {
        ...,
        subject{
          ...,
          primaryPlayer->{name, team, position, headshot{asset->{url}, alt}}
        },
        media{
          ...,
          image{alt, asset->{url}}
        }
      },
      _type == 'rankingCard' => {
        ...,
        headshot{asset->{url}, alt},
        player->{name, team, position, headshot{asset->{url}, alt}},
        team->{title, slug, teamLogo{asset->{url}, alt}}
      }
    },
    youtubeVideoId,
    videoTitle,
    twitterUrl,
    twitterTitle,
    instagramUrl,
    instagramTitle,
    tiktokUrl,
    tiktokTitle
  }
`;

const tagArticleCountFilter = `
  (published == true) &&
  _type in ["article", "headline", "rankings", "fantasyFootball"] &&
  (
    (
      ^._type == "advancedTag" &&
      (
        (defined(tagRefs) && references(^._id)) ||
        (defined(tags) && tags match "*" + ^.title + "*")
      )
    ) ||
    (
      ^._type == "tag" &&
      (
        (defined(teams) && ^._id in teams[]._ref) ||
        (defined(tags) && tags match "*" + ^.title + "*")
      )
    )
  )
`;

// Canonical topic and team tag cloud query. Falls back to legacy string tags while backfill catches up.
export const tagsQuery = `
  *[_type in ["advancedTag", "tag"] && defined(slug.current)] {
    _id,
    _type,
    title,
    slug,
    description,
    "trending": coalesce(trending, false),
    "articleCount": count(*[${tagArticleCountFilter}])
  } | order(articleCount desc, title asc)
`;

// Popular canonical tags for sidebar modules.
export const trendingTagsQuery = `
  *[_type in ["advancedTag", "tag"] && defined(slug.current)] {
    _id,
    _type,
    title,
    slug,
    description,
    "trending": true,
    "articleCount": count(*[${tagArticleCountFilter}])
  } | order(articleCount desc, title asc)[0...24]
`;

// Headlines by category - fixed to work without requiring category references
export const headlinesByCategoryQuery = `
  *[
    (
      (_type == "article" && format == "headline") ||
      (
        _type == "headline" &&
        !(slug.current in *[
          _type == "article" &&
          format == "headline" &&
          published == true &&
          (!defined(seo.noIndex) || seo.noIndex == false)
        ].slug.current)
      )
    ) &&
    published == true &&
    (!defined(seo.noIndex) || seo.noIndex == false) &&
    category->slug.current == $categorySlug
  ] 
  | order(coalesce(publishedAt, _createdAt) desc, _createdAt desc) {
    _id,
    title,
    slug,
    summary,
    coverImage {
      asset->{
        url
      }
    },
    featuredImage { asset->{ url } },
    image { asset->{ url } },
    author->{
      name
    },
    category->{
      title,
      color
    },
    "tags": coalesce(tagRefs[]->{ title, slug }, []),
    date
  }
`;

// Headlines by canonical tag title, with a legacy string-tag fallback while older docs are migrated.
export const headlinesByTagQuery = `
  *[
    (
      (_type == "article" && format == "headline") ||
      (
        _type == "headline" &&
        !(slug.current in *[
          _type == "article" &&
          format == "headline" &&
          published == true &&
          (!defined(seo.noIndex) || seo.noIndex == false)
        ].slug.current)
      )
    ) &&
    published == true &&
    (!defined(seo.noIndex) || seo.noIndex == false) &&
    (
      (defined(tags) && tags match "*" + $tagTitle + "*") ||
      (defined(tagRefs) && $tagTitle in tagRefs[]->title) ||
      (defined(teams) && $tagTitle in teams[]->title)
    )
  ] 
  | order(coalesce(publishedAt, _createdAt) desc, _createdAt desc) {
    _id,
    title,
    slug,
    summary,
    coverImage {
      asset->{
        url
      }
    },
    featuredImage { asset->{ url } },
    image { asset->{ url } },
    author->{
      name
    },
    category->{
      title,
      color
    },
    "tags": coalesce(tagRefs[]->{ title, slug }, []),
    date
  }
`;

export const playOfWeekListQuery = `
  *[_type == "playOfWeek" && published == true]
  | order(coalesce(date, _createdAt) desc, _createdAt desc)[0...24] {
    _id,
    title,
    slug,
    playType,
    summary,
    callout,
    coverImage { asset->{ url }, alt },
    clipUrl,
    date,
    quarter,
    clock,
    downDistance,
    yardLine,
    yardsGained,
    scoreBefore,
    scoreAfter,
    epaDelta,
    winProbDelta,
    skillBadges,
    difficulty,
    difficultyNote,
    momentumDirection,
    momentumMagnitude,
    impactTags,
    priority,
    teams[]->{ _id, title, slug },
    player->{ _id, name, position, team, headshot{ asset->{ url }, alt } }
  }
`;

export const playOfWeekDetailQuery = `
  *[_type == "playOfWeek" && slug.current == $slug && published == true][0] {
    _id,
    title,
    slug,
    playType,
    summary,
    callout,
    coverImage { asset->{ url }, alt },
    clipUrl,
    date,
    quarter,
    clock,
    downDistance,
    yardLine,
    yardsGained,
    scoreBefore,
    scoreAfter,
    epaDelta,
    winProbDelta,
    skillBadges,
    difficulty,
    difficultyNote,
    momentumDirection,
    momentumMagnitude,
    impactTags,
    priority,
    teams[]->{ _id, title, slug },
    player->{ _id, name, position, team, headshot{ asset->{ url }, alt } },
    body[]{ ... }
  }
`;

export const powerRankingsQuery = `
  *[_type == "article" && format == "powerRankings" && rankingType == "live"]
    | order(seasonYear desc, date desc)[0]{
      _id,
      title,
      slug,
      seasonYear,
      rankingType,
      methodology,
      rankingIntro,
      rankingConclusion,
      biggestRiser,
      biggestFaller,
      editorialStatus,
      date,
      rankings[]{
        rank,
        teamAbbr,
        teamName,
        previousRank,
        movement,
        tier,
        summary,
        note,
        analysis,
        prevRankOverride,
        movementOverride,
        teamLogo{ asset->{ url }, alt },
        team->{ _id, title, slug }
      }
    }
`;

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

export const articlesQuery = `
  *[_type in ["article","rankings"] && published == true && (!defined(seo.noIndex) || seo.noIndex == false)] | order(publishedAt desc) [0..2] {
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
  *[
    published == true &&
    !(_id in path("drafts.**")) &&
    (
      (_type == "article" && (format == "fantasy" || "fantasy" in coalesce(additionalFormats, []))) ||
      (
        _type == "fantasyFootball" &&
        !(slug.current in *[
          _type == "article" &&
          published == true &&
          !(_id in path("drafts.**")) &&
          (format == "fantasy" || "fantasy" in coalesce(additionalFormats, []))
        ].slug.current)
      )
    )
  ]
  | order(coalesce(publishedAt, date, _createdAt) desc, coalesce(priority, 999) asc) {
    _type,
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
    format,
    priority,
    tags
  }
`;
