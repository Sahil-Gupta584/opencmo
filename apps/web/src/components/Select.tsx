import { Select as HeroSelect, SelectItem as HeroSelectItem } from '@heroui/react'
import type { SelectProps, SelectItemProps } from '@heroui/react'

export function Select({ variant = 'bordered', labelPlacement = 'outside', classNames, ...props }: SelectProps) {
  return (
    <HeroSelect
      variant={variant}
      labelPlacement={labelPlacement}
      classNames={{
        ...classNames,
        trigger: ['control-outline', classNames?.trigger].filter(Boolean).join(' '),
      }}
      {...props}
    />
  )
}

export function SelectItem(props: SelectItemProps) {
  return <HeroSelectItem {...props} />
}