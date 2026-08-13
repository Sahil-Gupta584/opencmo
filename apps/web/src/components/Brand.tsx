import { Link } from '@tanstack/react-router'

interface BrandProps {
  to?: string
  size?: 'sm' | 'md'
  className?: string
}

const SIZES = {
  sm: { img: 'h-7 w-7 rounded-[8px]', text: 'text-[16px]' },
  md: { img: 'h-8 w-8 rounded-[9px]', text: 'text-[19px]' },
} as const

export function Brand({ to = '/', size = 'md', className = '' }: BrandProps) {
  const s = SIZES[size]
  return (
    <Link to={to as any} className={`flex items-center gap-[9px] no-underline ${className}`}>
      <img src="/favicon.ico" alt="OpenCMO logo" className={`${s.img} object-cover`} />
      <span
        className={`${s.text} font-black leading-none`}
        style={{ fontFamily: "'Recoleta', serif", letterSpacing: '-0.01em' }}
      >
        <span className="text-[#332A28]">open</span>
        <span className="text-[#FF6F59]">cmo</span>
      </span>
    </Link>
  )
}