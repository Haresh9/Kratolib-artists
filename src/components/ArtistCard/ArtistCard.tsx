import Link from 'next/link';
import { UserArtist } from '@/lib/types';
import styles from './ArtistCard.module.css';

interface Props {
  artist: UserArtist;
  index: number;
}

const COLORS = ['var(--card-bg-orange)', 'var(--card-bg-purple)', 'var(--card-bg-blue)'];

export default function ArtistCard({ artist, index }: Props) {
  const color = COLORS[index % COLORS.length];

  // Logic: 1. artist.imageUrl (stored in DB) 
  //        2. Spotify Profile images (if raw object available)
  //        3. Placeholder
  const imageUrl = (artist as any).imageUrl || artist.spotifyProfile?.images?.[0]?.url || artist.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=random&size=128`;

  return (
    <Link href={`/artist/${artist._id}`} className={styles.card} style={{ backgroundColor: color }}>
      <div className={styles.imageContainer}>
        <img src={imageUrl} alt={artist.name} className={styles.artistPhoto} />
      </div>
      <div className={styles.info}>
        <h3 className={styles.artistName}>{artist.name}</h3>
        <p className={styles.tagline}>
          Explore profile and streaming links of {artist.name}.
        </p>
      </div>
    </Link>
  );
}
