/**
 * 判断是不是图片数据，但不用正则。
 *
 * V8 的正则引擎在超长字符串上可能把自己的栈撑爆——尤其是非法字符出现在靠近
 * 末尾的位置时，而这里的输入可能是几 MB 的 Base64。
 *
 * 行为刻意保持宽松，和改造前一致：若干个 Base64 字母表字符，末尾最多两个补位号。
 */
export function isBase64Image(value: unknown): boolean {
  if (!value || typeof value !== 'string') return false
  if (value.startsWith('data:image/')) return true

  let contentEnd = value.length
  if (value.charCodeAt(contentEnd - 1) === 61) contentEnd-- // =
  if (contentEnd > 0 && value.charCodeAt(contentEnd - 1) === 61) contentEnd--
  if (contentEnd === 0) return false

  for (let index = 0; index < contentEnd; index++) {
    const code = value.charCodeAt(index)
    const isBase64Character =
      (code >= 65 && code <= 90) ||
      (code >= 97 && code <= 122) ||
      (code >= 48 && code <= 57) ||
      code === 43 ||
      code === 47
    if (!isBase64Character) return false
  }

  for (let index = contentEnd; index < value.length; index++) {
    if (value.charCodeAt(index) !== 61) return false
  }
  return true
}
