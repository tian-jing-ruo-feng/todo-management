import { Modal, Switch, Slider, Spin, message, Button } from 'antd'
import { useEffect, useState } from 'react'
import { WallpaperService } from '@/services/wallpaperService'
import type { BingWallpaper, WallpaperSettings } from '@/types/wallpaper'
import { ReloadOutlined } from '@ant-design/icons'

interface WallpaperModalProps {
  visible: boolean
  onClose: () => void
  settings: WallpaperSettings
  onUpdateSettings: (settings: Partial<WallpaperSettings>) => void
  onResetSettings: () => void
}

export default function WallpaperModal({
  visible,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
}: WallpaperModalProps) {
  const [loading, setLoading] = useState(false)
  const [wallpapers, setWallpapers] = useState<BingWallpaper[]>([])
  const [previewUrl, setPreviewUrl] = useState<string>('')

  // 加载 Bing 壁纸列表
  useEffect(() => {
    if (visible) {
      // 优先使用已设置的壁纸作为预览
      if (settings.currentUrl) {
        setPreviewUrl(settings.currentUrl)
      }
      loadWallpapers()
    }
  }, [visible, settings.currentUrl])

  const loadWallpapers = async () => {
    setLoading(true)
    try {
      const data = await WallpaperService.fetchBingWallpapers()
      setWallpapers(data)
      // 如果没有设置当前壁纸，设置第一张为预览
      if (!settings.currentUrl && data.length > 0) {
        setPreviewUrl(data[0].fullUrl || '')
      }
    } catch (error) {
      message.error('获取壁纸列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectWallpaper = (wallpaper: BingWallpaper) => {
    setPreviewUrl(wallpaper.fullUrl || '')
    onUpdateSettings({ currentUrl: wallpaper.fullUrl || '', enabled: true })
  }

  const handleEnableChange = (checked: boolean) => {
    onUpdateSettings({ enabled: checked })
  }

  const handleBlurChange = (value: number) => {
    onUpdateSettings({ blur: value })
  }

  const handleBrightnessChange = (value: number) => {
    onUpdateSettings({ brightness: value })
  }

  const handleReset = () => {
    onResetSettings()
    setPreviewUrl('')
    message.success('已恢复默认设置')
  }

  return (
    <Modal
      title="壁纸设置"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnHidden
    >
      <div className="flex flex-col gap-6">
        {/* 启用开关 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">启用动态壁纸</div>
            <div className="text-sm text-gray-500">
              开启后将使用 Bing 每日壁纸作为网站背景
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onChange={handleEnableChange}
            checkedChildren="开启"
            unCheckedChildren="关闭"
          />
        </div>

        {/* 壁纸列表 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">选择壁纸</div>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={loadWallpapers}
              loading={loading}
            >
              刷新
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Spin size="large" />
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto p-2">
              {wallpapers.map((wallpaper, index) => (
                <div
                  key={index}
                  className={`
                    relative cursor-pointer rounded-lg overflow-hidden
                    transition-all duration-200 hover:shadow-lg
                    ${
                      settings.currentUrl === wallpaper.fullUrl
                        ? 'ring-2 ring-blue-500 ring-offset-2'
                        : ''
                    }
                  `}
                  onClick={() => handleSelectWallpaper(wallpaper)}
                >
                  <img
                    src={wallpaper.fullUrl}
                    alt={wallpaper.title}
                    className="w-full h-24 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                    {wallpaper.title}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 效果调节 */}
        {settings.enabled && (
          <>
            <div>
              <div className="font-medium mb-2">模糊度</div>
              <Slider
                min={0}
                max={20}
                value={settings.blur}
                onChange={handleBlurChange}
                marks={{ 0: '清晰', 10: '适中', 20: '模糊' }}
              />
            </div>

            <div>
              <div className="font-medium mb-2">亮度</div>
              <Slider
                min={0.5}
                max={1.5}
                step={0.1}
                value={settings.brightness}
                onChange={handleBrightnessChange}
                marks={{ 0.5: '暗', 1.0: '正常', 1.5: '亮' }}
              />
            </div>
          </>
        )}

        {/* 预览 */}
        {settings.enabled && previewUrl && (
          <div>
            <div className="font-medium mb-2">预览效果</div>
            <div
              className="w-full h-40 rounded-lg overflow-hidden relative"
              style={{
                backgroundImage: `url(${previewUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: `blur(${settings.blur}px) brightness(${settings.brightness})`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center bg-white/20">
                <div className="text-white font-medium text-lg">
                  TaskFlow 任务管理
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 重置按钮 */}
        <div className="flex justify-end">
          <Button onClick={handleReset}>恢复默认</Button>
        </div>
      </div>
    </Modal>
  )
}
