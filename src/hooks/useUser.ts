import { useObservable } from 'dexie-react-hooks'
import db from '@/utils/db'

/**
 * 判断用户是否真正登录（排除 'unauthorized' 情况）
 */
export const isLoggedIn = (userId: string | undefined): boolean => {
  return !!userId && userId !== 'unauthorized'
}

/**
 * Hook: 获取当前用户信息和登录状态
 */
export function useUser() {
  const user = useObservable(db.cloud.currentUser)

  return {
    user,
    userId: user?.userId,
    isLoggedIn: isLoggedIn(user?.userId),
    name: user?.name,
    email: user?.email,
  }
}
