export interface UploadedImageMeta {
  url: string
  storagePath: string
  bucket: string
  reused?: boolean
  checksum?: string
  width?: number
  height?: number
  mime_type?: string
}
