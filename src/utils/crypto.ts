import AES from 'crypto-js/aes'
import Utf8 from 'crypto-js/enc-utf8'
import type { Task } from '@/types/Task'

/**
 * 加密数据前缀标记
 * 用于识别数据是否已加密
 */
export const ENCRYPTED_PREFIX = 'encrypted::'

/**
 * 加密文本数据
 * @param text - 需要加密的文本
 * @param secret - 加密密钥
 * @returns 加密后的文本（带前缀）
 */
export function encrypt(text: string, secret: string): string {
  if (!text || !secret) {
    return text
  }
  const encrypted = AES.encrypt(text, secret).toString()
  return `${ENCRYPTED_PREFIX}${encrypted}`
}

/**
 * 解密文本数据
 * 自动检测数据是否已加密，如果未加密则直接返回原值
 * @param text - 需要解密的文本（可能带前缀）
 * @param secret - 加密密钥
 * @returns 解密后的文本
 */
export function decrypt(text: string, secret: string): string {
  if (!text || !secret) {
    return text
  }

  // 检查是否为加密数据
  if (!text.startsWith(ENCRYPTED_PREFIX)) {
    // 未加密数据，直接返回原值
    return text
  }

  try {
    const encryptedText = text.substring(ENCRYPTED_PREFIX.length)
    const bytes = AES.decrypt(encryptedText, secret)
    const plaintext = bytes.toString(Utf8)

    // 如果解密失败（plaintext 为空），返回原值
    if (!plaintext) {
      return text
    }

    return plaintext
  } catch (error) {
    // 解密异常，返回原值（降级处理）
    console.warn('Failed to decrypt data, returning original value:', error)
    return text
  }
}

/**
 * 加密任务对象的敏感字段
 * @param task - 任务对象
 * @param secret - 加密密钥
 * @returns 加密后的任务对象
 */
export function encryptTaskFields(task: Task, secret: string): Task {
  if (!secret) {
    return task
  }

  return {
    ...task,
    name: task.name ? encrypt(task.name, secret) : task.name,
    content: task.content ? encrypt(task.content, secret) : task.content,
  }
}

/**
 * 解密任务对象的敏感字段
 * 自动检测字段是否已加密
 * @param task - 任务对象
 * @param secret - 加密密钥
 * @returns 解密后的任务对象
 */
export function decryptTaskFields(task: Task, secret: string): Task {
  if (!secret) {
    return task
  }

  return {
    ...task,
    name: task.name ? decrypt(task.name, secret) : task.name,
    content: task.content ? decrypt(task.content, secret) : task.content,
  }
}

/**
 * 批量加密任务数组
 * @param tasks - 任务数组
 * @param secret - 加密密钥
 * @returns 加密后的任务数组
 */
export function encryptTasks(tasks: Task[], secret: string): Task[] {
  if (!secret) {
    return tasks
  }
  return tasks.map((task) => encryptTaskFields(task, secret))
}

/**
 * 批量解密任务数组
 * @param tasks - 任务数组
 * @param secret - 加密密钥
 * @returns 解密后的任务数组
 */
export function decryptTasks(tasks: Task[], secret: string): Task[] {
  if (!secret) {
    return tasks
  }
  return tasks.map((task) => decryptTaskFields(task, secret))
}
