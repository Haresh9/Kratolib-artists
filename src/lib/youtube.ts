const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export interface YouTubeTrack {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
}

export async function getArtistYouTubeTracks(channelUrl: string): Promise<YouTubeTrack[]> {
  if (!YOUTUBE_API_KEY) {
    console.error("YOUTUBE_API_KEY is not defined in .env");
    return [];
  }

  try {
    let channelId = "";

    // Extract channel ID from various URL formats
    if (channelUrl.includes('/channel/')) {
      channelId = channelUrl.split('/channel/')[1].split('/')[0].split('?')[0];
    } else if (channelUrl.includes('/@')) {
      // For @handles, we need to search for the channel first to get the ID
      const handle = channelUrl.split('/@')[1].split('/')[0].split('?')[0];
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${handle}&type=channel&key=${YOUTUBE_API_KEY}`
      );
      const searchData = await searchRes.json();
      channelId = searchData.items?.[0]?.id?.channelId || "";
    }

    if (!channelId) {
      console.error("Could not extract YouTube Channel ID from URL:", channelUrl);
      return [];
    }

    // Now fetch the videos for this channel
    // We search for videos from this channelId, ordered by date
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=5&order=date&type=video&key=${YOUTUBE_API_KEY}`,
      { next: { revalidate: 3600 } }
    );

    const data = await res.json();

    if (!data.items) {
      console.error("No items found in YouTube API response:", data);
      return [];
    }

    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      publishedAt: item.snippet.publishedAt,
    }));
  } catch (error) {
    console.error("Error fetching from YouTube API:", error);
    return [];
  }
}

export async function getArtistYouTubeSubscribers(channelUrl: string): Promise<string> {
  if (!YOUTUBE_API_KEY || !channelUrl) return '0';

  try {
    let channelId = "";

    // Extract channel ID or handle
    if (channelUrl.includes('/channel/')) {
      channelId = channelUrl.split('/channel/split/')[1].split('/')[0].split('?')[0];
    } else if (channelUrl.includes('/@')) {
      const handle = channelUrl.split('/@')[1].split('/')[0].split('?')[0];
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${handle}&type=channel&key=${YOUTUBE_API_KEY}`
      );
      const searchData = await searchRes.json();
      channelId = searchData.items?.[0]?.id?.channelId || "";
    }

    if (!channelId) return '0';

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
    );
    const data = await res.json();
    const stats = data.items?.[0]?.statistics;
    
    if (stats && stats.subscriberCount) {
      const count = parseInt(stats.subscriberCount);
      if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
      if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
      return count.toString();
    }
    
    return '0';
  } catch (error) {
    console.error("Error fetching YouTube subscribers:", error);
    return '0';
  }
}
