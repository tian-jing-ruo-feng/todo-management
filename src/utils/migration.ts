import db from '@/utils/db'
import { RoleService } from '@/services/roleService'
import { ProjectService } from '@/services/projectService'
import { MemberService } from '@/services/memberService'

/**
 * 数据迁移工具
 * 用于将现有数据迁移到项目中心架构
 */
export class DataMigration {
  /**
   * 执行数据迁移
   * 为当前用户创建默认项目，并迁移所有现有数据
   */
  static async migrateToProjectBased(): Promise<void> {
    const currentUserId = db.cloud.currentUserId
    if (!currentUserId) {
      throw new Error('用户未登录')
    }

    // 检查是否已经迁移过
    const existingProjects = await db.projects
      .where('owner')
      .equals(currentUserId)
      .count()
    if (existingProjects > 0) {
      console.log('数据已经迁移过了，跳过迁移')
      return
    }

    console.log('开始数据迁移...')

    // 1. 初始化角色配置
    await RoleService.initializeRoles()
    console.log('角色配置初始化完成')

    // 2. 创建默认项目
    const defaultProjectId = `project_${currentUserId}_default`
    const now = new Date().toISOString()

    await db.projects.add({
      id: defaultProjectId,
      name: '我的任务',
      description: '默认项目',
      owner: currentUserId,
      realmId: defaultProjectId,
      createTime: now,
      updateTime: now,
    })
    console.log('默认项目创建完成:', defaultProjectId)

    // 3. 迁移状态配置
    const statuses = await db.statuses.toArray()
    for (const status of statuses) {
      await db.statuses.update(status.id, {
        projectId: defaultProjectId,
        realmId: defaultProjectId,
      })
    }
    console.log(`迁移了 ${statuses.length} 个状态配置`)

    // 4. 迁移优先级配置
    const priorities = await db.priorities.toArray()
    for (const priority of priorities) {
      await db.priorities.update(priority.id, {
        projectId: defaultProjectId,
        realmId: defaultProjectId,
      })
    }
    console.log(`迁移了 ${priorities.length} 个优先级配置`)

    // 5. 迁移分组配置
    const groups = await db.groups.toArray()
    for (const group of groups) {
      await db.groups.update(group.id, {
        projectId: defaultProjectId,
        realmId: defaultProjectId,
      })
    }
    console.log(`迁移了 ${groups.length} 个分组配置`)

    // 6. 迁移任务
    const tasks = await db.tasks.toArray()
    for (const task of tasks) {
      await db.tasks.update(task.id, {
        projectId: defaultProjectId,
        realmId: defaultProjectId,
      })
    }
    console.log(`迁移了 ${tasks.length} 个任务`)

    console.log('数据迁移完成！')
  }

  /**
   * 检查是否需要迁移
   */
  static async needsMigration(): Promise<boolean> {
    const currentUserId = db.cloud.currentUserId
    if (!currentUserId) return false

    const existingProjects = await db.projects
      .where('owner')
      .equals(currentUserId)
      .count()
    return existingProjects === 0
  }

  /**
   * 为所有项目添加角色权限定义
   * 用于修复旧数据
   */
  static async migrateProjectRoles(): Promise<void> {
    console.log('[migrateProjectRoles] 开始角色权限迁移...')
    await ProjectService.migrateAllProjectRoles()
    console.log('[migrateProjectRoles] 角色权限迁移完成')
  }
}

/**
 * 应用启动时自动执行迁移
 */
export async function runMigrationIfNeeded(): Promise<void> {
  const needsMigration = await DataMigration.needsMigration()
  if (needsMigration) {
    await DataMigration.migrateToProjectBased()
  }

  // 始终检查并迁移角色权限（用于修复旧数据）
  await DataMigration.migrateProjectRoles()

  // 迁移成员权限
  await MemberService.migrateMemberPermissions()
}
