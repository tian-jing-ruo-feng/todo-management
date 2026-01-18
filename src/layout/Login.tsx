import { Alert, Button, Form, Input, Modal } from 'antd'
import { useObservable } from 'dexie-react-hooks'
import { useCallback } from 'react'
import db from '../utils/db'

// Dexie Cloud 字段配置接口
interface DXCInputField {
  type?: string
  label?: string
  placeholder?: string
  onGetCode?: (value: string) => Promise<void>
}

// Dexie Cloud 告警配置接口
interface DXCAlert {
  type?: string
  message: string
  description?: string
}

// Dexie Cloud 用户交互接口
interface DXCUserInteraction {
  type: string
  title: string
  alerts?: DXCAlert[]
  fields?: Record<string, DXCInputField>
  submitLabel?: string
  cancelLabel?: string
  onSubmit: (params: Record<string, string>) => void
  onCancel?: () => void
}

/**
 * 自定义登录弹窗组件
 * 使用 Ant Design 的 Modal 和 Form 组件
 */
export function MyLoginGUI() {
  const [form] = Form.useForm()
  const ui = useObservable(db.cloud.userInteraction) as
    | DXCUserInteraction
    | undefined

  // 提交表单
  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields()
      ui?.onSubmit?.(values)
      form.resetFields()
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }, [form, ui])

  // 取消操作
  const handleCancel = useCallback(() => {
    form.resetFields()
    ui?.onCancel?.()
  }, [form, ui])

  // 判断字段类型
  const isPasswordField = (fieldName: string) => {
    return fieldName.toLowerCase().includes('password')
  }

  if (!ui) return null // 无用户交互请求时不渲染

  return (
    <Modal
      title={ui.title || '登录'}
      open={true}
      onCancel={handleCancel}
      footer={null}
      centered
      width={500}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* 渲染告警信息 */}
        {ui.alerts &&
          ui.alerts.length > 0 &&
          ui.alerts.map((alert, index) => (
            <Alert
              key={index}
              type={
                alert.type === 'error'
                  ? 'error'
                  : alert.type === 'warning'
                    ? 'warning'
                    : alert.type === 'success'
                      ? 'success'
                      : 'info'
              }
              description={alert.description}
              showIcon
              closable
              style={{ marginBottom: 16 }}
            />
          ))}

        {/* 动态渲染表单字段 */}
        {ui.fields &&
          Object.entries(ui.fields).map(([fieldName, fieldConfig], index) => (
            <Form.Item
              key={fieldName}
              name={fieldName}
              label={fieldConfig.label}
              rules={[
                {
                  required: true,
                  message: `请输入${fieldConfig.label || fieldName}`,
                },
              ]}
            >
              {isPasswordField(fieldName) ? (
                <Input.Password
                  placeholder={fieldConfig.placeholder}
                  autoFocus={index === 0}
                />
              ) : (
                <Input
                  placeholder={fieldConfig.placeholder}
                  type={fieldConfig.type || 'text'}
                  autoFocus={index === 0}
                />
              )}
            </Form.Item>
          ))}

        {/* 按钮区域 */}
        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <div
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}
          >
            {ui.cancelLabel && (
              <Button onClick={handleCancel}>{ui.cancelLabel}</Button>
            )}
            <Button type="primary" htmlType="submit">
              {ui.submitLabel || '提交'}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  )
}
