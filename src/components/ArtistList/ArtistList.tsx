'use client';

import { useState } from 'react';
import { UserArtist } from '@/lib/types';
import ArtistCard from '../ArtistCard/ArtistCard';
import styles from './ArtistList.module.css';

interface Props {
  initialArtists: UserArtist[];
}

const CATEGORIES = ['All', 'Hip Hop', 'Pop', 'Indie', 'Rock', 'Electronic'];

const SortIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18M6 12h12M10 18h4"></path>
    </svg>
);

const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="M21 21l-4.35-4.35"></path>
    </svg>
);

const FilterIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16v2L12 13v7l-4-3v-4L4 6V4z"></path>
    </svg>
);

export default function ArtistList({ initialArtists }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredArtists = initialArtists.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.topBar}>
          <div className={styles.logoGroup}>
            <div className={styles.logoIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#9D4EDD"/>
                <path d="M2 17L12 22L22 17" stroke="#9D4EDD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="#9D4EDD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className={styles.logoName}>Kratolib</span>
          </div>
          <div className={styles.bellIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
        </div>

        <div className={styles.searchSection}>
            <div className={styles.searchBarWrapper}>
                <SearchIcon />
                <input 
                    type="text" 
                    placeholder="Search artists, songs, genres..." 
                    className={styles.searchInput}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className={styles.filterBtn}>
                <FilterIcon />
            </div>
        </div>

        <div className={styles.heroSection}>
            <h2 className={styles.heroEyebrow}>Discover</h2>
            <h1 className={styles.heroTitle}>
                Amazing Artists
                <span className={styles.audioWave}>
                    <span></span><span></span><span></span><span></span>
                </span>
            </h1>
            <p className={styles.heroSubtitle}>Explore independent music and support real talent.</p>
        </div>

        <div className={styles.categories}>
            {CATEGORIES.map(cat => (
                <button 
                    key={cat} 
                    className={`${styles.categoryPill} ${activeCategory === cat ? styles.active : ''}`}
                    onClick={() => setActiveCategory(cat)}
                >
                    {cat}
                </button>
            ))}
        </div>
      </header>

      <div className={styles.listContainer}>
        <div className={styles.listHeader}>
            <h2 className={styles.listTitle}>All Artists</h2>
            <div className={styles.sortBtn}>
                <span>Sort</span>
                <SortIcon />
            </div>
        </div>

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
    </div>
  );
}
