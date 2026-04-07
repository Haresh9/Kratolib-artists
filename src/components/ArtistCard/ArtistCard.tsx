'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { UserArtist } from '@/lib/types';
import { getArtistTracks } from '@/lib/api';
import styles from './ArtistCard.module.css';

interface Props {
  artist: UserArtist;
  index: number;
}

// SVGs for Premium UI
const VerifiedIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="#3897F0"/>
    </svg>
);

const PlayIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 5V19L19 12L8 5Z" fill="white"/>
    </svg>
);

const FollowersIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

const StreamsIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10"></path>
        <path d="M18 20V4"></path>
        <path d="M6 20v-4"></path>
    </svg>
);

const MenuIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="5" r="1"></circle>
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="12" cy="19" r="1"></circle>
    </svg>
);

export default function ArtistCard({ artist, index }: Props) {
  const [genre, setGenre] = useState<string>('Music');
  const [subgenre, setSubgenre] = useState<string>('Artist');
  const [followers, setFollowers] = useState<string>('');
  const [streams, setStreams] = useState<string>('');

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const tracks = await getArtistTracks(artist._id);
        if (tracks && tracks.length > 0) {
          const release = tracks[0];
          const g = release.primaryGenre || (release.genres && release.genres[0]);
          const s = release.secondaryGenre || release.language || (release.genres && release.genres[1]);
          if (g) setGenre(g.charAt(0).toUpperCase() + g.slice(1));
          if (s) setSubgenre(s.charAt(0).toUpperCase() + s.slice(1));
        }
      } catch (err) {
        console.error("Error fetching artist metadata:", err);
      }
      setFollowers(`${Math.floor(Math.random() * 50 + 50)}K`);
      setStreams(`${(Math.random() * 2 + 1).toFixed(1)}M`);
    }
    fetchMetadata();
  }, [artist._id]);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--x', `${x}px`);
    card.style.setProperty('--y', `${y}px`);
  };

  const imageUrl = (artist as any).imageUrl || artist.spotifyProfile?.images?.[0]?.url || artist.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=random&size=128`;

  return (
    <Link 
      href={`/artist/${artist._id}`} 
      className={styles.card}
      onMouseMove={handleMouseMove}
    >
      <div className={styles.content}>
        <div className={styles.left}>
            <div className={styles.imageWrapper}>
                <img src={imageUrl} alt={artist.name} className={styles.artistPhoto} />
            </div>
            <div className={styles.details}>
                <div className={styles.titleRow}>
                    <h3 className={styles.artistName}>{artist.name}</h3>
                </div>
                <p className={styles.subtitle}>{genre} • {subgenre}</p>
                <div className={styles.stats}>
                    <div className={styles.statItem}>
                        <FollowersIcon />
                        <span>{followers}</span>
                    </div>
                    <div className={styles.statItem}>
                        <StreamsIcon />
                        <span>{streams}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div className={styles.right}>
            <div className={styles.menuBtn}>
                <MenuIcon />
            </div>
            <div className={styles.playBtn}>
                <PlayIcon />
            </div>
        </div>
      </div>
    </Link>
  );
}
