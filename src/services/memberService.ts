import db from '@/utils/db'
import type { DBRealmMember, Invite } from 'dexie-cloud-addon'
import { useLiveQuery } from 'dexie-react-hooks'
import { useObservable } from 'dexie-react-hooks'

/**
 * 角色权限映射
 * Dexie Cloud 权限控制：
 * - manage: 完全管理权限，可以编辑领域内任何数据
 * - update: 只能编辑自己是 owner 的数据
 * - add: 可以创建新数据
 */
const ROLE_PERMISSIONS: Record<string, DBRealmMember['permissions']> = {
  owner: {
    add: '*', // 允许添加所有表
    update: '*', // 允许更新所有字段
    manage: '*', // 完全管理权限
  },
  admin: {
    add: '*',
    update: '*',
    manage: '*', // 完全管理权限
  },
  member: {
    add: ['tasks'], // 可以创建任务
    update: {
      tasks: ['name', 'description', 'status', 'priority', 'groupId', 'assignee', 'dueDate', 'tags'], // 只能更新自己拥有的任务
    },
    // 注意：不授予 manage 权限，成员只能编辑 owner 是自己的任务
  },
  guest: {
    // 访客只有查看权限，无编辑权限
  },
}

/**
 * 成员服务
 * 提供成员管理相关的业务逻辑
 */
export class MemberService {
  /**
   * 获取项目的所有成员
   */
  static async getProjectMembers(projectId: string): Promise<DBRealmMember[]> {
    const project = await db.projects.get(projectId)
    if (!project) return []

    const members = await db.members
      .where('realmId')
      .equals(project.realmId)
      .toArray()

    return members
  }

  /**
   * 邀请成员加入项目
   */
  static async inviteMember(
    projectId: string,
    email: string,
    role: string
  ): Promise<void> {
    const project = await db.projects.get(projectId)
    if (!project) {
      throw new Error('项目不存在')
    }

    // 检查是否已经是成员
    const existingMember = await db.members
      .where({ realmId: project.realmId, email })
      .first()

    if (existingMember) {
      throw new Error('该用户已经是项目成员')
    }

    // 获取角色对应的权限
    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['member']

    // 创建邀请记录
    // Dexie Cloud 的 members 表要求 ID 必须以 "mmb" 前缀开头
    const memberId = `mmb${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    await db.members.add({
      id: memberId,
      realmId: project.realmId,
      email,
      roles: [role],
      permissions, // 直接设置权限
      invite: true,
      owner: db.cloud.currentUserId!,
    })

    // 触发同步，确保邀请上传到云端
    await db.cloud.sync()
  }

  /**
   * 更新成员角色
   */
  static async updateMemberRole(memberId: string, role: string): Promise<void> {
    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['member']
    await db.members.update(memberId, {
      roles: [role],
      permissions, // 同时更新权限
    })
    // 触发同步
    await db.cloud.sync()
  }

  /**
   * 移除成员
   */
  static async removeMember(memberId: string): Promise<void> {
    await db.members.delete(memberId)
  }

  /**
   * 接受邀请
   * 使用 Dexie Cloud 内置的邀请处理机制
   */
  static async acceptInvite(invite: Invite): Promise<void> {
    // 保存邀请信息，用于接受后恢复权限
    const inviteRoles = invite.roles
    const invitePermissions = invite.permissions
    const targetPermissions =
      invitePermissions || ROLE_PERMISSIONS[inviteRoles?.[0] || 'member']

    // 使用 Dexie Cloud 内置的 accept 方法
    await invite.accept()

    // 触发同步，获取项目数据
    await db.cloud.sync()

    // 检查成员记录并确保权限正确设置
    const member = await db.members.get(invite.id)
    if (member) {
      await db.members.update(member.id, { permissions: targetPermissions })
      // 再次同步确保权限上传到服务器
      await db.cloud.sync()
    }
  }

  /**
   * 拒绝邀请
   * 使用 Dexie Cloud 内置的邀请处理机制
   */
  static async rejectInvite(invite: Invite): Promise<void> {
    await invite.reject()
    // 触发同步，确保拒绝操作生效
    await db.cloud.sync()
  }

  /**
   * 获取用户的所有待处理邀请
   */
  static async getUserInvites(userEmail: string): Promise<DBRealmMember[]> {
    const invites = await db.members
      .where('email')
      .equals(userEmail)
      .filter((member) => member.invite === true)
      .toArray()

    return invites
  }

  /**
   * 获取邀请详情（包含项目信息）
   * 注意：被邀请用户可能还没有权限访问项目数据，所以需要从 realms 表获取项目名称
   */
  static async getInviteDetails(inviteId: string) {
    const member = await db.members.get(inviteId)
    if (!member || !member.realmId) return null

    // 尝试从 projects 表获取项目信息
    let project = await db.projects
      .where('realmId')
      .equals(member.realmId)
      .first()

    // 如果用户没有权限访问项目，尝试从 realms 表获取基本信息
    if (!project) {
      const realm = await db.realms.get(member.realmId)
      if (realm) {
        project = {
          id: member.realmId,
          name: realm.name || '未命名项目',
          realmId: member.realmId,
          owner: realm.owner,
        } as any
      }
    }

    if (!project) return null

    return {
      invite: member,
      project,
    }
  }

  /**
   * 验证成员权限是否生效
   * 用于调试权限问题
   */
  static async verifyMemberPermissions(memberId: string): Promise<void> {
    const member = await db.members.get(memberId)
    console.log('[verifyMemberPermissions] 成员信息:', {
      id: member?.id,
      userId: member?.userId,
      email: member?.email,
      roles: member?.roles,
      permissions: member?.permissions,
      realmId: member?.realmId,
    })

    // 检查 realm 信息
    if (member?.realmId) {
      const realm = await db.realms.get(member.realmId)
      console.log('[verifyMemberPermissions] Realm 信息:', realm)

      // 检查该 realm 下的任务
      const tasks = await db.tasks
        .where('realmId')
        .equals(member.realmId)
        .toArray()
      console.log(
        '[verifyMemberPermissions] Realm 下的任务:',
        tasks.map((t) => ({
          id: t.id,
          name: t.name,
          owner: t.owner,
          realmId: t.realmId,
        }))
      )
    }
  }

  /**
   * 诊断权限问题
   * 检查当前用户是否有权限编辑指定任务
   */
  static async diagnoseTaskPermission(taskId: string): Promise<void> {
    console.log('[diagnoseTaskPermission] 开始诊断任务权限...')

    const task = await db.tasks.get(taskId)
    if (!task) {
      console.error('[diagnoseTaskPermission] 任务不存在')
      return
    }

    console.log('[diagnoseTaskPermission] 任务信息:', {
      id: task.id,
      name: task.name,
      owner: task.owner,
      realmId: task.realmId,
      projectId: task.projectId,
    })

    const currentUser = db.cloud.currentUser.value
    console.log('[diagnoseTaskPermission] 当前用户:', {
      userId: currentUser?.userId,
      email: currentUser?.email,
      isLoggedIn: currentUser?.isLoggedIn,
    })

    // 检查是否是任务所有者
    if (task.owner === currentUser?.userId) {
      console.log(
        '[diagnoseTaskPermission] ✅ 当前用户是任务所有者，拥有完全权限'
      )
      return
    }

    // 检查成员权限
    if (task.realmId) {
      const members = await db.members
        .where('realmId')
        .equals(task.realmId)
        .toArray()

      const currentMember = members.find(
        (m) =>
          m.userId === currentUser?.userId ||
          m.email === currentUser?.email
      )

      if (currentMember) {
        console.log('[diagnoseTaskPermission] 成员记录:', {
          id: currentMember.id,
          userId: currentMember.userId,
          email: currentMember.email,
          roles: currentMember.roles,
          permissions: currentMember.permissions,
        })

        if (currentMember.permissions?.manage === '*') {
          console.log(
            '[diagnoseTaskPermission] ✅ 成员拥有 manage: "*" 权限，应该可以编辑任务'
          )
        } else {
          console.log(
            '[diagnoseTaskPermission] ⚠️ 成员权限:',
            currentMember.permissions
          )
        }
      } else {
        console.log(
          '[diagnoseTaskPermission] ❌ 当前用户不是该 realm 的成员'
        )
      }
    } else {
      console.log('[diagnoseTaskPermission] ⚠️ 任务没有 realmId')
    }
  }
}

/**
 * Hook: 获取项目成员列表
 */
export function useProjectMembers(projectId: string | undefined) {
  return useLiveQuery(() => {
    if (!projectId) return []
    return MemberService.getProjectMembers(projectId)
  }, [projectId])
}

/**
 * Hook: 获取用户的待处理邀请
 * 使用 Dexie Cloud 内置的 db.cloud.invites Observable
 * 返回的邀请对象包含 accept() 和 reject() 方法
 * 注意：Dexie Cloud 的 db.cloud.invites 只过滤了 accepted 的邀请，
 *       我们需要额外过滤掉 rejected 的邀请
 */
export function useUserInvites() {
  // 使用 Dexie Cloud 提供的 db.cloud.invites Observable
  // 它返回包含 accept 和 reject 方法的 Invite 对象
  const allInvites = useObservable(db.cloud.invites)

  // 过滤掉已拒绝的邀请（Dexie Cloud 只过滤了 accepted，没有过滤 rejected）
  return allInvites?.filter((invite) => !invite.rejected)
}
