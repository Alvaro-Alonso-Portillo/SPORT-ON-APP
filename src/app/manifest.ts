import { type MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sport ON',
    short_name: 'Sport ON',
    description: 'Gestiona tus reservas de clases con facilidad.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F0F6FF',
    theme_color: '#38A3A5',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
