import { Button, message } from 'antd'
import { useObservable } from 'dexie-react-hooks'
import db from '../utils/db'

export default function UserInfo(props: { login: () => void }) {
  const { login } = props
  const user = useObservable(db.cloud.currentUser)
  async function handleUserLogin() {
    if (user?.isLoggedIn) {
      db.cloud.logout().then(() => {
        message.success('退出成功')
        location.reload()
      })
    } else {
      login()
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
          <Button type="primary" onClick={handleUserLogin}>
            {user?.isLoggedIn ? '退出' : '登录'}
          </Button>
        </>
      </div>
    </div>
  )
}
