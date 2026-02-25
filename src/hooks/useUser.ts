import { useObservable } from 'dexie-react-hooks'
import { useEffect } from 'react'
import db from '@/utils/db'

/**
 * Hook: 获取当前用户信息和登录状态
 *
 * 使用 Dexie Cloud 提供的 UserLogin.isLoggedIn 属性判断登录状态
 * 该属性由 Dexie Cloud 内部管理，会在检测到有效 token 时自动设为 true
 */
export function useUser() {
  const user = useObservable(db.cloud.currentUser)

  // 判断是否正在加载：
  // user 为 undefined 表示 currentUser Observable 还未发射值
  const isLoading = user === undefined

  // 使用 Dexie Cloud 提供的 isLoggedIn 属性
  // 这是官方推荐的方式，Dexie Cloud 会自动管理这个状态
  const isLoggedIn = user?.isLoggedIn ?? false

  return {
    user,
    userId: user?.userId,
    isLoggedIn,
    isLoading,
    name: user?.name,
    email: user?.email,
  }
}
