// We should ideally read these from environment variables, 
// but using the provided keys from your backend .env for now
const client_id = process.env.SPOTIFY_CLIENT_ID || '6d7b89649fbe457696fd0804e10251a2';
const client_secret = process.env.SPOTIFY_CLIENT_SECRET || '68ed1d80c842467789e87bff21a56d28';
const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

const getAccessToken = async () => {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
    }),
    next: {
      revalidate: 3600, // cache token for 1 hour
    },
  });

  return response.json();
};

export const getArtistTopTracks = async (artistId: string) => {
  try {
    const { access_token } = await getAccessToken();

    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=IN`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      next: {
        revalidate: 3600,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch from Spotify', await response.text());
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching Spotify API:', error);
    return null;
  }
};
