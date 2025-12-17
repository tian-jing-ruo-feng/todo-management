import { Card } from "antd"
import type { Task } from "../../types/Task"

interface TaskItemProps {
  task: Task
}

export default function TaskItem(props: TaskItemProps) {
  return (
    <div>
      <Card>{props.task.name}</Card>
    </div>
  )
}
