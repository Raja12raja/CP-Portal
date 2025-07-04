import axios from 'axios';
import Problem from '../models/Problem';
import dbConnect from './mongodb';

interface ProblemData {
  title: string;
  platform: 'codeforces' | 'codechef' | 'leetcode' | 'geeksforgeeks';
  problemId: string;
  url: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  category?: string;
  acceptanceRate?: number;
  totalSubmissions?: number;
  solvedCount?: number;
  contestId?: string;
  contestName?: string;
  timeLimit?: number;
  memoryLimit?: number;
  description?: string;
  constraints?: string;
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  isPremium?: boolean;
  isRated?: boolean;
}

export class ProblemFetcher {
  static async fetchLeetcodeProblems(): Promise<ProblemData[]> {
    try {
      console.log('Fetching LeetCode problems...');
      
      // Fetch problems from LeetCode API
      const response = await axios.post('https://leetcode.com/graphql', {
        query: `
          query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
            problemsetQuestionList: questionList(
              categorySlug: $categorySlug
              limit: $limit
              skip: $skip
              filters: $filters
            ) {
              total: totalNum
              questions: data {
                acRate
                difficulty
                freqBar
                frontendQuestionId: questionFrontendId
                isFavor
                paidOnly: isPaidOnly
                status
                title
                titleSlug
                topicTags {
                  name
                  id
                  slug
                }
                hasSolution
                hasVideoSolution
              }
            }
          }
        `,
        variables: {
          categorySlug: "",
          limit: 100,
          skip: 0,
          filters: {}
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 15000,
      });

      if (!response.data.data?.problemsetQuestionList?.questions) {
        console.log('No problems found in LeetCode response');
        return [];
      }

      const problems = response.data.data.problemsetQuestionList.questions;
      console.log(`Found ${problems.length} LeetCode problems`);

      return problems.map((problem: any) => ({
        title: problem.title,
        platform: 'leetcode' as const,
        problemId: problem.frontendQuestionId,
        url: `https://leetcode.com/problems/${problem.titleSlug}`,
        difficulty: this.mapLeetcodeDifficulty(problem.difficulty),
        tags: problem.topicTags.map((tag: any) => tag.name),
        category: problem.topicTags[0]?.name,
        acceptanceRate: problem.acRate,
        isPremium: problem.paidOnly,
        isRated: true,
      }));
    } catch (error) {
      console.error('Error fetching LeetCode problems:', error);
      return [];
    }
  }

  static async fetchCodeforcesProblems(): Promise<ProblemData[]> {
    try {
      console.log('Fetching Codeforces problems...');
      
      // Fetch problems from Codeforces API
      const response = await axios.get('https://codeforces.com/api/problemset.problems');
      
      if (!response.data.result?.problems) {
        console.log('No problems found in Codeforces response');
        return [];
      }

      const problems = response.data.result.problems;
      console.log(`Found ${problems.length} Codeforces problems`);

      return problems.slice(0, 100).map((problem: any) => ({
        title: problem.name,
        platform: 'codeforces' as const,
        problemId: `${problem.contestId}${problem.index}`,
        url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
        difficulty: this.mapCodeforcesDifficulty(problem.rating),
        tags: problem.tags || [],
        category: problem.tags?.[0],
        contestId: problem.contestId?.toString(),
        isRated: true,
      }));
    } catch (error) {
      console.error('Error fetching Codeforces problems:', error);
      return [];
    }
  }

  private static mapLeetcodeDifficulty(difficulty: string): 'easy' | 'medium' | 'hard' {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'easy';
      case 'medium': return 'medium';
      case 'hard': return 'hard';
      default: return 'medium';
    }
  }

  private static mapCodeforcesDifficulty(rating?: number): 'easy' | 'medium' | 'hard' {
    if (!rating) return 'medium';
    if (rating <= 1200) return 'easy';
    if (rating <= 2000) return 'medium';
    return 'hard';
  }

  static async fetchAllProblems(): Promise<void> {
    await dbConnect();

    console.log('=== Starting Problem Fetch (All Platforms) ===');
    
    const [leetcodeProblems, codeforcesProblems] = await Promise.all([
      this.fetchLeetcodeProblems(),
      this.fetchCodeforcesProblems(),
    ]);

    console.log('=== Fetch Results ===');
    console.log(`LeetCode: ${leetcodeProblems.length} problems`);
    console.log(`Codeforces: ${codeforcesProblems.length} problems`);

    const allProblems = [
      ...leetcodeProblems,
      ...codeforcesProblems,
    ];

    console.log(`Total problems to save: ${allProblems.length}`);

    let savedCount = 0;
    for (const problemData of allProblems) {
      try {
        await Problem.findOneAndUpdate(
          { url: problemData.url },
          { ...problemData, lastUpdated: new Date() },
          { upsert: true, new: true }
        );
        savedCount++;
      } catch (error) {
        console.error(`Error updating problem ${problemData.title}:`, error);
      }
    }

    console.log(`=== Problem Update Complete ===`);
    console.log(`Successfully saved/updated ${savedCount} problems`);
  }
} 