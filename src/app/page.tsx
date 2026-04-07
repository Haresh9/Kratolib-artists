import { getAllArtists } from '@/lib/api';
import ArtistList from '@/components/ArtistList/ArtistList';

interface Props {
  searchParams: Promise<{ userId?: string }>;
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const userId = params?.userId;
  
  const artists = await getAllArtists(userId);

  return (
    <main>
      <ArtistList initialArtists={artists} />
    </main>
  );
}
