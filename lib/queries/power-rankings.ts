export const powerRankingWeekByParamsQuery = `
  *[_type == "powerRankingWeek" && season == $season && week == $week][0]{
    season, week, publishedAt, slug, items[]{rank, teamAbbr, teamName, note, prevRank, movement}
  }
`;

export const powerRankingWeeksSlugsQuery = `
  *[_type == "powerRankingWeek"] | order(season desc, week desc){
    "slug": slug.current, season, week
  }
`;
