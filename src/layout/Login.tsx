import { Button, Form, Input, Modal, message } from 'antd'
import { useState } from 'react'
import db from '../utils/db'

type FieldType = {
  email?: string
  otp?: string
}

/**
 * 自定义登录弹窗组件
 * 使用 Ant Design 的 Modal 和 Form 组件
 */
export function MyLoginGUI(props: {
  isLogin: boolean
  onLoginSuccess: () => void
  onClose: () => void
}) {
  const { isLogin = false, onLoginSuccess, onClose } = props
  const [form] = Form.useForm()
  const [emailValid, setEmailValid] = useState(false)
  // 验证码发送结果
  const [isSending, setIsSending] = useState(false)
  const [isLogining, setIsLogining] = useState(false)
  const [emailSendResult, setEmailSendResult] = useState<{
    otp_id: number
    type: string
  }>({
    otp_id: 0,
    type: '',
  })

  const handleSendEmail = async () => {
    const url = db.cloud.options?.databaseUrl
    setIsSending(true)
    fetch(`${url}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: form.getFieldValue('email'),
        grant_type: 'otp',
        scopes: ['ACCESS_DB'],
      }),
    })
      .then((res) => {
        res.json().then((data) => {
          if (data.otp_id) {
            setEmailSendResult(data)
            message.success('验证码已发送, 请查收邮箱')
          } else {
            message.error('验证码获取失败')
          }
        })
      })
      .finally(() => {
        setIsSending(false)
      })
  }

  const handleSubmit = async () => {
    await form.validateFields()
    setIsLogining(true)
    db.cloud
      .login({
        email: form.getFieldValue('email'),
        otp: form.getFieldValue('otp'),
        otpId: emailSendResult.otp_id.toString(),
        grant_type: 'otp',
      })
      .then(() => {
        message.success('登录成功')
        onLoginSuccess()
        setTimeout(() => {
          window.location.reload()
        }, 300)
      })
      .finally(() => {
        setIsLogining(false)
      })
  }

  const handelOnClose = () => {
    setIsSending(false)
    setIsLogining(false)
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title={'登录'}
      open={isLogin}
      footer={null}
      centered
      width={500}
      onCancel={handelOnClose}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item<FieldType>
          label="邮箱"
          name="email"
          validateFirst
          rules={[
            { required: true, message: '请输入邮箱' },
            {
              type: 'email',
              message: '请输入有效的邮箱地址',
            },
          ]}
        >
          <div className="flex items-center justify-between gap-2">
            <Input
              placeholder="请输入邮箱"
              onChange={(e) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                setEmailValid(emailRegex.test(e.target.value))
              }}
            />
            <Button
              type="primary"
              onClick={handleSendEmail}
              disabled={!emailValid}
              loading={isSending}
            >
              发送验证码
            </Button>
          </div>
        </Form.Item>

        <Form.Item<FieldType>
          label="验证码"
          name="otp"
          rules={[{ required: true, message: '请输入验证码' }]}
        >
          <Input placeholder="请输入验证码" />
        </Form.Item>

        <Form.Item label={null}>
          <Button type="primary" htmlType="submit" loading={isLogining}>
            登录
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}
