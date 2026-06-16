import { importListing } from './api-client.js'
import { uploadPlaceImages } from './image-uploader.js'

/**
 * Upload photos and import one scraped place into the app.
 * @param {import('./types.js').ScrapedPlace} scraped
 * @param {string} categoryId
 * @param {{ apiBaseUrl: string; extensionKey: string }} config
 */
export async function importScrapedPlace(scraped, categoryId, config, options = {}) {
  const { allowMissingPhotos = false } = options
  const remotePhotos = scraped.imageUrls || []
  const uploadedImages = remotePhotos.length
    ? await uploadPlaceImages(remotePhotos, config)
    : []

  if (remotePhotos.length > 0 && uploadedImages.length === 0 && !allowMissingPhotos) {
    throw new Error('Aucune photo téléchargée pour ce lieu')
  }

  return importListing({
    name: scraped.name,
    description: scraped.description,
    address: scraped.address,
    categoryId,
    phone: scraped.phone || null,
    website: scraped.website || null,
    city: 'Agadir',
    country: 'MA',
    latitude: scraped.latitude ?? null,
    longitude: scraped.longitude ?? null,
    priceRange: scraped.priceRange || null,
    schemaType: 'Restaurant',
    openingHours: scraped.openingHours || null,
    googleMapsUrl: scraped.googleMapsUrl || null,
    googleRating: scraped.rating ?? null,
    googleReviewCount: scraped.reviewCount ?? null,
    images: uploadedImages,
    reviews: scraped.reviews || [],
    published: true,
    featured: false,
    metaDescription: scraped.description.replace(/<[^>]+>/g, '').slice(0, 160),
  }, config)
}
