export interface SpotifyTrack {
  id: string;
  title: string;
  album?: string;
  year?: string;
  duration?: string;
  image?: string;
  playCount?: string;
}

export async function getArtistSpotifyTracksScraper(artistId: string): Promise<SpotifyTrack[]> {
  if (!artistId) return [];

  const artistUrl = `https://open.spotify.com/artist/${artistId}`;

  try {
    const res = await fetch(artistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    const html = await res.text();

    // 1. Try to find the JSON-LD block (most reliable)
    // Using a more robust regex that handles dynamic script tag variations
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    const jsonBlocks = html.match(/<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];

    let trackData: any[] = [];

    if (jsonLdMatch && jsonLdMatch[1]) {
      try {
        const data = JSON.parse(jsonLdMatch[1]);
        const foundTracks = data.tracks || data.track || (data['@graph']?.find((n: any) => n.tracks)?.tracks);
        if (foundTracks) trackData = Array.isArray(foundTracks) ? foundTracks : [foundTracks];
      } catch (e) {}
    }

    // fallback to searching all JSON blocks for "tracks"
    if (trackData.length === 0) {
      for (const block of jsonBlocks) {
        try {
          const content = block.replace(/<script[^>]*>|<\/script>/gi, '');
          const data = JSON.parse(content);
          // Look for tracks in deeply nested structures (initial state)
          const findTracks = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return null;
            if (Array.isArray(obj.popularTracks?.items)) return obj.popularTracks.items;
            if (Array.isArray(obj.tracks)) return obj.tracks;
            for (const key in obj) {
               const res = findTracks(obj[key]);
               if (res) return res;
            }
            return null;
          };
          const found = findTracks(data);
          if (found) {
            trackData = found;
            break;
          }
        } catch (e) {}
      }
    }

    if (trackData.length > 0) {
      return trackData.slice(0, 5).map((t: any, i: number) => {
          const track = t.track || t;
          const durationRaw = track.duration || 'PT3M30S';
          const dMatch = durationRaw.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
          const m = dMatch?.[1] || '3';
          const s = dMatch?.[2] || '30';
          
          return {
            id: track.id || track.url?.split('/').pop() || `track-${i}`,
            title: track.name || 'Unknown Track',
            album: track.inAlbum?.name || track.album?.name || '',
            duration: `${m}:${s.toString().padStart(2, '0')}`,
            image: track.image || track.album?.images?.[0]?.url || ''
          };
      });
    }

    // 2. UNIVERSAL ARIA-LABEL SCRAPER (Fail-safe for Mobile/Bot Versions)
    const ariaTracks: SpotifyTrack[] = [];
    const ariaRegex = /aria-label=["']([^"']+)["'][^>]*data-testid=["']track-row["']/gi;
    let ariaMatch;

    while ((ariaMatch = ariaRegex.exec(html)) !== null && ariaTracks.length < 5) {
      if (ariaMatch[1].toLowerCase() !== 'more' && ariaMatch[1].toLowerCase() !== 'shuffle') {
         // Also try to find the nearby track URI
         const context = html.substring(ariaMatch.index - 300, ariaMatch.index + 300);
         const uriMatch = context.match(/spotify:track:([a-zA-Z0-9]+)/);
         
         ariaTracks.push({
           id: uriMatch ? uriMatch[1] : `track-${ariaTracks.length}`,
           title: ariaMatch[1].trim(),
           duration: '3:30',
           image: '' // Fallback in UI
         });
      }
    }

    if (ariaTracks.length > 0) return ariaTracks;

    // 3. Fallback: Parse basic metadata from HTML Links
    const regex = /href="\/track\/([^/"]+)"[^>]*><span[^>]*>([^<]+)<\/span>/g;
    let match;
    const regexTracks: SpotifyTrack[] = [];
    while ((match = regex.exec(html)) !== null && regexTracks.length < 5) {
      regexTracks.push({
        id: match[1],
        title: match[2].trim(),
        duration: '3:45',
        image: ''
      });
    }

    if (regexTracks.length > 0) return regexTracks;

    // 4. ULTRA-BRUTE FALLBACK (Scan Raw JSON Strings + Decoding)
    let searchSource = html;
    
    // If we can find the initial-state script, decode it first as it often holds the real data
    const stateMatch = html.match(/id=["']initial-state["'][^>]*>([\s\S]*?)<\/script>/i);
    if (stateMatch && stateMatch[1]) {
        try {
            // Check if it's base64 (very common for Spotify)
            const decoded = Buffer.from(stateMatch[1], 'base64').toString('utf8');
            searchSource = decoded;
        } catch (e) {
            searchSource = stateMatch[1];
        }
    }

    const bruteRegex = /"name":"([^"]+)","uri":"spotify:track:([a-zA-Z0-9]+)"/gi;
    let bruteMatch;
    const bruteTracks: SpotifyTrack[] = [];
    const seenTitles = new Set();
    
    while ((bruteMatch = bruteRegex.exec(searchSource)) !== null && bruteTracks.length < 6) {
        let title = bruteMatch[1]
            .replace(/\\u([0-9a-fA-F]{4})/g, (m, p1) => String.fromCharCode(parseInt(p1, 16)))
            .replace(/&amp;/g, '&')
            .trim();
            
        if (!seenTitles.has(title)) {
            seenTitles.add(title);
            bruteTracks.push({
                id: bruteMatch[2],
                title: title,
                duration: '3:30',
                image: ''
            });
        }
    }

    if (bruteTracks.length > 0) return bruteTracks;

    return [];
  } catch (error) {
    console.error("Error fetching Spotify scraper tracks:", error);
    return [];
  }
}

export async function getArtistSpotifyFollowers(artistId: string): Promise<string> {
  if (!artistId) return '0';

  const artistUrl = `https://open.spotify.com/artist/${artistId}`;

  try {
    const res = await fetch(artistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 }
    });

    const html = await res.text();

    // 1. Try regex on the HTML for a formatted string like "1,234,567 followers"
    const followerRegex = /([\d,.]+)\s+followers/i;
    const match = html.match(followerRegex);
    if (match && match[1]) {
      return match[1].trim();
    }

    // 2. Try looking in the initial-state JSON
    let searchSource = html;
    const stateMatch = html.match(/id=["']initial-state["'][^>]*>([\s\S]*?)<\/script>/i);
    if (stateMatch && stateMatch[1]) {
        try {
            const decoded = Buffer.from(stateMatch[1], 'base64').toString('utf8');
            searchSource = decoded;
        } catch (e) {
            searchSource = stateMatch[1];
        }
    }

    const followersJsonRegex = /"followers":\{"total":(\d+)\}/i;
    const jsonMatch = searchSource.match(followersJsonRegex);
    if (jsonMatch && jsonMatch[1]) {
      const count = parseInt(jsonMatch[1]);
      if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
      if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
      return count.toString();
    }

    return '0';
  } catch (error) {
    console.error("Error fetching Spotify followers:", error);
    return '0';
  }
}
