'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import cn from 'classnames'
import QRCode from 'qrcode'

type DodexActionType = 'buttons' | 'menu' | 'list' | 'qrcode' | 'command'

export interface DodexFunctionCall {
  name?: string
  arguments?: Record<string, unknown>
  items?: DodexActionItem[]
}

export interface DodexActionItem {
  id?: string
  label?: string
  title?: string
  subtitle?: string
  subTitle?: string
  description?: string
  desc?: string
  price?: string
  priceText?: string
  amount?: string | number
  imageUrl?: string
  image_url?: string
  image?: string
  thumbnail?: string
  picture?: string
  message?: string
  value?: string
  submitText?: string
  name?: string
  arguments?: Record<string, unknown>
  function?: DodexFunctionCall
}

export interface DodexActionsPayload {
  type?: DodexActionType | string
  direction?: string
  layoutDirection?: string
  buttonDirection?: string
  orientation?: string
  wrap?: boolean
  items?: DodexActionItem[]
}

interface DodexActionsProps {
  payload: DodexActionsPayload
  actionKey?: string
  onSendMessage?: (message: string) => void
  onExecuteFunction?: (functionCall: DodexFunctionCall, item: DodexActionItem) => boolean | void
}

const supportedTypes = new Set<DodexActionType>(['buttons', 'menu', 'list', 'qrcode', 'command'])
const executedCommandKeys = new Set<string>()

export function parseDodexActions(content: string): DodexActionsPayload | null {
  try {
    const payload = JSON.parse(content.trim()) as DodexActionsPayload
    if (payload.type && !supportedTypes.has(payload.type as DodexActionType)) { return null }
    const type = normalizeType(payload.type)
    if (!Array.isArray(payload.items) || payload.items.length === 0) { return null }

    const validItems = payload.items.filter((item) => {
      if (!item || typeof item !== 'object') { return false }
      if (type === 'command') { return !!normalizeFunction(item) }
      if (type === 'qrcode') { return !!getItemValue(item) }
      return !!getItemLabel(item) || !!getItemValue(item) || !!normalizeFunction(item)
    })

    if (validItems.length === 0) { return null }
    return {
      ...payload,
      type,
      items: validItems,
    }
  }
  catch {
    return null
  }
}

export function DodexActions({ payload, actionKey, onSendMessage, onExecuteFunction }: DodexActionsProps) {
  const type = normalizeType(payload.type)
  const items = useMemo(() => payload.items ?? [], [payload.items])
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeMenuItems, setActiveMenuItems] = useState<DodexActionItem[]>([])
  const commandKey = actionKey ?? JSON.stringify(payload)
  const onSendMessageRef = useRef(onSendMessage)
  const onExecuteFunctionRef = useRef(onExecuteFunction)

  useEffect(() => {
    onSendMessageRef.current = onSendMessage
    onExecuteFunctionRef.current = onExecuteFunction
  }, [onExecuteFunction, onSendMessage])

  useEffect(() => {
    if (type !== 'command' || executedCommandKeys.has(commandKey)) { return }
    executedCommandKeys.add(commandKey)
    items.forEach(item => executeAction(item, onSendMessageRef.current, onExecuteFunctionRef.current))
  }, [commandKey, items, type])

  const buttonDirection = normalizeDirection(payload)
  const shouldWrap = payload.wrap === true

  if (type === 'command') { return null }

  if (type === 'menu') {
    return (
      <div className="my-3 max-w-full">
        <select
          className="max-w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm outline-none focus:border-blue-400"
          defaultValue=""
          onChange={(event) => {
            const item = items.find(option => getItemId(option) === event.target.value)
            if (item) { executeAction(item, onSendMessage, onExecuteFunction) }
            event.target.value = ''
          }}
        >
          <option value="" disabled>请选择</option>
          {items.map(item => (
            <option key={getItemId(item)} value={getItemId(item)}>{getItemLabel(item)}</option>
          ))}
        </select>
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div className="my-3 flex flex-col gap-2">
        {items.map(item => (
          <button
            key={getItemId(item)}
            type="button"
            className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-blue-300 hover:shadow"
            onClick={() => handleActionClick(item, onSendMessage, onExecuteFunction, setActiveMenuItems, setMenuOpen)}
          >
            {getItemImage(item) && (
              <img src={getItemImage(item)} alt={getItemTitle(item)} className="h-14 w-14 shrink-0 rounded-md object-cover" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-gray-900">{getItemTitle(item)}</span>
              {getItemSubtitle(item) && <span className="mt-1 block line-clamp-2 text-xs text-gray-500">{getItemSubtitle(item)}</span>}
              {getItemPrice(item) && <span className="mt-1 block text-sm font-semibold text-blue-600">{getItemPrice(item)}</span>}
            </span>
          </button>
        ))}
        <InlineActionMenu open={menuOpen} items={activeMenuItems} onClose={() => setMenuOpen(false)} onSendMessage={onSendMessage} onExecuteFunction={onExecuteFunction} />
      </div>
    )
  }

  if (type === 'qrcode') {
    return (
      <div className="my-3 grid gap-2">
        {items.map(item => (
          <DodexQRCode key={getItemId(item)} item={item} />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'my-3 flex gap-2',
        buttonDirection === 'vertical' ? 'flex-col items-stretch' : 'items-center',
        buttonDirection === 'horizontal' && shouldWrap ? 'flex-wrap' : '',
      )}
    >
      {items.map(item => (
        <button
          key={getItemId(item)}
          type="button"
          className="min-h-9 max-w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-blue-600 shadow-sm transition hover:border-blue-300 hover:shadow"
          onClick={() => handleActionClick(item, onSendMessage, onExecuteFunction, setActiveMenuItems, setMenuOpen)}
        >
          <span className="block truncate">{getItemLabel(item)}</span>
        </button>
      ))}
      <InlineActionMenu open={menuOpen} items={activeMenuItems} onClose={() => setMenuOpen(false)} onSendMessage={onSendMessage} onExecuteFunction={onExecuteFunction} />
    </div>
  )
}

function DodexQRCode({ item }: { item: DodexActionItem }) {
  const value = getItemValue(item)
  const title = getItemTitle(item)
  const [imageUrl, setImageUrl] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    QRCode.toDataURL(value, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 180,
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (!cancelled) {
          setImageUrl(url)
          setFailed(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setImageUrl('')
          setFailed(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [value])

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-center shadow-sm">
      <div className="flex justify-center">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={title || '二维码'}
            className="h-[180px] w-[180px] rounded-md border border-gray-100 bg-white p-2"
          />
        )}
        {!imageUrl && (
          <div className="flex h-[180px] w-[180px] items-center justify-center rounded-md border border-gray-100 bg-gray-50 text-xs text-gray-500">
            {failed ? '二维码生成失败' : '二维码生成中'}
          </div>
        )}
      </div>
      {title && <div className="mt-2 text-center text-sm font-medium text-gray-900">{title}</div>}
    </div>
  )
}

function InlineActionMenu({ open, items, onClose, onSendMessage, onExecuteFunction }: {
  open: boolean
  items: DodexActionItem[]
  onClose: () => void
  onSendMessage?: (message: string) => void
  onExecuteFunction?: (functionCall: DodexFunctionCall, item: DodexActionItem) => boolean | void
}) {
  if (!open) { return null }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/20" onClick={onClose}>
      <div className="w-full rounded-t-2xl bg-white p-3 shadow-xl" onClick={event => event.stopPropagation()}>
        {items.map(item => (
          <button
            key={getItemId(item)}
            type="button"
            className="flex w-full flex-col rounded-lg px-3 py-3 text-left hover:bg-gray-50"
            onClick={() => {
              executeAction(item, onSendMessage, onExecuteFunction)
              onClose()
            }}
          >
            <span className="text-sm font-medium text-gray-900">{getItemLabel(item)}</span>
            {getItemSubtitle(item) && <span className="mt-1 text-xs text-gray-500">{getItemSubtitle(item)}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

function handleActionClick(
  item: DodexActionItem,
  onSendMessage: DodexActionsProps['onSendMessage'],
  onExecuteFunction: DodexActionsProps['onExecuteFunction'],
  setActiveMenuItems: (items: DodexActionItem[]) => void,
  setMenuOpen: (open: boolean) => void,
) {
  const functionCall = normalizeFunction(item)
  if (functionCall?.name === 'show_menu' && Array.isArray(functionCall.items) && functionCall.items.length > 0) {
    setActiveMenuItems(functionCall.items.filter(menuItem => !!getItemLabel(menuItem)))
    setMenuOpen(true)
    return
  }
  executeAction(item, onSendMessage, onExecuteFunction)
}

function executeAction(
  item: DodexActionItem,
  onSendMessage?: (message: string) => void,
  onExecuteFunction?: (functionCall: DodexFunctionCall, item: DodexActionItem) => boolean | void,
) {
  const directMessage = getItemValue(item)
  const functionCall = normalizeFunction(item)
  const functionName = functionCall?.name
  const functionArgs = functionCall?.arguments ?? {}

  if (functionName === 'send_message' && typeof functionArgs.text === 'string' && functionArgs.text.trim()) {
    onSendMessage?.(functionArgs.text)
    return
  }

  if (functionCall?.name) {
    executeFunction(functionCall, item, onExecuteFunction)
    return
  }

  if (directMessage) {
    onSendMessage?.(directMessage)
  }
}

function executeFunction(
  functionCall: DodexFunctionCall,
  item: DodexActionItem,
  onExecuteFunction?: (functionCall: DodexFunctionCall, item: DodexActionItem) => boolean | void,
) {
  const isHandled = onExecuteFunction?.(functionCall, item)
  if (isHandled) { return }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dodex-action', { detail: { item, function: functionCall } }))
    const webView = (window as Window & { ReactNativeWebView?: { postMessage: (message: string) => void } }).ReactNativeWebView
    webView?.postMessage(JSON.stringify({ type: 'dodex-action', item, function: functionCall }))
  }
}

function normalizeType(type: DodexActionsPayload['type']): DodexActionType {
  return supportedTypes.has(type as DodexActionType) ? type as DodexActionType : 'buttons'
}

function normalizeDirection(payload: DodexActionsPayload) {
  const direction = payload.direction ?? payload.layoutDirection ?? payload.buttonDirection ?? payload.orientation
  return direction === 'vertical' ? 'vertical' : 'horizontal'
}

function normalizeFunction(item: DodexActionItem): DodexFunctionCall | null {
  if (item.function?.name) { return item.function }
  if (item.name) {
    return {
      name: item.name,
      arguments: item.arguments,
    }
  }
  return null
}

function getItemId(item: DodexActionItem) {
  return item.id || getItemLabel(item) || getItemValue(item) || JSON.stringify(item)
}

function getItemLabel(item: DodexActionItem) {
  return item.label || item.title || item.name || ''
}

function getItemTitle(item: DodexActionItem) {
  return item.title || item.label || item.name || ''
}

function getItemSubtitle(item: DodexActionItem) {
  return item.subtitle || item.subTitle || item.description || item.desc || ''
}

function getItemPrice(item: DodexActionItem) {
  const price = item.price || item.priceText || item.amount
  return price === undefined || price === null ? '' : String(price)
}

function getItemImage(item: DodexActionItem) {
  return item.imageUrl || item.image_url || item.image || item.thumbnail || item.picture || ''
}

function getItemValue(item: DodexActionItem) {
  return item.message || item.value || item.submitText || ''
}
