import { Metadata } from 'next';
import { getArtistById, getArtistTracks } from '@/lib/api';
import { getArtistTopTracks } from '@/lib/spotify';
import { getArtistYouTubeTracks } from '@/lib/youtube';
import { notFound } from 'next/navigation';
import styles from './ArtistDetail.module.css';

interface Props {
  params: Promise<{ id: string }>;
}

// Icons
const VerifiedIcon = () => (
  <svg className={styles.verifiedBadge} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.5 12.5l-2.4-2.8.6-3.7-3.6-.9-2.1-3.1-3.5 1.5-3.5-1.5-2.1 3.1-3.6.9.6 3.7-2.4 2.8 2.4 2.8-.6 3.7 3.6.9 2.1 3.1 3.5-1.5 3.5 1.5 2.1-3.1 3.6-.9-.6-3.7 2.4-2.8zm-12.7 4.2l-3.8-3.8 1.4-1.4 2.4 2.4 5.9-5.9 1.4 1.4-7.3 7.3z" />
  </svg>
);

const YoutubePlayIcon = () => (
  <svg className={styles.ytPlayIcon} viewBox="0 0 68 48">
    <path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 .13 34 .13s-21.79 0-27.1.142C3.97 1.05 2.26 3.53 1.48 6.46 0 11.75 0 24 0 24s0 12.25 1.48 17.54c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 47.87 34 47.87s21.79 0 27.1-.14c2.93-.78 4.64-3.26 5.42-6.19C68 36.25 68 24 68 24s0-12.25-1.48-17.54z" />
  </svg>
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const artist = await getArtistById(id);

  if (!artist) {
    return {
      title: 'Artist Not Found',
    };
  }

  return {
    title: `${artist.name} on Apple Music`,
    description: `Listen to music by ${artist.name}`,
  };
}

export default async function ArtistPage({ params }: Props) {
  const { id } = await params;
  const artist = await getArtistById(id);

  if (!artist) {
    notFound();
  }

  // Smart URL extraction
  const extractUrl = (profile: any) => {
    if (!profile) return null;
    if (typeof profile === 'string') {
      return profile.startsWith('http') ? profile : null;
    }
    return profile.external_urls?.spotify || profile.url || null;
  };

  const imageUrl = (artist as any).imageUrl || artist.spotifyProfile?.images?.[0]?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=random&size=1024`;

  // Actually load the real releases for this artist from backend!
  const backendTracks = await getArtistTracks(id);

  // Search for artist's specific profile info inside the track metadata
  const trackArtistData = backendTracks[0]?.primaryArtists?.find((a: any) => a.name === artist.name) || {};

  const spotifyUrl = extractUrl(artist.spotifyProfile) || extractUrl(trackArtistData.spotifyProfile) || extractUrl(backendTracks[0]?.spotifyProfile);
  const appleUrl = extractUrl(artist.appleMusicProfile) || extractUrl(trackArtistData.appleMusicProfile) || extractUrl(backendTracks[0]?.appleMusicProfile);
  const youtubeUrl = extractUrl(artist.youtubeMusicProfile) || extractUrl(trackArtistData.youtubeMusicProfile) || extractUrl(backendTracks[0]?.youtubeMusicProfile);
  const instaUrl = extractUrl(artist.instagramProfile) || extractUrl(trackArtistData.instagramProfile) || extractUrl(backendTracks[0]?.instagramProfile);
  const fbUrl = extractUrl(artist.facebookProfile) || extractUrl(trackArtistData.facebookProfile) || extractUrl(backendTracks[0]?.facebookProfile);
  const ytTrackUrl = 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=500';
  
  console.log("=== BACKEND TRACKS DATA ===");
  console.log(JSON.stringify(backendTracks, null, 2));

  let spotifyArtistId = null;
  if (spotifyUrl) {
    const match = spotifyUrl.match(/artist\/([a-zA-Z0-9]+)/);
    if (match) {
      spotifyArtistId = match[1];
    }
  }

  let displayTracks = backendTracks.map((t: any, i: number) => ({
    title: t.title,
    plays: (708849 - (i * 125301)).toLocaleString(),
    duration: `4:0${6 - (i % 6)}`,
    image: t.coverArt?.url || "https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?q=80&w=150",
    primaryArtists: t.primaryArtists
  }));

  // Fallback to fetching directly from Spotify API if no tracks exist in backend
  if (displayTracks.length === 0 && spotifyArtistId) {
    const spotifyData = await getArtistTopTracks(spotifyArtistId);
    if (spotifyData?.tracks) {
      displayTracks = spotifyData.tracks.slice(0, 5).map((t: any) => {
        const minutes = Math.floor(t.duration_ms / 60000);
        const seconds = ((t.duration_ms % 60000) / 1000).toFixed(0);
        return {
          title: t.name,
          plays: (t.popularity * 10000).toLocaleString(), // Popularity metric scaled to look like streams
          duration: `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`,
          image: t.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?q=80&w=150",
        };
      });
    }
  }
  // Fetch Live YouTube Tracks
  let youtubeTracks: any[] = [];
  if (youtubeUrl) {
    youtubeTracks = await getArtistYouTubeTracks(youtubeUrl);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>

        {/* 1. Unified Main Card (Image + Info) */}
        <div className={styles.mainCard}>
          <img src={imageUrl} alt={artist.name} className={styles.heroImg} />

          <div className={styles.infoContent}>
            <h1 className={styles.name}>{artist.name}</h1>
            <div className={styles.tagsRow}>Music | Acting | Lifestyle</div>
            <a href="#" className={styles.aboutLink}>About me</a>

            <div className={styles.pillsRow}>
              <span className={styles.pill}>🎭 Actor</span>
              <span className={styles.pill}>🎸 Musician</span>
            </div>
          </div>
        </div>

        {/* 3. Horizontal Social Statistics Cards */}
        <div className={styles.socialGrid}>
          {instaUrl && (
            <a href={instaUrl} target="_blank" rel="noreferrer" className={styles.socialCard}>
              <div className={styles.socialHeader}>
                <div className={styles.socialIconWrapper}>
                  📸 <span className={styles.socialFollowers}>1.13M</span>
                </div>
                <VerifiedIcon />
              </div>
              <div className={styles.socialHandle}>@{artist.name.toLowerCase().replace(/\s/g, '')}</div>
              <div className={styles.socialBtn}>Follow</div>
            </a>
          )}

          {youtubeUrl && (
            <a href={youtubeUrl} target="_blank" rel="noreferrer" className={styles.socialCard}>
              <div className={styles.socialHeader}>
                <div className={styles.socialIconWrapper}>
                  📺 <span className={styles.socialFollowers}>683K</span>
                </div>
              </div>
              <div className={styles.socialHandle}>@{artist.name.replace(/\s/g, '')}YT</div>
              <div className={styles.socialBtn}>Subscribe</div>
            </a>
          )}

          {fbUrl && (
            <a href={fbUrl} target="_blank" rel="noreferrer" className={styles.socialCard}>
              <div className={styles.socialHeader}>
                <div className={styles.socialIconWrapper}>
                  👥 <span className={styles.socialFollowers}>800K</span>
                </div>
                <VerifiedIcon />
              </div>
              <div className={styles.socialHandle}>@{artist.name.replace(/\s/g, '')}</div>
              <div className={styles.socialBtn}>Follow</div>
            </a>
          )}
        </div>



        {instaUrl && (
          <div className={styles.sectionBlock}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '20px' }}>{artist.name} on Instagram</h2>
            <div className={styles.spotifyEmbedWrapper}>
              <div className={styles.spotifyHeader}>
                <img
                  src={backendTracks[0]?.primaryArtists?.find((a: any) => a.name === artist.name)?.spotifyProfile?.image || imageUrl}
                  alt={artist.name}
                  className={styles.spotifyAvatar}
                />
                <div className={styles.spotifyHeaderInfo}>
                  <h2 className={styles.spotifyArtistName}>{artist.name.toUpperCase()}</h2>
                  <p className={styles.spotifyListeners}>Instagram Profile</p>
                </div>
              </div>

              <h3 className={styles.spotifyPopularTitle} style={{ marginTop: '20px', marginBottom: '16px' }}>Posts</h3>
              <div className={styles.instaGrid}>
                <a href={instaUrl} target="_blank" rel="noreferrer" className={styles.instaTile} style={{ backgroundImage: `url('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400')` }}>
                  <svg className={styles.instaIcon} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16.5l6-4.5-6-4.5v9z" />
                  </svg>
                </a>
                <a href={instaUrl} target="_blank" rel="noreferrer" className={styles.instaTile} style={{ backgroundImage: `url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400')` }}></a>
                <a href={instaUrl} target="_blank" rel="noreferrer" className={styles.instaTile} style={{ backgroundImage: `url('https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400')` }}></a>
                <a href={instaUrl} target="_blank" rel="noreferrer" className={styles.instaTile} style={{ backgroundImage: `url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400')` }}></a>
              </div>
            </div>
          </div>
        )}

        {spotifyUrl && (
          <div className={styles.sectionBlock}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '20px' }}>{artist.name} on Spotify</h2>
            <div className={styles.spotifyEmbedWrapper}>
              <div className={styles.spotifyHeader}>
                {/* Extract exact Spotify platform image from real backend track metadata if available */}
                <img
                  src={backendTracks[0]?.primaryArtists?.find((a: any) => a.name === artist.name)?.spotifyProfile?.image || imageUrl}
                  alt={artist.name}
                  className={styles.spotifyAvatar}
                />
                <div className={styles.spotifyHeaderInfo}>
                  <h2 className={styles.spotifyArtistName}>{artist.name.toUpperCase()}</h2>
                  <p className={styles.spotifyListeners}>Spotify Artist</p>
                </div>
              </div>

              <h3 className={styles.spotifyPopularTitle}>Popular</h3>
              <div className={styles.spotifyListWrapper}>
                {displayTracks.length > 0 ? (
                  displayTracks.map((track, i) => (
                    <a key={i} href={spotifyUrl || '#'} target="_blank" rel="noreferrer" className={styles.spotifyTrackRow}>
                      <div className={styles.spotifyTrackIndex}>
                        <span className={styles.indexNum}>{i + 1}</span>
                        <svg className={styles.playHoverIcon} viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ display: 'none' }}><path d="M8 5v14l11-7z" /></svg>
                      </div>
                      <img
                        src={track.image}
                        alt={track.title}
                        className={styles.spotifyTrackImg}
                      />
                      <div className={styles.spotifyTrackInfo}>
                        <p className={styles.spotifyTrackTitle}>{track.title}</p>
                      </div>
                      <div className={styles.spotifyTrackStreams}>{track.plays}</div>
                      <div className={styles.spotifyTrackDuration}>{track.duration}</div>
                    </a>
                  ))
                ) : (
                  <div style={{ color: '#a7a7a7', padding: '20px', textAlign: 'center', fontSize: '14px' }}>
                    No tracks found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {appleUrl && (
          <div className={styles.sectionBlock}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '20px' }}>{artist.name} on Apple Music</h2>
            <div className={styles.spotifyEmbedWrapper}>
              <div className={styles.spotifyHeader}>
                <img
                  src={backendTracks[0]?.primaryArtists?.find((a: any) => a.name === artist.name)?.appleMusicProfile?.image || backendTracks[0]?.primaryArtists?.find((a: any) => a.name === artist.name)?.spotifyProfile?.image || imageUrl}
                  alt={artist.name}
                  className={styles.spotifyAvatar}
                />
                <div className={styles.spotifyHeaderInfo}>
                  <h2 className={styles.spotifyArtistName}>{artist.name.toUpperCase()}</h2>
                  <p className={styles.spotifyListeners}>Apple Music Artist</p>
                </div>
              </div>

              <h3 className={styles.spotifyPopularTitle}>Top Songs</h3>
              <div className={styles.spotifyListWrapper}>
                {displayTracks.length > 0 ? (
                  displayTracks.map((track, i) => (
                    <a key={i} href={appleUrl || '#'} target="_blank" rel="noreferrer" className={styles.spotifyTrackRow}>
                      <div className={styles.spotifyTrackIndex}>
                        <span className={styles.indexNum}>{i + 1}</span>
                        <svg className={styles.playHoverIcon} viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ display: 'none' }}><path d="M8 5v14l11-7z" /></svg>
                      </div>
                      <img
                        src={track.image}
                        alt={track.title}
                        className={styles.spotifyTrackImg}
                      />
                      <div className={styles.spotifyTrackInfo}>
                        <p className={styles.spotifyTrackTitle}>{track.title}</p>
                      </div>
                      <div className={styles.spotifyTrackStreams}>{track.plays}</div>
                      <div className={styles.spotifyTrackDuration}>{track.duration}</div>
                    </a>
                  ))
                ) : (
                  <div style={{ color: '#a7a7a7', padding: '20px', textAlign: 'center', fontSize: '14px' }}>
                    No tracks found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {youtubeUrl && (
          <div className={styles.sectionBlock}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '20px' }}>{artist.name} on YouTube</h2>
            <div className={styles.spotifyEmbedWrapper}>
              <div className={styles.spotifyHeader}>
                <img
                  src={backendTracks[0]?.primaryArtists?.find((a: any) => a.name === artist.name)?.youtubeMusicProfile?.image || backendTracks[0]?.primaryArtists?.find((a: any) => a.name === artist.name)?.spotifyProfile?.image || imageUrl}
                  alt={artist.name}
                  className={styles.spotifyAvatar}
                />
                <div className={styles.spotifyHeaderInfo}>
                  <h2 className={styles.spotifyArtistName}>{artist.name.toUpperCase()}</h2>
                  <p className={styles.spotifyListeners}>YouTube Profile</p>
                </div>
              </div>

              {youtubeTracks.length > 0 ? (
                <>
                  <h3 className={styles.spotifyPopularTitle} style={{ marginTop: '20px', marginBottom: '16px' }}>Latest Release</h3>
                  <a href={`https://www.youtube.com/watch?v=${youtubeTracks[0].id}`} target="_blank" rel="noreferrer" className={styles.ytLargeCard}>
                    <div className={styles.ytThumbWrapper} style={{ backgroundImage: `url('${youtubeTracks[0].thumbnail}')`, aspectRatio: '16/10', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                      <YoutubePlayIcon />
                    </div>
                    <div className={styles.ytLargeInfo}>
                      <p className={styles.ytTitle}>{youtubeTracks[0].title}</p>
                    </div>
                  </a>

                  {youtubeTracks.length > 1 && (
                    <>
                      <h3 className={styles.spotifyPopularTitle} style={{ marginTop: '30px', marginBottom: '16px' }}>More Tracks</h3>
                      <div className={styles.ytGrid}>
                        {youtubeTracks.slice(1, 3).map((track: any, i: number) => (
                          <a key={i} href={`https://www.youtube.com/watch?v=${track.id}`} target="_blank" rel="noreferrer" className={styles.ytCard}>
                            <div className={styles.ytThumbWrapper} style={{ backgroundImage: `url('${track.thumbnail}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                              <YoutubePlayIcon />
                            </div>
                            <div className={styles.ytInfo}>
                              <p className={styles.ytTitle}>{track.title}</p>
                              <p className={styles.ytSub}>{artist.name}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : displayTracks.length > 0 ? (
                <>
                  <h3 className={styles.spotifyPopularTitle} style={{ marginTop: '20px', marginBottom: '16px' }}>Latest Release</h3>
                  <a href={youtubeUrl || '#'} target="_blank" rel="noreferrer" className={styles.ytLargeCard}>
                    <div className={styles.ytThumbWrapper} style={{ backgroundImage: `url('${displayTracks[0].image}')`, aspectRatio: '16/10', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                      <YoutubePlayIcon />
                    </div>
                    <div className={styles.ytLargeInfo}>
                      <p className={styles.ytTitle}>{artist.name.toUpperCase()} - {displayTracks[0].title} (Official Audio)</p>
                    </div>
                  </a>

                  {displayTracks.length > 1 && (
                    <>
                      <h3 className={styles.spotifyPopularTitle} style={{ marginTop: '30px', marginBottom: '16px' }}>More Tracks</h3>
                      <div className={styles.ytGrid}>
                        {displayTracks.slice(1, 3).map((track: any, i: number) => (
                          <a key={i} href={youtubeUrl || '#'} target="_blank" rel="noreferrer" className={styles.ytCard}>
                            <div className={styles.ytThumbWrapper} style={{ backgroundImage: `url('${track.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                              <YoutubePlayIcon />
                            </div>
                            <div className={styles.ytInfo}>
                              <p className={styles.ytTitle}>{artist.name} - {track.title}</p>
                              <p className={styles.ytSub}>{artist.name}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div style={{ color: '#a7a7a7', padding: '20px', fontSize: '14px' }}>No videos found</div>
              )}
            </div>
          </div>
        )}

        <footer className={styles.footer}>
          <a href="/" className={styles.backButton}>← Back to Artists</a>
        </footer>
      </div>
    </div>
  );
}
