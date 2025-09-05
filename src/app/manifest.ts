import { MetadataRoute } from 'next'

// Estas dos líneas son CRÍTICAS para static export
export const dynamic = 'force-static'
export const revalidate = false
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sport ON',
    short_name: 'Sport ON',
    description: 'Gestiona tus reservas de clases con facilidad.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F0F6FF',
    theme_color: '#20C997',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
