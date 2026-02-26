/**
 * Bing 壁纸数据结构
 */
export interface BingWallpaper {
  url: string // 图片相对路径
  copyright: string // 版权信息
  title: string // 壁纸标题
  startdate: string // 日期
  fullUrl?: string // 完整 URL（拼接域名后）
}

/**
 * Bing API 响应结构
 */
export interface BingApiResponse {
  images: Array<{
    url: string
    copyright: string
    title: string
    startdate: string
  }>
}

/**
 * 用户壁纸设置
 */
export interface WallpaperSettings {
  enabled: boolean // 是否启用壁纸
  currentUrl: string // 当前壁纸 URL
  blur: number // 模糊度 0-20
  brightness: number // 亮度 0.5-1.5
}

/**
 * 默认壁纸设置
 */
export const DEFAULT_WALLPAPER_SETTINGS: WallpaperSettings = {
  enabled: false,
  currentUrl: '',
  blur: 0,
  brightness: 1,
}
