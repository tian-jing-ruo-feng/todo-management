import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

interface DateTimePickerProps {
  value?: string
  onChange?: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  style?: React.CSSProperties
}

export default function DateTimePicker({
  value,
  onChange,
  placeholder = '选择日期时间',
  disabled = false,
  style = {},
}: DateTimePickerProps) {
  const handleChange = (date: Dayjs | null) => {
    if (onChange) {
      onChange(date ? date.toISOString() : null)
    }
  }

  return (
    <DatePicker
      value={value ? dayjs(value) : null}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      style={{ width: '100%', ...style }}
      format="YYYY-MM-DD HH:mm:ss"
      showTime={{ format: 'HH:mm:ss' }}
    />
  )
}
