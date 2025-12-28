import { statusRepository } from './repositories/StatusRepository'
import { priorityRepository } from './repositories/PriorityRepository'
import { groupRepository } from './repositories/GroupRepository'
import mockStatuses from '../mock/status.json'
import mockPriorities from '../mock/priority.json'
import mockGroups from '../mock/group.json'
import type { Status } from '../types/Status'
import type { Priority } from '../types/Priority'
import type { Group } from '../types/Group'

/**
 * 初始化配置数据（状态、优先级、分组）
 * 仅在数据库为空时添加示例数据
 */
export const initConfigData = async (): Promise<void> => {
  try {
    // 初始化状态数据
    await statusRepository.initWithSampleData(mockStatuses as Status[])

    // 初始化优先级数据
    await priorityRepository.initWithSampleData(mockPriorities as Priority[])

    // 初始化分组数据
    await groupRepository.initWithSampleData(mockGroups as Group[])

    console.log('配置数据初始化完成')
  } catch (error) {
    console.error('初始化配置数据失败:', error)
  }
}
