import db from '@/utils/db'
import type { DBRealmMember, Invite } from 'dexie-cloud-addon'
import { useLiveQuery } from 'dexie-react-hooks'
import { useObservable } from 'dexie-react-hooks'

/**
 * 角色权限映射
 * 由于 Dexie Cloud 角色需要通过 CLI 导入，我们直接在成员记录中设置权限
 * 
 * 注意：为了确保成员能够编辑任务，我们给予所有角色完全管理权限
 * 后续可以根据需要细化权限控制
 */
const ROLE_PERMISSIONS: Record<string, DBRealmMember['permissions']> = {
  owner: {
    manage: '*', // 完全管理权限
  },
  admin: {
    manage: '*', // 完全管理权限
  },
  member: {
    manage: '*', // 完全管理权限（暂时给予完全权限，确保可以编辑任务）
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

    console.log('[inviteMember] 创建邀请:', {
      email,
      role,
      permissions,
      realmId: project.realmId,
    })

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

    console.log('[inviteMember] 邀请已创建，触发同步...')

    // 触发同步，确保邀请上传到云端
    await db.cloud.sync()

    console.log('[inviteMember] 同步完成')

    // 验证权限是否保存成功
    const savedMember = await db.members.get(memberId)
    console.log('[inviteMember] 保存后的成员记录:', savedMember)
  }

  /**
   * 更新成员角色
   */
  static async updateMemberRole(memberId: string, role: string): Promise<void> {
    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['member']
    console.log('[updateMemberRole] 更新成员角色:', memberId, role, permissions)
    await db.members.update(memberId, {
      roles: [role],
      permissions, // 同时更新权限
    })
    // 触发同步
    await db.cloud.sync()
    console.log('[updateMemberRole] 同步完成')
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
    console.log('[acceptInvite] 接受邀请, inviteId:', invite.id)
    console.log('[acceptInvite] invite.permissions:', invite.permissions)
    console.log('[acceptInvite] invite.roles:', invite.roles)

    // 保存邀请信息，用于接受后恢复权限
    const inviteRoles = invite.roles
    const invitePermissions = invite.permissions

    // 使用 Dexie Cloud 内置的 accept 方法
    console.log('[acceptInvite] 使用内置 accept 方法')
    await invite.accept()
    console.log('[acceptInvite] accept 完成')

    // 触发同步，获取项目数据
    console.log('[acceptInvite] 触发同步获取项目数据...')
    await db.cloud.sync()
    console.log('[acceptInvite] 同步完成')

    // 检查成员记录是否还有权限
    const member = await db.members.get(invite.id)
    console.log('[acceptInvite] 同步后成员记录:', member)

    // 如果权限丢失，重新设置
    if (member && !member.permissions && (inviteRoles || invitePermissions)) {
      console.log('[acceptInvite] 权限丢失，重新设置...')
      const permissions =
        invitePermissions || ROLE_PERMISSIONS[inviteRoles?.[0] || 'member']
      await db.members.update(member.id, { permissions })
      console.log('[acceptInvite] 权限已重新设置:', permissions)
      await db.cloud.sync()
    }
  }

  /**
   * 拒绝邀请
   * 使用 Dexie Cloud 内置的邀请处理机制
   */
  static async rejectInvite(invite: Invite): Promise<void> {
    console.log('[rejectInvite] 拒绝邀请, inviteId:', invite.id)

    await invite.reject()
    console.log('[rejectInvite] reject 完成')
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
   * 为所有成员添加权限
   * 用于迁移旧数据
   */
  static async migrateMemberPermissions(): Promise<void> {
    console.log('[migrateMemberPermissions] 开始迁移成员权限...')

    const members = await db.members.toArray()
    console.log(
      '[migrateMemberPermissions] 找到成员:',
      members.map((m) => ({
        id: m.id,
        userId: m.userId,
        email: m.email,
        roles: m.roles,
        permissions: m.permissions,
      }))
    )

    let updatedCount = 0

    for (const member of members) {
      // 始终更新权限（确保格式正确）
      const role = member.roles?.[0] || 'member'
      const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['member']

      console.log(
        `[migrateMemberPermissions] 为成员 ${member.email || member.userId} 设置权限:`,
        permissions
      )

      await db.members.update(member.id, { permissions })
      updatedCount++
    }

    console.log(
      `[migrateMemberPermissions] 更新了 ${updatedCount} 个成员的权限`
    )

    if (updatedCount > 0) {
      console.log('[migrateMemberPermissions] 触发同步...')
      await db.cloud.sync()
      console.log('[migrateMemberPermissions] 同步完成')
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
 */
export function useUserInvites() {
  // 使用 Dexie Cloud 提供的 db.cloud.invites Observable
  // 它返回包含 accept 和 reject 方法的 Invite 对象
  return useObservable(db.cloud.invites)
}
