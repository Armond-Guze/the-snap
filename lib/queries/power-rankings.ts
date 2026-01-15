export const powerRankingsLiveQuery = `
  *[_type == "article" && format == "powerRankings" && rankingType == "live" && published == true]
    | order(seasonYear desc, date desc)[0]{
      _id,
      title,
      slug,
      seasonYear,
      rankingType,
      methodology,
      date,
      rankings[]{
        rank,
        teamAbbr,
        teamName,
        note,
        analysis,
        prevRankOverride,
        movementOverride,
        teamLogo{ asset->{ url }, alt },
        team->{ _id, title, slug }
      }
    }
`;

export const powerRankingsSnapshotByParamsQuery = `
  *[_type == "article" && format == "powerRankings" && rankingType == "snapshot" && published == true && seasonYear == $season && (
      (defined($week) && weekNumber == $week) ||
      (defined($playoffRound) && playoffRound == $playoffRound)
    )][0]{
      _id,
      title,
      slug,
      seasonYear,
      weekNumber,
      playoffRound,
      publishedAt,
      date,
      rankings[]{
        rank,
        teamAbbr,
        teamName,
        note,
        analysis,
        prevRankOverride,
        movementOverride,
        teamLogo{ asset->{ url }, alt },
        team->{ _id, title, slug }
      }
    }
`;

export const powerRankingsSnapshotSlugsQuery = `
  *[_type == "article" && format == "powerRankings" && rankingType == "snapshot" && published == true]
    | order(seasonYear desc, weekNumber desc){
      seasonYear,
      weekNumber,
      playoffRound,
      _updatedAt
    }
`;

export const powerRankingsLatestSnapshotForSeasonQuery = `
  *[_type == "article" && format == "powerRankings" && rankingType == "snapshot" && published == true && seasonYear == $season]
    | order(
        coalesce(weekNumber, select(playoffRound == "WC" => 19, playoffRound == "DIV" => 20, playoffRound == "CONF" => 21, playoffRound == "SB" => 22, 0)) desc,
        date desc
      )[0]{
        seasonYear,
        weekNumber,
        playoffRound,
        rankings[]{ rank, teamAbbr, teamName }
      }
`;
