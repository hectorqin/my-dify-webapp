import type { FC, MouseEventHandler } from 'react'
import React from 'react'
import Spinner from '@/app/components/base/spinner'

export interface IButtonProps {
  type?: string
  className?: string
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
  onClick?: MouseEventHandler<HTMLDivElement>
}

const Button: FC<IButtonProps> = ({
  type,
  disabled,
  children,
  className,
  onClick,
  loading = false,
}) => {
  let style = 'cursor-pointer'
  switch (type) {
    case 'link':
      style = disabled ? 'border-solid border border-white/10 bg-white/5 cursor-not-allowed text-[#fff7ef]/40' : 'border-solid border border-white/10 cursor-pointer text-[#fff7ef] bg-[rgba(255,247,239,0.08)] hover:bg-[rgba(255,247,239,0.14)] hover:border-white/20'
      break
    case 'primary':
      style = (disabled || loading) ? 'bg-orange-700/70 cursor-not-allowed text-white' : 'bg-gradient-to-br from-[#f8b800] via-[#f07800] to-[#e83008] cursor-pointer text-white hover:shadow-md'
      break
    default:
      style = disabled ? 'border-solid border border-white/10 bg-white/5 cursor-not-allowed text-[#fff7ef]/40' : 'border-solid border border-white/10 cursor-pointer text-[#fff7ef]/70 hover:bg-[rgba(255,247,239,0.1)] hover:text-[#fff7ef] hover:border-white/20'
      break
  }

  return (
    <div
      className={`flex justify-center items-center content-center h-9 leading-5 rounded-lg px-4 py-2 text-base ${style} ${className && className}`}
      onClick={disabled ? undefined : onClick}
    >
      {children}
      {/* Spinner is hidden when loading is false */}
      <Spinner loading={loading} className='!text-white !h-3 !w-3 !border-2 !ml-1' />
    </div>
  )
}

export default React.memo(Button)
