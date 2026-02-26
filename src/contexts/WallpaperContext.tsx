import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { WallpaperSettings } from '@/types/wallpaper'
import { WallpaperService } from '@/services/wallpaperService'
import { DEFAULT_WALLPAPER_SETTINGS } from '@/types/wallpaper'

interface WallpaperContextValue {
  settings: WallpaperSettings
  updateSettings: (settings: Partial<WallpaperSettings>) => void
  resetSettings: () => void
}

export const WallpaperContext = createContext<WallpaperContextValue | null>(
  null
)

export function WallpaperProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<WallpaperSettings>(() =>
    WallpaperService.getSettings()
  )

  const updateSettings = useCallback(
    (newSettings: Partial<WallpaperSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings }
        WallpaperService.saveSettings(updated)
        return updated
      })
    },
    []
  )

  const resetSettings = useCallback(() => {
    WallpaperService.resetSettings()
    setSettings({ ...DEFAULT_WALLPAPER_SETTINGS })
  }, [])

  // 监听其他标签页的设置变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wallpaper_settings') {
        setSettings(WallpaperService.getSettings())
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <WallpaperContext.Provider
      value={{ settings, updateSettings, resetSettings }}
    >
      {children}
    </WallpaperContext.Provider>
  )
}
