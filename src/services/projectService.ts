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
   * 同时支持通过 userId 和 email 查询成员关系
   */
  static async getUserProjects(
    userId: string,
    userEmail?: string
  ): Promise<Project[]> {
    // 获取用户作为所有者的项目
    const ownedProjects = await db.projects
      .where('owner')
      .equals(userId)
      .toArray()

    // 获取用户作为成员的项目 - 同时支持 userId 和 email 查询
    const membershipsByUserId = await db.members
      .where('userId')
      .equals(userId)
      .toArray()

    // 如果提供了 email，也通过 email 查询（处理邀请接受后 userId 还未同步的情况）
    let membershipsByEmail: typeof membershipsByUserId = []
    if (userEmail) {
      membershipsByEmail = await db.members
        .where('email')
        .equals(userEmail)
        .toArray()
    }

    // 合并成员记录，去重
    const membershipsMap = new Map()
    ;[...membershipsByUserId, ...membershipsByEmail].forEach((m) => {
      membershipsMap.set(m.id, m)
    })
    const memberships = Array.from(membershipsMap.values())

    const memberRealmIds = memberships.map((m) => m.realmId)

    const memberProjects =
      memberRealmIds.length > 0
        ? await db.projects.where('realmId').anyOf(memberRealmIds).toArray()
        : []

    // 合并并去重
    const allProjects = [...ownedProjects, ...memberProjects]
    const uniqueProjects = Array.from(
      new Map(allProjects.map((p) => [p.id, p])).values()
    )

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
    const realmId = `rlm_${projectId}` // Dexie Cloud realms 表主键需要 "rlm" 前缀
    const now = new Date().toISOString()

    await db.transaction(
      'rw',
      [
        db.projects,
        db.statuses,
        db.priorities,
        db.groups,
        db.members,
        db.realms,
        db.roles,
      ],
      async () => {
        // 创建 realm 记录，Dexie Cloud 需要这个来管理权限
        await db.realms.add({
          realmId,
          name,
          owner: currentUserId,
        })

        // 创建角色权限定义 - Dexie Cloud 权限控制的核心
        // owner: 项目所有者，完全权限
        await db.roles.add({
          realmId,
          name: 'owner',
          owner: currentUserId,
          permissions: {
            manage: '*', // 完全管理权限
          },
        })

        // admin: 管理员，可以管理所有数据
        await db.roles.add({
          realmId,
          name: 'admin',
          owner: currentUserId,
          permissions: {
            manage: '*', // 完全管理权限
          },
        })

        // member: 成员，可以添加和更新任务
        await db.roles.add({
          realmId,
          name: 'member',
          owner: currentUserId,
          permissions: {
            add: ['tasks', 'comments'], // 可以添加任务和评论
            update: {
              tasks: '*', // 可以更新任务的所有字段
              comments: '*', // 可以更新评论
            },
          },
        })

        // 创建项目 - 使用独立的 realmId，创建独立的项目权限域
        await db.projects.add({
          id: projectId,
          name,
          description,
          owner: currentUserId,
          realmId, // 关联到项目专属的 realm
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
            realmId,
            sort: 0,
          },
          {
            id: `${projectId}_status_progress`,
            name: '进行中',
            color: '#1890ff',
            projectId,
            owner: currentUserId,
            realmId,
            sort: 1,
          },
          {
            id: `${projectId}_status_done`,
            name: '已完成',
            color: '#52c41a',
            projectId,
            owner: currentUserId,
            realmId,
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
            realmId,
            sort: 0,
          },
          {
            id: `${projectId}_priority_medium`,
            name: '中',
            color: '#1890ff',
            projectId,
            owner: currentUserId,
            realmId,
            sort: 1,
          },
          {
            id: `${projectId}_priority_high`,
            name: '高',
            color: '#ff4d4f',
            projectId,
            owner: currentUserId,
            realmId,
            sort: 2,
          },
        ])

        // 创建项目成员记录，将创建者添加为项目管理员
        await db.members.add({
          id: `mmb_${projectId}_${currentUserId}`, // Dexie Cloud members 表主键需要 "mmb" 前缀
          userId: currentUserId,
          realmId,
          owner: currentUserId,
          roles: ['owner'], // 使用 owner 角色表示项目所有者
          permissions: {
            manage: '*', // 完全管理权限
          },
        })
      }
    )

    // 等待同步完成
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await db.cloud.sync()

      // 验证项目是否仍然存在
      const project = await db.projects.get(projectId)
      if (!project) {
        console.error('[createProject] 同步后项目丢失！')
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

    try {
      // 删除项目下的所有数据
      await db.transaction(
        'rw',
        [db.projects, db.tasks, db.statuses, db.priorities, db.groups],
        async () => {
          await db.tasks.where('projectId').equals(projectId).delete()
          await db.statuses.where('projectId').equals(projectId).delete()
          await db.priorities.where('projectId').equals(projectId).delete()
          await db.groups.where('projectId').equals(projectId).delete()
          await db.projects.delete(projectId)
        }
      )

      // 等待同步
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await db.cloud.sync()

      // 验证项目是否被删除
      let deletedProject = await db.projects.get(projectId)
      if (!deletedProject) {
        return
      }

      // 如果项目还在，尝试第二次删除
      await db.projects.delete(projectId)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await db.cloud.sync()

      deletedProject = await db.projects.get(projectId)
      if (!deletedProject) {
        return
      }

      // 如果还是失败，尝试删除成员和角色
      if (project.realmId) {
        await db.transaction('rw', [db.members, db.roles], async () => {
          await db.members.where('realmId').equals(project.realmId).delete()
          await db.roles.where('realmId').equals(project.realmId).delete()
        })

        await new Promise((resolve) => setTimeout(resolve, 1000))
        await db.cloud.sync()

        // 最后尝试删除项目
        await db.projects.delete(projectId)
        await new Promise((resolve) => setTimeout(resolve, 500))
        await db.cloud.sync()

        deletedProject = await db.projects.get(projectId)
        if (deletedProject) {
          throw new Error(
            '删除失败：服务器拒绝了删除操作。这可能是 Dexie Cloud 的权限限制，请联系支持。'
          )
        }
      }
    } catch (error) {
      console.error('[deleteProject] 删除失败:', error)
      throw error
    }
  }

  /**
   * 为已存在的项目添加角色权限定义
   * 用于修复旧数据
   */
  static async ensureProjectRoles(realmId: string): Promise<void> {
    // 检查是否已有角色定义
    const existingRoles = await db.roles
      .where('realmId')
      .equals(realmId)
      .toArray()
    if (existingRoles.length > 0) {
      return
    }

    // 获取 realm 的 owner
    const realm = await db.realms.get(realmId)
    const owner = realm?.owner || db.cloud.currentUser.value?.userId || ''

    // 添加角色权限定义
    await db.roles.bulkAdd([
      {
        realmId,
        name: 'owner',
        owner,
        permissions: {
          manage: '*',
        },
      },
      {
        realmId,
        name: 'admin',
        owner,
        permissions: {
          manage: '*',
        },
      },
      {
        realmId,
        name: 'member',
        owner,
        permissions: {
          add: ['tasks', 'comments'],
          update: {
            tasks: '*',
            comments: '*',
          },
        },
      },
    ])

    // 触发同步
    await db.cloud.sync()
  }

  /**
   * 为所有已存在的项目添加角色权限定义
   */
  static async migrateAllProjectRoles(): Promise<void> {
    const projects = await db.projects.toArray()
    for (const project of projects) {
      if (project.realmId) {
        await this.ensureProjectRoles(project.realmId)
      }
    }
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
  const { isLoggedIn: userLoggedIn, userId, email } = useUser()

  return useLiveQuery(async () => {
    if (!userLoggedIn || !userId) {
      return []
    }
    return await ProjectService.getUserProjects(userId, email)
  }, [userLoggedIn, userId, email])
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
