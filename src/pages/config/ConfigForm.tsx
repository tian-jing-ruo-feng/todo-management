import { Modal, Form, Input, ColorPicker } from 'antd'
import type { ConfigFormData } from '@/types/config'
import { useState, useEffect } from 'react'

export interface ConfigFormProps {
  visible: boolean
  title: string
  initialValues?: ConfigFormData
  onConfirm: (values: ConfigFormData) => Promise<void>
  onCancel: () => void
}

export default function ConfigForm({
  visible,
  title,
  initialValues,
  onConfirm,
  onCancel,
}: ConfigFormProps) {
  const [form] = Form.useForm<ConfigFormData>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue(initialValues)
      } else {
        form.resetFields()
      }
    }
  }, [visible, initialValues, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      await onConfirm(values)
      form.resetFields()
      setLoading(false)
    } catch (error) {
      console.error('表单验证失败:', error)
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={title}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="确认"
      cancelText="取消"
      width={500}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="名称"
          name="name"
          rules={[
            { required: true, message: '请输入名称' },
            { max: 50, message: '名称不能超过50个字符' },
          ]}
        >
          <Input placeholder="请输入名称" />
        </Form.Item>

        <Form.Item
          label="颜色"
          name="color"
          rules={[{ required: true, message: '请选择颜色' }]}
          normalize={(value) => value.toHexString()}
        >
          <ColorPicker showText format="hex" defaultFormat="hex" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
