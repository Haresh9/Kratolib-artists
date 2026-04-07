import { UserArtist } from './types';

const API_BASE = 'http://127.0.0.1:3001/public-artists';

export async function getAllArtists(userId?: string): Promise<UserArtist[]> {
  try {
    const url = userId ? `${API_BASE}?userId=${userId}` : API_BASE;
    console.log(`Fetching artists from: ${url}`);
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error(`Fetch failed with status: ${res.status} ${res.statusText}`);
      throw new Error('Failed to fetch artists');
    }
    return res.json();
  } catch (error) {
    console.error('Detailed Error fetching artists:', error);
    return [];
  }
}

export async function getArtistById(id: string): Promise<UserArtist | null> {
  try {
    const res = await fetch(`${API_BASE}/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch artist');
    return res.json();
  } catch (error) {
    console.error(`Error fetching artist ${id}:`, error);
    return null;
  }
}

export async function getArtistTracks(artistId: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/${artistId}/tracks`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch artist tracks');
    return res.json();
  } catch (error) {
    console.error(`Error fetching tracks for ${artistId}:`, error);
    return [];
  }
}
