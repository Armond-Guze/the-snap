export const powerRankingsLiveQuery = `
  *[
    _type == "article" &&
    format == "powerRankings" &&
    rankingType == "live" &&
    published == true &&
    (!defined(seo.noIndex) || seo.noIndex == false)
  ]
    | order(seasonYear desc, coalesce(publishedAt, date, _updatedAt) desc, _updatedAt desc, _id asc)[0]{
      _id,
      title,
      summary,
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
      publishedAt,
      author->{ name, image { asset->{ url }, alt } },
      coverImage{ asset->{ url }, alt },
      rankings[]{
        rank,
        teamAbbr,
        teamName,
        teamColor,
        previousRank,
        movement,
        tier,
        summary,
        note,
        analysis,
        prevRankOverride,
        movementOverride,
        teamLogo{ asset->{ url }, alt },
        team->{ _id, title, slug, teamLogo{ asset->{ url }, alt } }
      }
    }
`;

export const powerRankingsSnapshotByParamsQuery = `
  *[_type == "article" && format == "powerRankings" && rankingType == "snapshot" && published == true && (!defined(seo.noIndex) || seo.noIndex == false) && seasonYear == $season && (
      (defined($week) && weekNumber == $week) ||
      (defined($playoffRound) && playoffRound == $playoffRound)
    )]
    | order(coalesce(publishedAt, date, _updatedAt) desc, _updatedAt desc, _id asc)[0]{
      _id,
      title,
      summary,
      slug,
      seasonYear,
      weekNumber,
      playoffRound,
      rankingIntro,
      rankingConclusion,
      biggestRiser,
      biggestFaller,
      editorialStatus,
      publishedAt,
      date,
      author->{ name, image { asset->{ url }, alt } },
      coverImage{ asset->{ url }, alt },
      rankings[]{
        rank,
        teamAbbr,
        teamName,
        teamColor,
        previousRank,
        movement,
        tier,
        summary,
        note,
        analysis,
        prevRankOverride,
        movementOverride,
        teamLogo{ asset->{ url }, alt },
        team->{ _id, title, slug, teamLogo{ asset->{ url }, alt } }
      }
    }
`;

export const powerRankingsSnapshotSlugsQuery = `
  *[_type == "article" && format == "powerRankings" && rankingType == "snapshot" && published == true && (!defined(seo.noIndex) || seo.noIndex == false)]
    | order(
        seasonYear desc,
        coalesce(weekNumber, select(playoffRound == "WC" => 19, playoffRound == "DIV" => 20, playoffRound == "CONF" => 21, playoffRound == "SB" => 22, playoffRound == "OFF" => 23, 0)) desc,
        coalesce(publishedAt, date, _updatedAt) desc,
        _updatedAt desc,
        _id asc
      ){
      seasonYear,
      weekNumber,
      playoffRound,
      _updatedAt
    }
`;

export const powerRankingsLatestSnapshotForSeasonQuery = `
  *[_type == "article" && format == "powerRankings" && rankingType == "snapshot" && published == true && (!defined(seo.noIndex) || seo.noIndex == false) && seasonYear == $season]
    | order(
        coalesce(weekNumber, select(playoffRound == "WC" => 19, playoffRound == "DIV" => 20, playoffRound == "CONF" => 21, playoffRound == "SB" => 22, playoffRound == "OFF" => 23, 0)) desc,
        coalesce(publishedAt, date, _updatedAt) desc,
        _updatedAt desc,
        _id asc
      )[0]{
        seasonYear,
        weekNumber,
        playoffRound,
        rankings[]{ rank, teamAbbr, teamName }
      }
`;

export const powerRankingsLatestSnapshotQuery = `
  *[_type == "article" && format == "powerRankings" && rankingType == "snapshot" && published == true && (!defined(seo.noIndex) || seo.noIndex == false)]
    | order(
        seasonYear desc,
        coalesce(weekNumber, select(playoffRound == "WC" => 19, playoffRound == "DIV" => 20, playoffRound == "CONF" => 21, playoffRound == "SB" => 22, playoffRound == "OFF" => 23, 0)) desc,
        coalesce(publishedAt, date, _updatedAt) desc,
        _updatedAt desc,
        _id asc
      )[0]{
        seasonYear,
        weekNumber,
        playoffRound
      }
`;
