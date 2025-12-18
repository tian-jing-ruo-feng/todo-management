import { PicLeftOutlined } from '@ant-design/icons'
import { Card } from 'antd'

const statistic = [
  {
    title: '任务总数',
    value: 100,
  },
  {
    title: '待处理',
    value: 10,
  },
  {
    title: '已超时',
    value: 10,
  },
  {
    title: '平均处理',
    value: 10,
  },
]

export default function TaskStatistc() {
  return (
    <Card>
      <div className="flex justify-between flex-row items-center">
        <h2 className="text-[1.5rem] font-bold ">
          <PicLeftOutlined className="mr-2" />
          任务标题
        </h2>
        <ul className="flex justify-around gap-3">
          {statistic.map((item, index) => (
            <li key={index}>
              <p className="text-2xl font-bold">{item.value}</p>
              <h3>{item.title}</h3>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
