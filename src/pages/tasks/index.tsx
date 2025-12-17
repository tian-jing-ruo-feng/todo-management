import TaskItem from './TaskItem'
import mockTasks from '@/mock/task.json'


const tasks = mockTasks

export default function index() {
  return (
    <ul>
      {
        tasks.map((task, taskIndex) => <TaskItem task={task} key={taskIndex} />)
      }
    </ul>
  )
}
