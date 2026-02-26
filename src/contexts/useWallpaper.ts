import { useContext } from 'react'
import { WallpaperContext } from './WallpaperContext'

export function useWallpaper() {
  const context = useContext(WallpaperContext)
  if (!context) {
    throw new Error('useWallpaper must be used within WallpaperProvider')
  }
  return context
}
