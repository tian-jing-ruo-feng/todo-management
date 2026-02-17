import db from '@/utils/db'
import type { DBRealmMember } from 'dexie-cloud-addon'
import { useLiveQuery } from 'dexie-react-hooks'
import { useUser } from '@/hooks/useUser'

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

    // 创建邀请记录
    await db.members.add({
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      realmId: project.realmId,
      email,
      roles: [role],
      invite: {
        status: 'sent',
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * 更新成员角色
   */
  static async updateMemberRole(memberId: string, role: string): Promise<void> {
    await db.members.update(memberId, {
      roles: [role],
    })
  }

  /**
   * 移除成员
   */
  static async removeMember(memberId: string): Promise<void> {
    await db.members.delete(memberId)
  }

  /**
   * 接受邀请
   */
  static async acceptInvite(memberId: string, userId: string): Promise<void> {
    const member = await db.members.get(memberId)
    if (!member) {
      throw new Error('邀请不存在')
    }

    await db.members.update(memberId, {
      userId,
      invite: undefined,
    })
  }

  /**
   * 拒绝邀请
   */
  static async rejectInvite(memberId: string): Promise<void> {
    await db.members.delete(memberId)
  }

  /**
   * 获取用户的所有待处理邀请
   */
  static async getUserInvites(userEmail: string): Promise<DBRealmMember[]> {
    const invites = await db.members
      .where('email')
      .equals(userEmail)
      .filter((member) => member.invite?.status === 'sent')
      .toArray()

    return invites
  }

  /**
   * 获取邀请详情（包含项目信息）
   */
  static async getInviteDetails(inviteId: string) {
    const member = await db.members.get(inviteId)
    if (!member || !member.realmId) return null

    const project = await db.projects
      .where('realmId')
      .equals(member.realmId)
      .first()

    if (!project) return null

    return {
      invite: member,
      project,
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
 */
export function useUserInvites() {
  const { user, isLoggedIn: userLoggedIn } = useUser()

  return useLiveQuery(() => {
    if (!userLoggedIn || !user?.email) return []
    return MemberService.getUserInvites(user.email)
  }, [user?.email, userLoggedIn])
}
