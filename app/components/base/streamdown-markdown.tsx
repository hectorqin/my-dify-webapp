'use client'
import type React from 'react'
import type { ComponentProps } from 'react'
import { Streamdown } from 'streamdown'
import 'katex/dist/katex.min.css'
import type { DodexActionItem, DodexFunctionCall } from './dodex-actions'
import { DodexActions, parseDodexActions } from './dodex-actions'

interface StreamdownMarkdownProps {
  content: string
  className?: string
  actionContextId?: string
  onSendMessage?: (message: string) => void
  onExecuteFunction?: (functionCall: DodexFunctionCall, item: DodexActionItem) => boolean | void
}

type CodeProps = ComponentProps<'code'> & {
  node?: {
    position?: {
      start?: {
        line?: number
        offset?: number
      }
      end?: {
        line?: number
      }
    }
  }
}

export function StreamdownMarkdown({
  content,
  className = '',
  actionContextId,
  onSendMessage,
  onExecuteFunction,
}: StreamdownMarkdownProps) {
  const components = {
    code({ className: codeClassName, children, node, ...props }: CodeProps) {
      const language = codeClassName?.match(/language-([^\s]+)/)?.[1]
      const codeContent = getCodeContent(children)
      const isBlockCode = node?.position?.start?.line !== node?.position?.end?.line

      if (language === 'dodex-actions' && isBlockCode) {
        const payload = parseDodexActions(codeContent)
        if (payload) {
          return (
            <DodexActions
              payload={payload}
              actionKey={`${actionContextId ?? 'message'}:${node?.position?.start?.offset ?? codeContent}`}
              onSendMessage={onSendMessage}
              onExecuteFunction={onExecuteFunction}
            />
          )
        }
      }

      if (isBlockCode) {
        return (
          <pre className="my-4 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
            <code className={codeClassName} {...props}>{children}</code>
          </pre>
        )
      }

      return <code className={codeClassName} {...props}>{children}</code>
    },
  }

  return (
    <div className={`streamdown-markdown ${className}`}>
      <Streamdown components={components}>{content}</Streamdown>
    </div>
  )
}

export default StreamdownMarkdown

function getCodeContent(children: React.ReactNode): string {
  if (typeof children === 'string') { return children }
  if (Array.isArray(children)) { return children.map(getCodeContent).join('') }
  if (children && typeof children === 'object' && 'props' in children) {
    const childProps = (children as React.ReactElement<{ children?: React.ReactNode }>).props
    return getCodeContent(childProps.children)
  }
  return ''
}
