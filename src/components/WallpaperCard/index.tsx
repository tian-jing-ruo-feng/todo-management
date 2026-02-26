import { Card as AntCard, type CardProps } from 'antd'
import { useWallpaper } from '@/contexts/useWallpaper'

interface WallpaperCardProps extends CardProps {
  forceTransparent?: boolean
}

export default function WallpaperCard({
  forceTransparent = false,
  style,
  ...props
}: WallpaperCardProps) {
  const { settings } = useWallpaper()

  const useTransparent = settings.enabled || forceTransparent

  const cardStyle = useTransparent
    ? { ...style, background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(2px)' }
    : style

  return <AntCard style={cardStyle} {...props} />
}
