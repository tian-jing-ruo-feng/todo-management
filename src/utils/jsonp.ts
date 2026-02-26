/**
 * JSONP 请求工具
 * 用于解决 CORS 跨域问题
 */

/**
 * 发送 JSONP 请求
 * @param url 请求 URL
 * @param callbackParam 回调参数名，默认为 'jsonp'
 * @returns Promise<T> 返回请求结果
 */
export function jsonp<T>(url: string, callbackParam = 'jsonp'): Promise<T> {
  return new Promise((resolve, reject) => {
    // 生成唯一的回调函数名
    const callbackName = `jsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`

    // 创建全局回调函数
    ;(window as any)[callbackName] = (data: T) => {
      resolve(data)
      // 清理：删除全局函数和 script 标签
      delete (window as any)[callbackName]
      document.head.removeChild(script)
    }

    // 创建 script 标签
    const script = document.createElement('script')
    const separator = url.includes('?') ? '&' : '?'
    script.src = `${url}${separator}${callbackParam}=${callbackName}`

    script.onerror = () => {
      reject(new Error('JSONP request failed'))
      delete (window as any)[callbackName]
      document.head.removeChild(script)
    }

    // 添加到页面
    document.head.appendChild(script)
  })
}
