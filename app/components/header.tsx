import type { FC } from 'react'
import React from 'react'
import {
  Bars3Icon,
  PencilSquareIcon,
} from '@heroicons/react/24/solid'
import AppIcon from '@/app/components/base/app-icon'
export interface IHeaderProps {
  title: string
  subtitle?: string
  isMobile?: boolean
  onShowSideBar?: () => void
  onCreateNewChat?: () => void
}
const Header: FC<IHeaderProps> = ({
  title,
  subtitle,
  isMobile,
  onShowSideBar,
  onCreateNewChat,
}) => {
  return (
    <div className="shrink-0 flex items-center justify-between h-16 px-4 py-2 bg-transparent border-b border-white/10">
      {isMobile
        ? (
          <div
            className='flex items-center justify-center h-8 w-8 cursor-pointer'
            onClick={() => onShowSideBar?.()}
          >
            <Bars3Icon className="h-4 w-4 text-[#fff7ef]/70" />
          </div>
        )
        : <div></div>}
      <div className='flex items-center space-x-2 min-h-12'>
        <AppIcon size="small" icon="robot-face" className="ai-chat-avatar" />
        <div className="ai-chat-title flex flex-col leading-none">
          <span className="ai-chat-title-main text-[16px] font-bold text-white leading-5">{title}</span>
          {subtitle && (
            <span className="ai-chat-title-sub mt-0.5 text-[12px] font-normal leading-4 text-[#fff7efa3]">{subtitle}</span>
          )}
        </div>
      </div>
      {isMobile
        ? (
          <div className='flex items-center justify-center h-8 w-8 cursor-pointer' onClick={() => onCreateNewChat?.()} >
            <PencilSquareIcon className="h-4 w-4 text-[#fff7ef]/70" />
          </div>)
        : <div></div>}
    </div>
  )
}

export default React.memo(Header)
