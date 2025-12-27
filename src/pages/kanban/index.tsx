import { useEffect, useState } from 'react'
import KanbanBoard from './KanbanBoard'
import { getAllTasks, initDatabaseWithSampleData } from '@/utils/db'
import type { Task } from '@/utils/db'
import mockTasks from '@/mock/task.json'

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    const loadTasks = async () => {
      try {
        // 初始化数据库并添加示例数据（如果数据库为空）
        await initDatabaseWithSampleData(mockTasks as Task[])
        
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

  return <KanbanBoard tasks={tasks} />
}
