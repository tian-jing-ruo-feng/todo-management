import { Button, message } from 'antd'
import { useObservable } from 'dexie-react-hooks'
import db from '../utils/db'

export default function UserInfo() {
  const [messageApi, contextHolder] = message.useMessage()
  const user = useObservable(db.cloud.currentUser)
  async function handleUserLogin() {
    if (user?.isLoggedIn) {
      await db.cloud.logout()
      messageApi.success('退出成功')
    } else {
      db.cloud.login()
      messageApi.success('登录成功')
    }
  }

  return (
    <div className="flex justify-between items-center h-full leading-none">
      <div className="font-bold text-2xl text-white">统一工作管理系统</div>
      <div className="flex items-center gap-4">
        {user?.isLoggedIn && (
          <h2 className="font-bold">
            <span>欢迎，</span>
            {user.name}
          </h2>
        )}
        <>
          {contextHolder}
          <Button type="primary" onClick={handleUserLogin}>
            {user?.isLoggedIn ? '退出' : '登录'}
          </Button>
        </>
      </div>
    </div>
  )
}
