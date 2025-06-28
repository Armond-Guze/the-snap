import { client } from '@/sanity/lib/client';
import { fetchNFLStandingsWithFallback, ProcessedTeamData } from './nfl-api';

// Create a client with write permissions for syncing
const writeClient = client.withConfig({
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

export interface SyncResult {
  success: boolean;
  updated: number;
  created: number;
  errors: string[];
  lastUpdated: string;
}

export async function syncStandingsToSanity(): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    updated: 0,
    created: 0,
    errors: [],
    lastUpdated: new Date().toISOString()
  };

  try {
    // Fetch current standings from ESPN
    console.log('Fetching standings from ESPN API...');
    const apiData = await fetchNFLStandingsWithFallback();
    
    if (!apiData.length) {
      throw new Error('No data received from ESPN API');
    }

    // Get existing standings from Sanity
    const existingStandings = await writeClient.fetch(
      `*[_type == "standings"] { _id, teamName, season }`
    );

    const currentSeason = new Date().getFullYear().toString();
    const operations = [];

    for (const teamData of apiData) {
      // Check if team already exists for current season
      const existing = existingStandings.find(
        (team: any) => team.teamName === teamData.teamName && team.season === currentSeason
      );

      const standingsDoc = {
        _type: 'standings',
        teamName: teamData.teamName,
        wins: teamData.wins,
        losses: teamData.losses,
        ties: teamData.ties,
        winPercentage: teamData.winPercentage,
        conference: teamData.conference,
        division: teamData.division,
        season: currentSeason,
        lastUpdated: result.lastUpdated,
        // Only include logo if we have one from the API
        ...(teamData.logoUrl && {
          teamLogo: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: await uploadImageFromUrl(teamData.logoUrl, teamData.teamName)
            }
          }
        })
      };

      if (existing) {
        // Update existing document
        operations.push({
          patch: {
            id: existing._id,
            set: standingsDoc
          }
        });
        result.updated++;
      } else {
        // Create new document
        operations.push({
          create: {
            ...standingsDoc,
            _id: `standings-${teamData.teamName.toLowerCase().replace(/\s+/g, '-')}-${currentSeason}`
          }
        });
        result.created++;
      }
    }

    // Execute all operations in a transaction
    if (operations.length > 0) {
      console.log(`Executing ${operations.length} operations...`);
      await writeClient.transaction(operations).commit();
    }

    result.success = true;
    console.log(`Sync completed: ${result.created} created, ${result.updated} updated`);
    
  } catch (error) {
    console.error('Error syncing standings:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

async function uploadImageFromUrl(url: string, teamName: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
    
    const buffer = await response.arrayBuffer();
    const asset = await writeClient.assets.upload('image', Buffer.from(buffer), {
      filename: `${teamName.toLowerCase().replace(/\s+/g, '-')}-logo.png`
    });
    
    return asset._id;
  } catch (error) {
    console.error(`Error uploading logo for ${teamName}:`, error);
    // Return empty string if upload fails - the document will be created without logo
    return '';
  }
}

// Function to manually trigger sync (for testing or manual refresh)
export async function triggerStandingsSync() {
  console.log('Starting manual standings sync...');
  return await syncStandingsToSanity();
}
