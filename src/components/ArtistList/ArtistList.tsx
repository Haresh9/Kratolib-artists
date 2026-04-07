'use client';

import { useState } from 'react';
import { UserArtist } from '@/lib/types';
import ArtistCard from '../ArtistCard/ArtistCard';
import styles from './ArtistList.module.css';

interface Props {
  initialArtists: UserArtist[];
}

export default function ArtistList({ initialArtists }: Props) {
  const [search, setSearch] = useState('');

  const filteredArtists = initialArtists.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container">
      <header className={styles.header}>
        <div className={styles.topLogo}>
          <div className={styles.pill}>Kratolib</div>
        </div>
        <div className={styles.searchContainer}>
          <input 
            type="text" 
            placeholder="Search artists..." 
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className={styles.list}>
        {filteredArtists.length > 0 ? (
          filteredArtists.map((artist, idx) => (
            <div 
              key={artist._id} 
              className="animate-fade-in" 
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <ArtistCard artist={artist} index={idx} />
            </div>
          ))
        ) : (
          <p className={styles.noResults}>No artists found matching your search.</p>
        )}
      </div>
    </div>
  );
}
