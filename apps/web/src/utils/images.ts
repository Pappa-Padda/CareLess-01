const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const getImageUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  
  // If it's already a full URL, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // If it's a relative path starting with /, prepend API URL
  if (path.startsWith('/')) {
    return `${API_URL}${path}`;
  }
  
  // Otherwise, assume it needs /uploads prefix if it's just a filename?
  // But based on userController, it starts with /uploads
  return `${API_URL}/${path}`;
};
