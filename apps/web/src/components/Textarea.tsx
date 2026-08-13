import { Textarea as HeroTextarea } from '@heroui/react'
import type { TextAreaProps } from '@heroui/react'

export function Textarea({ labelPlacement = 'outside', classNames, ...props }: TextAreaProps) {
  return (
    <HeroTextarea
      labelPlacement={labelPlacement}
      variant='bordered'
      classNames={{
        inputWrapper: ['control-outline', classNames?.inputWrapper].filter(Boolean).join(' '),
        ...classNames,
      }}
      {...props}
    />
  )
}