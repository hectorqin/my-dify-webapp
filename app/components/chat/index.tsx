'use client'
import type { FC } from 'react'
import React, { useEffect, useRef } from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import Textarea from 'rc-textarea'
import s from './style.module.css'
import Answer from './answer'
import Question from './question'
import type { FeedbackFunc } from './type'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import Tooltip from '@/app/components/base/tooltip'
import Toast from '@/app/components/base/toast'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import FileUploaderInAttachmentWrapper from '@/app/components/base/file-uploader-in-attachment'
import type { FileEntity, FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { getProcessedFiles } from '@/app/components/base/file-uploader-in-attachment/utils'
import type { DodexActionItem, DodexFunctionCall } from '@/app/components/base/dodex-actions'

export interface IChatProps {
  chatList: ChatItem[]
  /**
   * Whether to display the editing area and rating status
   */
  feedbackDisabled?: boolean
  /**
   * Whether to display the input area
   */
  isHideSendInput?: boolean
  onFeedback?: FeedbackFunc
  checkCanSend?: () => boolean
  onSend?: (message: string, files: VisionFile[]) => void
  onDodexExecuteFunction?: (functionCall: DodexFunctionCall, item: DodexActionItem) => boolean | void
  useCurrentUserAvatar?: boolean
  isResponding?: boolean
  controlClearQuery?: number
  visionConfig?: VisionSettings
  fileConfig?: FileUpload
}

const Chat: FC<IChatProps> = ({
  chatList,
  feedbackDisabled = false,
  isHideSendInput = false,
  onFeedback,
  checkCanSend,
  onSend = () => { },
  onDodexExecuteFunction,
  useCurrentUserAvatar,
  isResponding,
  controlClearQuery,
  visionConfig,
  fileConfig,
}) => {
  const { t } = useTranslation()
  const { notify } = Toast
  const isUseInputMethod = useRef(false)

  const [query, setQuery] = React.useState('')
  const queryRef = useRef('')
  const chatListRef = useRef<HTMLDivElement>(null)

  const handleContentChange = (e: any) => {
    const value = e.target.value
    setQuery(value)
    queryRef.current = value
  }

  const logError = (message: string) => {
    notify({ type: 'error', message, duration: 3000 })
  }

  const valid = () => {
    const query = queryRef.current
    if (!query || query.trim() === '') {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  const sendPlainMessage = (message: string) => {
    if (!message || message.trim() === '') {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return
    }
    if (checkCanSend && !checkCanSend()) { return }
    onSend(message, [])
  }

  useEffect(() => {
    if (controlClearQuery) {
      setQuery('')
      queryRef.current = ''
    }
  }, [controlClearQuery])
  const {
    files,
    onUpload,
    onRemove,
    onReUpload,
    onImageLinkLoadError,
    onImageLinkLoadSuccess,
    onClear,
  } = useImageFiles()

  const [attachmentFiles, setAttachmentFiles] = React.useState<FileEntity[]>([])

  const handleSend = () => {
    if (!valid() || (checkCanSend && !checkCanSend())) { return }
    const hasPendingImageUploads = files.some(file => file.progress !== -1 && file.progress < 100)
    const hasPendingAttachmentUploads = attachmentFiles.some(file => file.progress !== -1 && file.progress < 100)
    if (hasPendingImageUploads || hasPendingAttachmentUploads) {
      logError(t('app.errorMessage.waitForFileUpload'))
      return
    }
    const imageFiles: VisionFile[] = files.filter(file => file.progress !== -1).map(fileItem => ({
      type: 'image',
      transfer_method: fileItem.type,
      url: fileItem.url,
      upload_file_id: fileItem.fileId,
    }))
    const docAndOtherFiles: VisionFile[] = getProcessedFiles(attachmentFiles)
    const combinedFiles: VisionFile[] = [...imageFiles, ...docAndOtherFiles]
    onSend(queryRef.current, combinedFiles)
    if (!files.find(item => item.type === TransferMethod.local_file && !item.fileId)) {
      if (files.length) { onClear() }
      if (!isResponding) {
        setQuery('')
        queryRef.current = ''
      }
    }
    if (!attachmentFiles.find(item => item.transferMethod === TransferMethod.local_file && !item.uploadedId)) { setAttachmentFiles([]) }
  }

  const handleKeyUp = (e: any) => {
    if (e.code === 'Enter') {
      e.preventDefault()
      // prevent send message when using input method enter
      if (!e.shiftKey && !isUseInputMethod.current) { handleSend() }
    }
  }

  const handleKeyDown = (e: any) => {
    isUseInputMethod.current = e.nativeEvent.isComposing
    if (e.code === 'Enter' && !e.shiftKey) {
      const result = query.replace(/\n$/, '')
      setQuery(result)
      queryRef.current = result
      e.preventDefault()
    }
  }

  const scrollChatToBottom = React.useCallback(() => {
    const list = chatListRef.current
    if (list) { list.scrollTop = list.scrollHeight }
  }, [])

  useEffect(() => {
    scrollChatToBottom()
    let secondFrame = 0
    const firstFrame = window.requestAnimationFrame(() => {
      scrollChatToBottom()
      secondFrame = window.requestAnimationFrame(scrollChatToBottom)
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      if (secondFrame) { window.cancelAnimationFrame(secondFrame) }
    }
  }, [chatList, isResponding, scrollChatToBottom])

  useEffect(() => {
    if (!isResponding) { return }
    const list = chatListRef.current
    if (!list || typeof ResizeObserver === 'undefined') { return }

    const resizeObserver = new ResizeObserver(scrollChatToBottom)
    Array.from(list.children).forEach(child => resizeObserver.observe(child))

    return () => resizeObserver.disconnect()
  }, [chatList, isResponding, scrollChatToBottom])
  const suggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    queryRef.current = suggestion
    handleSend()
  }

  return (
    <div className='flex h-full min-h-0 flex-col'>
      {/* Chat List */}
      <div ref={chatListRef} className={cn(s.chatList, 'min-h-0 flex-1 overflow-y-auto overflow-x-hidden space-y-[30px] pb-6')}>
        {chatList.map((item) => {
          if (item.isAnswer) {
            const isLast = item.id === chatList[chatList.length - 1].id
            return <Answer
              key={item.id}
              item={item}
              feedbackDisabled={feedbackDisabled}
              onFeedback={onFeedback}
              isResponding={isResponding && isLast}
              suggestionClick={suggestionClick}
              onDodexSendMessage={sendPlainMessage}
              onDodexExecuteFunction={onDodexExecuteFunction}
            />
          }
          return (
            <Question
              key={item.id}
              id={item.id}
              content={item.content}
              useCurrentUserAvatar={useCurrentUserAvatar}
              imgSrcs={(item.message_files && item.message_files?.length > 0) ? item.message_files.map(item => item.url) : []}
            />
          )
        })}
      </div>
      {
        !isHideSendInput && (
          <div className='shrink-0 w-full'>
            <div className={s['ai-chat-input']}>
              <div className={cn(s.chatInputWrap, 'flex-1 min-w-0 border border-[rgba(255,247,239,0.14)] rounded-[999px] px-4 py-0 bg-[#ffffff14] text-[#fff7ef] backdrop-blur transition-[border-color,background,box-shadow] duration-150 ease-in-out focus-within:border-[rgba(255,247,239,0.28)] focus-within:bg-[#ffffff1f] focus-within:shadow-[0_0_0_3px_rgba(255,247,239,0.08)]')}>
                {
                  visionConfig?.enabled && (
                    <>
                      <div className='absolute bottom-2 left-2 flex items-center'>
                        <ChatImageUploader
                          settings={visionConfig}
                          onUpload={onUpload}
                          disabled={files.length >= visionConfig.number_limits}
                        />
                        <div className='mx-1 w-[1px] h-4 bg-black/5' />
                      </div>
                      <div className='pl-[52px]'>
                        <ImageList
                          list={files}
                          onRemove={onRemove}
                          onReUpload={onReUpload}
                          onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                          onImageLinkLoadError={onImageLinkLoadError}
                        />
                      </div>
                    </>
                  )
                }
                {
                  fileConfig?.enabled && (
                    <div className={`${visionConfig?.enabled ? 'pl-[52px]' : ''} mb-1`}>
                      <FileUploaderInAttachmentWrapper
                        fileConfig={fileConfig}
                        value={attachmentFiles}
                        onChange={setAttachmentFiles}
                      />
                    </div>
                  )
                }
                <Textarea
                  className={cn(
                    s.chatTextArea,
                    'block w-full p-0 pr-0 py-[10px] leading-5 text-sm text-[#fff7ef] bg-transparent outline-none appearance-none resize-none',
                    visionConfig?.enabled && 'pl-12',
                  )}
                  value={query}
                  placeholder='请输入你的问题'
                  onChange={handleContentChange}
                  onKeyUp={handleKeyUp}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  wrap='off'
                  autoSize={false}
                />
              </div>
              <Tooltip
                selector='send-tip'
                htmlContent={
                  <div>
                    <div>{t('common.operation.send')} Enter</div>
                    <div>{t('common.operation.lineBreak')} Shift Enter</div>
                  </div>
                }
              >
                <div className={cn(s.sendBtn, 'w-11 h-11 shrink-0')} onClick={handleSend}></div>
              </Tooltip>
            </div>
          </div>
        )
      }
    </div>
  )
}

export default React.memo(Chat)
