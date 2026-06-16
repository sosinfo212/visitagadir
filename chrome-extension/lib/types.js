/**
 * Shared payload shapes between content script, popup, and API.
 * @typedef {Object} ScrapedReview
 * @property {string} authorName
 * @property {number} rating
 * @property {string} comment
 *
 * @typedef {Object} ScrapedPlace
 * @property {string} name
 * @property {string} description
 * @property {string} address
 * @property {string} [phone]
 * @property {string} [website]
 * @property {string} [email]
 * @property {number} [latitude]
 * @property {number} [longitude]
 * @property {number} [rating]
 * @property {number} [reviewCount]
 * @property {string} [priceRange]
 * @property {string} [googleMapsUrl]
 * @property {string} [placeId]
 * @property {string[]} [imageUrls]
 * @property {Array<{ dayOfWeek: string[]; opens: string; closes: string }>} [openingHours]
 * @property {ScrapedReview[]} [reviews]
 * @property {string} [scrapedAt]
 * @property {string} [sourceUrl]
 */

export {}
