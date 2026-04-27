export function getCloudinaryUrl(url: string, width: number, quality: 'eco' | 'low' | 'good' | 'best' = 'auto'): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  
  // Example Cloudinary URL:
  // https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg
  // We want to insert transformations after /upload/
  // e.g. /upload/w_400,q_auto:eco/
  
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  
  return `${parts[0]}/upload/w_${width},q_auto:${quality}/${parts[1]}`;
}
