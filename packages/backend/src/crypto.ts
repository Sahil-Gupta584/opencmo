import crypto from 'node:crypto'
import { env } from './env.js'

const ALGORITHM = 'aes-256-gcm'

function getMasterKey(): Buffer {
  const secret = env.BETTER_AUTH_SECRET
  return crypto.createHash('sha256').update(secret).digest()
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, getMasterKey(), iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag().toString('hex')
  return `${iv.toString('hex')}:${tag}:${encrypted}`
}

export function decrypt(cipherText: string): string {
  const parts = cipherText.split(':')
  if (parts.length !== 3) return cipherText
  const [ivHex, tagHex, encrypted] = parts
  try {
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, getMasterKey(), iv)
    decipher.setAuthTag(tag)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return cipherText
  }
}
