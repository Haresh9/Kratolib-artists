export interface InstagramProfile {
  followers: string;
  profilePic: string;
}

export async function getArtistInstagramProfile(username: string): Promise<InstagramProfile> {
  const defaultResult = { followers: '0', profilePic: '' };
  if (!username) return defaultResult;

  const cleanUsername = username.includes('instagram.com/') 
    ? username.split('instagram.com/')[1].split('/')[0].split('?')[0] 
    : username;

  const url = `https://www.instagram.com/${cleanUsername}/`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 }
    });

    const html = await res.text();

    let followers = '0';
    let profilePic = '';

    // 1. Extract Followers from meta description
    // Example: "18.7M Followers, 143 Following, 60 Posts - See Instagram photos and videos from @darshanravaldz"
    const metaDescMatch = html.match(/<meta[^>]*content=["']([^"']*Followers[^"']*)["'][^>]*name=["']description["']/i);
    if (metaDescMatch && metaDescMatch[1]) {
      followers = metaDescMatch[1].split('Followers')[0].trim();
    }

    // 2. Extract Profile Pic from og:image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i) || 
                         html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i);
    if (ogImageMatch && ogImageMatch[1]) {
      profilePic = ogImageMatch[1].replace(/&amp;/g, '&');
    }

    // 3. Fallback: Check for sharedData/initialState for count (if regex on metaDesc was messy)
    if (followers === '0' || !profilePic) {
      const stateMatch = html.match(/window\._sharedData\s*=\s*({[\s\S]*?});/i) || 
                         html.match(/"ProfilePage":\[\{"graphql":\{"user":(\{[\s\S]*?\})\}\}\]/i);
      if (stateMatch && stateMatch[1]) {
        try {
          const user = stateMatch[1].startsWith('{') ? JSON.parse(stateMatch[1]) : JSON.parse('{' + stateMatch[0] + '}');
          const finalUser = user.graphql?.user || user;
          
          if (followers === '0' && finalUser.edge_followed_by?.count) {
            const count = finalUser.edge_followed_by.count;
            if (count >= 1000000) followers = (count / 1000000).toFixed(1) + 'M';
            else if (count >= 1000) followers = (count / 1000).toFixed(1) + 'K';
            else followers = count.toString();
          }
          if (!profilePic) profilePic = finalUser.profile_pic_url_hd || finalUser.profile_pic_url;
        } catch (e) {}
      }
    }

    return { followers, profilePic };
  } catch (error) {
    console.error("Error fetching Instagram profile:", error);
    return defaultResult;
  }
}
