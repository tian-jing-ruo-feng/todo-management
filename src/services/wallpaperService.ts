import type {
  BingApiResponse,
  BingWallpaper,
  WallpaperSettings,
} from '@/types/wallpaper'
import { DEFAULT_WALLPAPER_SETTINGS } from '@/types/wallpaper'

const STORAGE_KEY = 'wallpaper_settings'
// 开发环境使用代理，生产环境直接访问
const BING_API_URL =
  import.meta.env.DEV
    ? '/api/bing/HPImageArchive.aspx?format=js&idx=0&n=8'
    : 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8'
const BING_CDN_URL = 'https://www.bing.com'

/**
 * 壁纸服务
 * 负责 Bing 壁纸 API 调用和用户设置管理
 */
export class WallpaperService {
  /**
   * 获取 Bing 壁纸列表
   */
  static async fetchBingWallpapers(): Promise<BingWallpaper[]> {
    try {
      const response = await fetch(BING_API_URL)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: BingApiResponse = await response.json()

      // 转换为统一的壁纸格式，并拼接完整 URL
      return data.images.map((img) => ({
        url: img.url,
        fullUrl: `${BING_CDN_URL}${img.url}`,
        copyright: img.copyright,
        title: img.title,
        startdate: img.startdate,
      }))
    } catch (error) {
      console.error('获取 Bing 壁纸失败:', error)
      throw error
    }
  }

  /**
   * 获取用户壁纸设置
   */
  static getSettings(): WallpaperSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const settings = JSON.parse(stored) as WallpaperSettings
        // 合并默认值，确保所有字段都存在
        return {
          ...DEFAULT_WALLPAPER_SETTINGS,
          ...settings,
        }
      }
    } catch (error) {
      console.error('读取壁纸设置失败:', error)
    }

    return { ...DEFAULT_WALLPAPER_SETTINGS }
  }

  /**
   * 保存用户壁纸设置
   */
  static saveSettings(settings: WallpaperSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('保存壁纸设置失败:', error)
    }
  }

  /**
   * 重置壁纸设置为默认值
   */
  static resetSettings(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('重置壁纸设置失败:', error)
    }
  }
}
