import { Button, Form, Input, Modal, message } from 'antd'
import { useEffect, useRef, useState } from 'react'
import db from '@/db/db'
import type { DXCUserInteraction } from 'dexie-cloud-addon'

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
  const [countdown, setCountdown] = useState(0)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [emailSendResult, setEmailSendResult] = useState<{
    otp_id: number
    type: string
  }>({
    otp_id: 0,
    type: '',
  })

  /**
   * 根本原因：customLoginGui: true 模式下，Dexie Cloud 错误不是通过 Promise reject 抛出，而是通过 db.cloud.userInteraction Observable 传递。


  处理 message-alert 类型（错误消息）
  根据错误类型显示 error/warning/info 提示
  处理其他交互类型（otp/email）
  简化 handleSubmit：

  移除复杂的错误类型判断
  保留 catch 作为兜底处理
   */

  // 订阅 userInteraction 处理错误和交互请求
  useEffect(() => {
    const subscription = db.cloud.userInteraction.subscribe(
      (interaction: DXCUserInteraction | undefined) => {
        if (!interaction) return

        console.log('[Login] userInteraction:', interaction)

        // 处理消息警告类型（包含错误信息）
        if (interaction.type === 'message-alert') {
          const alerts = interaction.alerts || []
          alerts.forEach((alert) => {
            if (alert.type === 'error') {
              message.error(alert.message)
            } else if (alert.type === 'warning') {
              message.warning(alert.message)
            } else {
              message.info(alert.message)
            }
          })
          // 关闭交互
          interaction.onSubmit({})
          setIsLogining(false)
          return
        }

        // 其他交互类型（OTP、email 等）在自定义登录场景下不处理
        // 因为我们有自己的登录 UI
        if (interaction.type === 'otp' || interaction.type === 'email') {
          // 用户已取消内置交互，使用我们的自定义 UI
          interaction.onCancel()
          return
        }

        // 默认处理：关闭交互
        interaction.onSubmit({})
      }
    )

    return () => {
      subscription.unsubscribe()
      // 组件卸载时清除倒计时定时器
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
        countdownTimerRef.current = null
      }
    }
  }, [])

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
            // 启动60秒倒计时
            setCountdown(60)
            countdownTimerRef.current = setInterval(() => {
              setCountdown((prev) => {
                if (prev <= 1) {
                  // 倒计时结束，清除定时器
                  if (countdownTimerRef.current) {
                    clearInterval(countdownTimerRef.current)
                    countdownTimerRef.current = null
                  }
                  return 0
                }
                return prev - 1
              })
            }, 1000)
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
    if (!emailSendResult.otp_id) {
      message.error('请先发送验证码')
      return
    }
    setIsLogining(true)
    try {
      await db.cloud.login({
        email: form.getFieldValue('email'),
        otp: form.getFieldValue('otp'),
        otpId: emailSendResult.otp_id.toString(),
        grant_type: 'otp',
      })
      message.success('登录成功')
      // 登录成功后立即同步，确保获取最新的邀请信息
      try {
        await db.cloud.sync()
      } catch (e) {
        console.error('同步失败:', e)
      }
      onLoginSuccess()
    } catch (error: unknown) {
      // 兜底处理：虽然 customLoginGui 模式下错误主要通过 userInteraction 传递
      // 但仍保留 catch 作为备用
      console.error('登录失败:', error)
      setIsLogining(false)
    }
  }

  const handelOnClose = () => {
    setIsSending(false)
    setIsLogining(false)
    setCountdown(0)
    // 清除倒计时定时器
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      centered
      width={500}
      title={'登录'}
      open={isLogin}
      footer={null}
      keyboard={false}
      maskClosable={false}
      afterClose={() => {
        // Modal 完全关闭后清空表单和状态
        form.resetFields()
        setEmailValid(false)
        setCountdown(0)
        setEmailSendResult({ otp_id: 0, type: '' })
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current)
          countdownTimerRef.current = null
        }
      }}
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
              disabled={!emailValid || countdown > 0}
              loading={isSending}
            >
              {countdown > 0 ? `${countdown}s` : '发送验证码'}
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
