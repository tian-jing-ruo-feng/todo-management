import { Modal, message } from 'antd'
import type { ConfigItem } from '@/types/config'
import { useState } from 'react'

export interface DeleteDialogProps {
  visible: boolean
  item: ConfigItem | null
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export default function DeleteDialog({
  visible,
  item,
  onConfirm,
  onCancel,
}: DeleteDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleOk = async () => {
    try {
      setLoading(true)
      await onConfirm()
      setLoading(false)
      message.success('删除成功')
    } catch (error) {
      console.error('删除失败:', error)
      setLoading(false)
      message.error('删除失败')
    }
  }

  return (
    <Modal
      title="确认删除"
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="确认删除"
      cancelText="取消"
      okButtonProps={{ danger: true }}
    >
      <div className="py-4">
        <p className="text-base">
          确定要删除配置项{' '}
          <span className="font-semibold text-red-600">{item?.name}</span> 吗？
        </p>
        <p className="text-sm text-gray-500 mt-2">
          删除后将无法恢复，请谨慎操作。
        </p>
      </div>
    </Modal>
  )
}
