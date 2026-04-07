export interface AppleTrack {
  id: string;
  title: string;
  album?: string;
  year?: string;
  duration?: string;
  image?: string;
}

/**
 * Converts ISO 8601 duration (e.g. PT2M56S) to M:SS
 */
function parseISO8601Duration(iso: string): string {
  if (!iso || !iso.startsWith('PT')) return iso || '0:00';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  const totalMinutes = hours * 60 + minutes;
  return `${totalMinutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export async function getArtistAppleMusicTracks(artistUrl: string): Promise<AppleTrack[]> {
  if (!artistUrl || !artistUrl.includes('music.apple.com')) {
    return [];
  }

  try {
    const res = await fetch(artistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 }
    });

    const html = await res.text();
    let jsonLdTracks: AppleTrack[] = [];

    // 1. JSON-LD Extraction (Reliable Metadata)
    const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch && jsonLdMatch[1]) {
      try {
        const data = JSON.parse(jsonLdMatch[1]);
        const trackData = data.tracks || data.track;
        if (trackData) {
          const tracks = Array.isArray(trackData) ? trackData : [trackData];
          jsonLdTracks = tracks.map((t: any, i: number) => ({
            id: t.url?.split('/').pop() || String(i),
            title: t.name || 'Unknown Track',
            album: t.inAlbum?.name || '',
            year: t.datePublished?.split('-')[0] || '',
            duration: parseISO8601Duration(t.duration),
            image: t.image || t.inAlbum?.image || ''
          }));
        }
      } catch (e) {
        console.warn("Could not parse Apple Music JSON-LD", e);
      }
    }

    // 2. HTML Scraper (Robust Artwork Extraction)
    const htmlTracks: AppleTrack[] = [];
    
    // Newer Apple Music pages use 'track-lockup' which can have svelte-specific class suffixes
    const items = html.split(/class="track-lockup\b/);
    
    // Fallback to older songs-list-row if needed
    const blocks = items.length > 1 ? items : html.split(/class="songs-list-row\b/);

    for (let i = 1; i < blocks.length && i <= 12; i++) {
      const block = blocks[i];
      
      // Look for aria-label or specific title divs (handles svelte classes like svelte-1o8gcyq)
      const ariaLabelMatch = block.match(/aria-label=["']([^"']*)["']/);
      const titleDivMatch = block.match(/track-lockup__title[^>]*>([\s\S]*?)<\/div>/);
      
      const imgMatch = block.match(/<img[^>]*src=["']([^"']*)["']/) || 
                       block.match(/data-testid="artwork-component"[\s\S]*?<img[\s\S]*?src=["']([^"']*)["']/);
      
      const srcsetMatch = block.match(/srcset=["']([^"']*)["']/);

      if (ariaLabelMatch || titleDivMatch) {
        // Extract title, cleaning up By Artist part if present in aria-label
        let title = (ariaLabelMatch ? ariaLabelMatch[1].split(', By')[0] : titleDivMatch![1])
                    .replace(/&amp;/g, '&')
                    .replace(/<[^>]*>/g, '')
                    .trim();

        let imageUrl = '';
        if (srcsetMatch && srcsetMatch[1]) {
          const sets = srcsetMatch[1].split(',');
          // Take the high quality set (usually the last or containing the larger value)
          imageUrl = sets[sets.length - 1].trim().split(' ')[0];
        } else if (imgMatch && imgMatch[1]) {
          imageUrl = imgMatch[1];
        }

        if (imageUrl) {
          // Robustly replace the trailing size segment (e.g., /124x124bb.webp) with high-res
          imageUrl = imageUrl.replace(/\/\d+x\d+[^/]*\.(?:webp|jpg|png)$/i, '/600x600bb.jpg');
          
          // Fallback for {w}x{h} format if still present
          imageUrl = imageUrl
            .replace('{w}', '600')
            .replace('{h}', '600')
            .replace('{f}', 'jpg');
          
          if (!imageUrl.startsWith('http')) {
            imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : '';
          }
        }

        htmlTracks.push({
          id: `scrape-${i}`,
          title,
          image: imageUrl
        });
      }
    }

    // 3. Smart Merging (Prioritize JSON-LD metadata for years/albums and HTML for images)
    if (jsonLdTracks.length > 0) {
      return jsonLdTracks.map((jt, index) => {
        // Find matching image from HTML (by index is surprisingly correct for Apple lists)
        const match = htmlTracks[index] || 
                      htmlTracks.find(ht => ht.title && (ht.title.includes(jt.title) || jt.title.includes(ht.title)));
        
        return {
          ...jt,
          // Always favor the high-res scraped image if we found one
          image: match?.image || jt.image || ''
        };
      });
    }

    return htmlTracks;
  } catch (error) {
    console.error("Error fetching Apple Music tracks:", error);
    return [];
  }
}

export async function getArtistAppleFollowers(artistUrl: string): Promise<string> {
  if (!artistUrl || !artistUrl.includes('music.apple.com')) return '0';

  try {
    const res = await fetch(artistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 }
    });

    const html = await res.text();

    // Apple Music often doesn't show public follower counts, but sometimes it's in a hidden span
    // or meta tags. We'll search for common patterns.
    const followerRegex = /([\d,.]+)([MK])?\s+followers/i;
    const match = html.match(followerRegex);
    if (match && match[1]) {
      return match[1] + (match[2] || '');
    }

    // Check for "Listeners" as a fallback
    const listenerRegex = /([\d,.]+)([MK])?\s+monthly\s+listeners/i;
    const lMatch = html.match(listenerRegex);
    if (lMatch && lMatch[1]) {
      return lMatch[1] + (lMatch[2] || '');
    }

    return '0';
  } catch (error) {
    console.error("Error fetching Apple Music followers:", error);
    return '0';
  }
}
