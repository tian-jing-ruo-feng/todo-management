import mockTasks from '@/mock/task.json'
import type { Task } from '@/utils/db'
import { getAllTasks, initDatabaseWithSampleData } from '@/utils/db'
import { useEffect, useState } from 'react'
import KanbanBoard from './KanbanBoard'

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([])

  const refreshTasks = async () => {
    // 刷新任务列表
    const allTasks = await getAllTasks()
    setTasks(allTasks)
  }

  useEffect(() => {
    const loadTasks = async () => {
      try {
        // 初始化数据库并添加示例数据（如果数据库为空）
        // await initDatabaseWithSampleData(mockTasks as Task[])
        await initDatabaseWithSampleData([])

        // 从数据库加载所有任务
        const allTasks = await getAllTasks()
        setTasks(allTasks)
      } catch (error) {
        console.error('加载任务失败:', error)
        // 出错时使用 mock 数据
        setTasks(mockTasks as Task[])
      }
    }

    loadTasks()
  }, [])

  return <KanbanBoard tasks={tasks} onUploadSuccess={refreshTasks} />
}
