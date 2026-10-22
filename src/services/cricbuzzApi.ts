export interface CricbuzzConfig {
  apiKey: string;
  apiHost: string;
}

const DEFAULT_HOST = 'cricbuzz-cricket.p.rapidapi.com';

export function getCricbuzzKey(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('cricbuzz_api_key') || '';
  }
  return '';
}

export function saveCricbuzzKey(key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cricbuzz_api_key', key.trim());
  }
}

export async function fetchLiveMatchesFromCricbuzz(): Promise<{ success: boolean; data?: any; error?: string }> {
  const apiKey = getCricbuzzKey();
  if (!apiKey) {
    return {
      success: false,
      error: 'No RapidAPI Cricbuzz key configured. Using local cached match streams.',
    };
  }

  try {
    const response = await fetch(`https://${DEFAULT_HOST}/matches/v1/live`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': DEFAULT_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`Cricbuzz API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to fetch live matches from Cricbuzz API',
    };
  }
}
