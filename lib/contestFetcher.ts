import axios from 'axios';
import * as cheerio from 'cheerio';
import Contest, { IContest } from '../models/Contest';
import dbConnect from './mongodb';

interface ContestData {
  name: string;
  platform: 'codeforces' | 'codechef' | 'leetcode' | 'geeksforgeeks';
  startTime: Date;
  endTime: Date;
  duration: number;
  url: string;
  description?: string;
  difficulty?: string;
  isRated?: boolean;
  participants?: number;
}

export class ContestFetcher {
  static async fetchCodeforcesContests(): Promise<ContestData[]> {
    try {
      const response = await axios.get('https://codeforces.com/api/contest.list');
      const contests = response.data.result;
      
      return contests
        .filter((contest: any) => contest.phase === 'BEFORE')
        .map((contest: any) => ({
          name: contest.name,
          platform: 'codeforces' as const,
          startTime: new Date(contest.startTimeSeconds * 1000),
          endTime: new Date((contest.startTimeSeconds + contest.durationSeconds) * 1000),
          duration: Math.floor(contest.durationSeconds / 60),
          url: `https://codeforces.com/contest/${contest.id}`,
          description: contest.description,
          isRated: contest.type === 'RATED',
        }));
    } catch (error) {
      console.error('Error fetching Codeforces contests:', error);
      return [];
    }
  }

  static async fetchCodechefContests(): Promise<ContestData[]> {
    try {
      console.log('Fetching CodeChef contests...');
      const response = await axios.get('https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=premium');
      
      console.log('CodeChef API response structure:', Object.keys(response.data));
      
      // Check if future_contests array exists (new API structure)
      if (!response.data.future_contests) {
        console.log('No future_contests array found in CodeChef response');
        console.log('Available keys:', Object.keys(response.data));
        return [];
      }
      
      const contests = response.data.future_contests;
      console.log(`Found ${contests.length} future CodeChef contests`);
      
      return contests.map((contest: any) => ({
        name: contest.contest_name,
        platform: 'codechef' as const,
        startTime: new Date(contest.contest_start_date),
        endTime: new Date(contest.contest_end_date),
        duration: Math.floor((new Date(contest.contest_end_date).getTime() - new Date(contest.contest_start_date).getTime()) / (1000 * 60)),
        url: `https://www.codechef.com/${contest.contest_code}`,
        description: contest.contest_description,
      }));
    } catch (error) {
      console.error('Error fetching CodeChef contests:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('CodeChef API response status:', axiosError.response?.status);
        console.error('CodeChef API response data:', axiosError.response?.data);
      }
      return [];
    }
  }

  static async fetchLeetcodeContests(): Promise<ContestData[]> {
    try {
      console.log('Fetching LeetCode contests...');
      
      // Try the GraphQL API first
      const response = await axios.post('https://leetcode.com/graphql', {
        query: `
          query {
            upcomingContests {
              title
              titleSlug
              startTime
              duration
              isVirtual
            }
          }
        `
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 10000, // 10 second timeout
      });

      console.log('LeetCode API response status:', response.status);
      console.log('LeetCode API response keys:', Object.keys(response.data));
      
      if (!response.data.data || !response.data.data.upcomingContests) {
        console.log('No upcomingContests found in LeetCode response');
        console.log('Response data:', JSON.stringify(response.data, null, 2));
        return [];
      }
      
      const contests = response.data.data.upcomingContests;
      console.log(`Found ${contests.length} upcoming LeetCode contests`);
      
      return contests.map((contest: any) => ({
        name: contest.title,
        platform: 'leetcode' as const,
        startTime: new Date(contest.startTime * 1000),
        endTime: new Date((contest.startTime + contest.duration) * 1000),
        duration: Math.floor(contest.duration / 60),
        url: `https://leetcode.com/contest/${contest.titleSlug}`,
        description: `LeetCode ${contest.title}`,
        isRated: !contest.isVirtual,
      }));
    } catch (error) {
      console.error('Error fetching LeetCode contests:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('LeetCode API response status:', axiosError.response?.status);
        console.error('LeetCode API response data:', axiosError.response?.data);
        console.error('LeetCode API response headers:', axiosError.response?.headers);
      }
      
      // Fallback: Try to scrape from the contests page
      try {
        console.log('Trying fallback method for LeetCode...');
        const fallbackResponse = await axios.get('https://leetcode.com/contest/', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
          timeout: 10000,
        });
        
        const $ = cheerio.load(fallbackResponse.data);
        const contests: ContestData[] = [];
        
        // Look for contest elements (this is a basic fallback)
        $('a[href*="/contest/"]').each((_, element) => {
          const $el = $(element);
          const title = $el.text().trim();
          const href = $el.attr('href');
          
          if (title && href && title.length > 5) {
            contests.push({
              name: title,
              platform: 'leetcode' as const,
              startTime: new Date(), // Placeholder
              endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // Placeholder
              duration: 120, // Placeholder
              url: href.startsWith('http') ? href : `https://leetcode.com${href}`,
              description: `LeetCode ${title}`,
            });
          }
        });
        
        console.log(`Fallback found ${contests.length} LeetCode contests`);
        return contests.slice(0, 5); // Limit to 5 contests
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        return [];
      }
    }
  }

  static async fetchAllContests(): Promise<void> {
    await dbConnect();

    console.log('=== Starting Contest Fetch (All Platforms) ===');
    
    const [codeforcesContests, codechefContests, leetcodeContests] = await Promise.all([
      this.fetchCodeforcesContests(),
      this.fetchCodechefContests(),
      this.fetchLeetcodeContests(),
    ]);

    console.log('=== Fetch Results ===');
    console.log(`Codeforces: ${codeforcesContests.length} contests`);
    console.log(`Codechef: ${codechefContests.length} contests`);
    console.log(`LeetCode: ${leetcodeContests.length} contests`);

    const allContests = [
      ...codeforcesContests,
      ...codechefContests,
      ...leetcodeContests,
    ];

    console.log(`Total contests to save: ${allContests.length}`);

    let savedCount = 0;
    for (const contestData of allContests) {
      try {
        await Contest.findOneAndUpdate(
          { url: contestData.url },
          { ...contestData, lastUpdated: new Date() },
          { upsert: true, new: true }
        );
        savedCount++;
      } catch (error) {
        console.error(`Error updating contest ${contestData.name}:`, error);
      }
    }

    console.log(`=== Contest Update Complete ===`);
    console.log(`Successfully saved/updated ${savedCount} contests`);
  }
} 