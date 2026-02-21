import db from '@/utils/db'
import type { Project } from '@/types/Project'
import { useLiveQuery } from 'dexie-react-hooks'
import { useUser } from '@/hooks/useUser'

/**
 * 项目服务
 * 提供项目相关的业务逻辑
 */
export class ProjectService {
  /**
   * 获取用户的默认 realmId
   */
  static async getUserRealmId(userId: string): Promise<string> {
    // 查找用户的成员记录，获取第一个 realmId
    const member = await db.members.where('userId').equals(userId).first()
    if (member?.realmId) {
      return member.realmId
    }
    // 如果没有找到，返回一个默认值（Dexie Cloud 会使用用户的默认 realm）
    return 'default'
  }

  /**
   * 获取用户参与的所有项目
   */
  static async getUserProjects(userId: string): Promise<Project[]> {
    console.log('[getUserProjects] 开始查询, userId:', userId)

    // 先检查所有项目的 owner
    const allProjectsInDb = await db.projects.toArray()
    console.log(
      '[getUserProjects] 数据库中所有项目:',
      allProjectsInDb.map((p) => ({ id: p.id, name: p.name, owner: p.owner }))
    )

    // 获取用户作为所有者的项目
    const ownedProjects = await db.projects
      .where('owner')
      .equals(userId)
      .toArray()
    console.log('[getUserProjects] ownedProjects:', ownedProjects.length)

    // 获取用户作为成员的项目
    const memberships = await db.members
      .where('userId')
      .equals(userId)
      .toArray()
    console.log('[getUserProjects] memberships:', memberships.length)
    const memberRealmIds = memberships.map((m) => m.realmId)

    const memberProjects =
      memberRealmIds.length > 0
        ? await db.projects.where('realmId').anyOf(memberRealmIds).toArray()
        : []
    console.log('[getUserProjects] memberProjects:', memberProjects.length)

    // 合并并去重
    const allProjects = [...ownedProjects, ...memberProjects]
    const uniqueProjects = Array.from(
      new Map(allProjects.map((p) => [p.id, p])).values()
    )

    console.log('[getUserProjects] 最终项目数:', uniqueProjects.length)
    return uniqueProjects
  }

  /**
   * 创建新项目
   */
  static async createProject(
    name: string,
    description?: string,
    userId?: string
  ): Promise<string> {
    // 优先使用传入的 userId，否则从 currentUser Observable 获取
    const currentUserId = userId || db.cloud.currentUser.value?.userId
    if (!currentUserId || currentUserId === 'unauthorized') {
      throw new Error('用户未登录，无法创建项目')
    }

    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    console.log(
      '[createProject] 开始创建项目, projectId:',
      projectId,
      'userId:',
      currentUserId
    )

    await db.transaction(
      'rw',
      [db.projects, db.statuses, db.priorities, db.groups],
      async () => {
        // 创建项目 - 使用 projectId 作为 realmId，创建独立的项目权限域
        await db.projects.add({
          id: projectId,
          name,
          description,
          owner: currentUserId,
          realmId: projectId, // 使用项目ID作为 realmId，创建共享的项目 realm
          createTime: now,
          updateTime: now,
        })

        // 初始化默认状态
        await db.statuses.bulkAdd([
          {
            id: `${projectId}_status_todo`,
            name: '待办',
            color: '#999999',
            projectId,
            owner: currentUserId,
            realmId: projectId,
            sort: 0,
          },
          {
            id: `${projectId}_status_progress`,
            name: '进行中',
            color: '#1890ff',
            projectId,
            owner: currentUserId,
            realmId: projectId,
            sort: 1,
          },
          {
            id: `${projectId}_status_done`,
            name: '已完成',
            color: '#52c41a',
            projectId,
            owner: currentUserId,
            realmId: projectId,
            sort: 2,
          },
        ])

        // 初始化默认优先级
        await db.priorities.bulkAdd([
          {
            id: `${projectId}_priority_low`,
            name: '低',
            color: '#999999',
            projectId,
            owner: currentUserId,
            realmId: projectId,
            sort: 0,
          },
          {
            id: `${projectId}_priority_medium`,
            name: '中',
            color: '#1890ff',
            projectId,
            owner: currentUserId,
            realmId: projectId,
            sort: 1,
          },
          {
            id: `${projectId}_priority_high`,
            name: '高',
            color: '#ff4d4f',
            projectId,
            owner: currentUserId,
            realmId: projectId,
            sort: 2,
          },
        ])
      }
    )

    console.log('[createProject] 项目创建完成，等待同步...')

    // 等待同步完成，使用更可靠的方式
    try {
      // 先等待一段时间让本地变更被检测到
      await new Promise((resolve) => setTimeout(resolve, 500))

      // 触发同步并等待完成
      await db.cloud.sync()

      console.log('[createProject] 同步完成')

      // 验证项目是否仍然存在
      const project = await db.projects.get(projectId)
      if (!project) {
        console.error('[createProject] 同步后项目丢失！')
      } else {
        console.log('[createProject] 项目验证成功:', project)
      }
    } catch (error) {
      console.error('[createProject] 同步失败:', error)
    }

    return projectId
  }

  /**
   * 更新项目信息
   */
  static async updateProject(
    projectId: string,
    updates: Partial<Project>
  ): Promise<void> {
    await db.projects.update(projectId, {
      ...updates,
      updateTime: new Date().toISOString(),
    })
  }

  /**
   * 删除项目（需要检查权限）
   */
  static async deleteProject(projectId: string): Promise<void> {
    const project = await db.projects.get(projectId)
    if (!project) {
      throw new Error('项目不存在')
    }

    // 只有项目所有者才能删除项目
    if (project.owner !== db.cloud.currentUserId) {
      throw new Error('只有项目所有者才能删除项目')
    }

    await db.transaction(
      'rw',
      [
        db.projects,
        db.tasks,
        db.statuses,
        db.priorities,
        db.groups,
        db.members,
      ],
      async () => {
        // 删除项目下的所有任务
        await db.tasks.where('projectId').equals(projectId).delete()

        // 删除项目下的所有配置
        await db.statuses.where('projectId').equals(projectId).delete()
        await db.priorities.where('projectId').equals(projectId).delete()
        await db.groups.where('projectId').equals(projectId).delete()

        // 删除项目成员
        await db.members.where('realmId').equals(project.realmId).delete()

        // 删除项目
        await db.projects.delete(projectId)
      }
    )
  }

  /**
   * 获取项目详情
   */
  static async getProject(projectId: string): Promise<Project | undefined> {
    return db.projects.get(projectId)
  }

  /**
   * 检查用户是否有权限访问项目
   */
  static async checkProjectAccess(
    projectId: string,
    userId: string
  ): Promise<boolean> {
    const project = await db.projects.get(projectId)
    if (!project) return false

    // 如果是项目所有者
    if (project.owner === userId) return true

    // 如果是项目成员
    const member = await db.members
      .where({ realmId: project.realmId, userId })
      .first()

    return !!member
  }

  /**
   * 获取用户在项目中的角色
   */
  static async getUserRole(
    projectId: string,
    userId: string
  ): Promise<string | null> {
    const project = await db.projects.get(projectId)
    if (!project) return null

    // 如果是项目所有者，返回 admin 角色
    if (project.owner === userId) return 'admin'

    // 查找成员记录
    const member = await db.members
      .where({ realmId: project.realmId, userId })
      .first()

    return member?.roles?.[0] || null
  }
}

/**
 * Hook: 获取当前用户的所有项目
 */
export function useProjects() {
  const { isLoggedIn: userLoggedIn, userId } = useUser()

  console.log('[useProjects] 状态:', { userLoggedIn, userId })

  return useLiveQuery(async () => {
    console.log(
      '[useProjects] 查询执行, userLoggedIn:',
      userLoggedIn,
      'userId:',
      userId
    )
    if (!userLoggedIn || !userId) {
      console.log('[useProjects] 条件不满足，返回空数组')
      return []
    }
    const projects = await ProjectService.getUserProjects(userId)
    console.log('[useProjects] 查询结果:', projects.length, '个项目')
    return projects
  }, [userLoggedIn, userId])
}

/**
 * Hook: 获取单个项目
 */
export function useProject(projectId: string | undefined) {
  return useLiveQuery(() => {
    if (!projectId) return undefined
    return ProjectService.getProject(projectId)
  }, [projectId])
}

/**
 * Hook: 获取用户在项目中的权限
 */
export function useProjectPermission(projectId: string | undefined) {
  const { userId, isLoggedIn: userLoggedIn } = useUser()

  return useLiveQuery(async () => {
    if (!projectId || !userLoggedIn) {
      return {
        isOwner: false,
        role: null,
        canManageMembers: false,
        canEditTasks: false,
        canDeleteProject: false,
      }
    }

    const project = await db.projects.get(projectId)
    if (!project) {
      return {
        isOwner: false,
        role: null,
        canManageMembers: false,
        canEditTasks: false,
        canDeleteProject: false,
      }
    }

    const isOwner = project.owner === userId
    const role = await ProjectService.getUserRole(projectId, userId!)

    return {
      isOwner,
      role,
      canManageMembers: isOwner || role === 'admin',
      canEditTasks: isOwner || role === 'admin' || role === 'member',
      canDeleteProject: isOwner,
    }
  }, [projectId, userId, userLoggedIn])
}
