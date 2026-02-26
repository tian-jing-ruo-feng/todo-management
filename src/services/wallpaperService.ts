import type {
  BingApiResponse,
  BingWallpaper,
  WallpaperSettings,
} from '@/types/wallpaper'
import { DEFAULT_WALLPAPER_SETTINGS } from '@/types/wallpaper'

const STORAGE_KEY = 'wallpaper_settings'
// Bing API URL
const BING_API_URL =
  'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8'
const BING_CDN_URL = 'https://www.bing.com'
// CORS 代理服务
const CORS_PROXY_URL = 'https://api.allorigins.win/get?url='

/**
 * 壁纸服务
 * 负责 Bing 壁纸 API 调用和用户设置管理
 */
export class WallpaperService {
  /**
   * 获取 Bing 壁纸列表
   * 使用 CORS 代理解决跨域问题
   */
  static async fetchBingWallpapers(): Promise<BingWallpaper[]> {
    try {
      // 通过 CORS 代理获取数据
      const proxyUrl = `${CORS_PROXY_URL}${encodeURIComponent(BING_API_URL)}`
      const response = await fetch(proxyUrl)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const proxyData = await response.json()
      // allorigins 返回的数据在 contents 字段中
      const data: BingApiResponse = JSON.parse(proxyData.contents)

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
