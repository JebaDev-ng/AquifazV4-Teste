export const FEATURE_BUCKETS = ['hero', 'banners', 'categories', 'products'] as const

export const ALLOWED_BUCKETS = new Set<string>(FEATURE_BUCKETS)

export type UploadBucket = (typeof FEATURE_BUCKETS)[number]
