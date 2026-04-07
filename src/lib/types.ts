export interface UserArtist {
  _id: string;
  userId: string;
  name: string;
  spotifyProfile?: any;
  appleMusicProfile?: any;
  youtubeMusicProfile?: any;
  instagramProfile?: any;
  facebookProfile?: any;
  image?: string; // Fallback or from profile
  tagline?: string; // We can show a default description
}
