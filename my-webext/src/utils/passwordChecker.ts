// src/utils/passwordChecker.ts
import browser from 'webextension-polyfill'

// 密码检查结果类型定义
export interface PasswordCheckResult {
  valid: boolean
  reason: string
}

// 密码规则设置类型
export interface PasswordRules {
  minLength: number
  maxLength: number
  minDigits: number
  minSpecialChars: number
  minUpperCaseLetters: number
  minLowerCaseLetters: number
}

/**
 * 获取当前密码规则设置
 * @returns 密码规则设置
 */
export async function getPasswordRules(): Promise<PasswordRules> {
  try {
    const result = await browser.storage.sync.get('passwordRules')
    return result.passwordRules || getDefaultPasswordRules()
  }
  catch (error) {
    console.error('获取密码规则失败:', error)
    return getDefaultPasswordRules()
  }
}

/**
 * 获取默认密码规则
 * @returns 默认密码规则
 */
export function getDefaultPasswordRules(): PasswordRules {
  return {
    minLength: 8,
    maxLength: 20,
    minDigits: 1,
    minSpecialChars: 1,
    minUpperCaseLetters: 1,
    minLowerCaseLetters: 1,
  }
}

/**
 * 检查密码是否符合安全规则
 *
 * @param password - 要检查的密码
 * @returns 检查结果
 */
export async function checkPassword(password: string): Promise<PasswordCheckResult> {
  // 获取密码规则设置
  const rules = await getPasswordRules()

  // 检查密码长度
  if (password.length < rules.minLength) {
    return {
      valid: false,
      reason: `密码长度过短，至少需要${rules.minLength}个字符`,
    }
  }

  if (password.length > rules.maxLength) {
    return {
      valid: false,
      reason: `密码长度过长，不应超过${rules.maxLength}个字符`,
    }
  }

  // 检查密码包含的字符类型
  const digitCount = (password.match(/\d/g) || []).length
  const specialCharCount = (password.match(/[!@#$%^&*(),.?":{}|<>]/g) || []).length
  const upperCaseCount = (password.match(/[A-Z]/g) || []).length
  const lowerCaseCount = (password.match(/[a-z]/g) || []).length

  const issues = []

  if (digitCount < rules.minDigits)
    issues.push(`至少需要${rules.minDigits}个数字`)

  if (specialCharCount < rules.minSpecialChars)
    issues.push(`至少需要${rules.minSpecialChars}个特殊字符`)

  if (upperCaseCount < rules.minUpperCaseLetters)
    issues.push(`至少需要${rules.minUpperCaseLetters}个大写字母`)

  if (lowerCaseCount < rules.minLowerCaseLetters)
    issues.push(`至少需要${rules.minLowerCaseLetters}个小写字母`)

  if (issues.length > 0) {
    return {
      valid: false,
      reason: `密码不符合安全规则: ${issues.join('; ')}`,
    }
  }

  return { valid: true, reason: '' }
}
