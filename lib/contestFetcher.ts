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
      const response = await axios.get('https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=premium');
      const contests = response.data.contests;
      
      return contests
        .filter((contest: any) => contest.contest_status === 'Upcoming')
        .map((contest: any) => ({
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
      return [];
    }
  }

  static async fetchLeetcodeContests(): Promise<ContestData[]> {
    try {
      const response = await axios.get('https://leetcode.com/graphql', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: `
            query {
              contestUpcomingContests {
                title
                titleSlug
                startTime
                duration
                isVirtual
              }
            }
          `,
        },
      });

      const contests = response.data.data.contestUpcomingContests;
      
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
      return [];
    }
  }

  static async fetchGeeksforgeeksContests(): Promise<ContestData[]> {
    try {
      const response = await axios.get('https://practice.geeksforgeeks.org/events');
      const $ = cheerio.load(response.data);
      const contests: ContestData[] = [];

      $('.event-card').each((_, element) => {
        const $el = $(element);
        const title = $el.find('.event-title').text().trim();
        const dateText = $el.find('.event-date').text().trim();
        const url = $el.find('a').attr('href');
        
        if (title && url) {
          // Parse date (this is a simplified version - you might need more robust parsing)
          const startTime = new Date(); // Placeholder - implement proper date parsing
          
          contests.push({
            name: title,
            platform: 'geeksforgeeks' as const,
            startTime,
            endTime: new Date(startTime.getTime() + 2 * 60 * 60 * 1000), // Assume 2 hours
            duration: 120,
            url: url.startsWith('http') ? url : `https://practice.geeksforgeeks.org${url}`,
            description: title,
          });
        }
      });

      return contests;
    } catch (error) {
      console.error('Error fetching GeeksforGeeks contests:', error);
      return [];
    }
  }

  static async fetchAllContests(): Promise<void> {
    await dbConnect();

    const [codeforcesContests, codechefContests, leetcodeContests, geeksforgeeksContests] = await Promise.all([
      this.fetchCodeforcesContests(),
      this.fetchCodechefContests(),
      this.fetchLeetcodeContests(),
      this.fetchGeeksforgeeksContests(),
    ]);

    const allContests = [
      ...codeforcesContests,
      ...codechefContests,
      ...leetcodeContests,
      ...geeksforgeeksContests,
    ];

    for (const contestData of allContests) {
      try {
        await Contest.findOneAndUpdate(
          { url: contestData.url },
          { ...contestData, lastUpdated: new Date() },
          { upsert: true, new: true }
        );
      } catch (error) {
        console.error(`Error updating contest ${contestData.name}:`, error);
      }
    }

    console.log(`Updated ${allContests.length} contests`);
  }
} 