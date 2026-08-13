import { Input as HeroInput } from '@heroui/react'
import type { InputProps } from '@heroui/react'

export function Input({ variant = 'bordered', labelPlacement = 'outside', classNames, ...props }: InputProps) {
  return (
    <HeroInput
      variant={variant}
      labelPlacement={labelPlacement}
      classNames={{
        ...classNames,
        inputWrapper: ['control-outline', classNames?.inputWrapper].filter(Boolean).join(' '),
      }}
      {...props}
    />
  )
}