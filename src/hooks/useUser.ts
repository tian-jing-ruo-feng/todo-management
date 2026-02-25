import { useObservable } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import db from '@/utils/db'

/**
 * Hook: 获取当前用户信息和登录状态
 *
 * 使用 Dexie Cloud 提供的 UserLogin.isLoggedIn 属性判断登录状态
 * 该属性由 Dexie Cloud 内部管理，会在检测到有效 token 时自动设为 true
 */
export function useUser() {
  const user = useObservable(db.cloud.currentUser)
  const [hasStoredLogin, setHasStoredLogin] = useState<boolean | null>(null)

  // 检查是否有存储的登录信息
  useEffect(() => {
    const checkStoredLogin = async () => {
      try {
        const loginsTable = db.table('$logins')
        if (loginsTable) {
          const logins = await loginsTable.toArray()
          setHasStoredLogin(logins.length > 0)
        } else {
          setHasStoredLogin(false)
        }
      } catch (error) {
        console.error('[useUser] 检查登录数据失败:', error)
        setHasStoredLogin(false)
      }
    }
    checkStoredLogin()
  }, [])

  // 判断是否正在加载：
  // user 为 undefined 表示 currentUser Observable 还未发射值
  // 或者有存储的登录信息但 currentUser 还未准备好
  const isLoading =
    user === undefined ||
    hasStoredLogin === null ||
    (hasStoredLogin && user === undefined)

  // 使用 Dexie Cloud 提供的 isLoggedIn 属性
  // 这是官方推荐的方式，Dexie Cloud 会自动管理这个状态
  const isLoggedIn = user?.isLoggedIn ?? false

  // 判断是否正在恢复登录状态：
  // 有存储的登录数据但尚未登录成功
  const isRestoring = hasStoredLogin === true && !isLoggedIn

  return {
    user,
    userId: user?.userId,
    isLoggedIn,
    isLoading,
    isRestoring,
    name: user?.name,
    email: user?.email,
  }
}
