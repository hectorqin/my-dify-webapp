import type { Locale } from '@/i18n'

interface DifyParametersLike {
  opening_statement?: string
  suggested_questions?: string[]
}

const FALLBACK_LOCALE = 'en'

export function formatWelcomeMessageFromParameters(parameters: DifyParametersLike, locale: Locale | string) {
  const openingStatement = resolveLocalizedText(parameters.opening_statement || '', locale)
  const suggestedQuestions = (parameters.suggested_questions || [])
    .map(question => resolveLocalizedText(question, locale).trim())
    .filter(Boolean)
    .filter((question, index, questions) => questions.indexOf(question) === index)

  if (suggestedQuestions.length === 0) { return openingStatement }

  return [
    openingStatement,
    '```dodex-actions',
    JSON.stringify({
      type: 'buttons',
      wrap: true,
      items: suggestedQuestions.map((question, index) => ({
        id: String(index + 1),
        label: question,
        value: question,
      })),
    }),
    '```',
  ].filter(Boolean).join('\n\n')
}

export function resolveLocalizedText(text: string, locale: Locale | string) {
  const source = text.trim()
  if (!source) { return '' }

  const localizedText = parseLocalizedText(source)
  const entries = Object.keys(localizedText)
  if (entries.length === 0) { return source }

  const localeCandidates = buildLocaleCandidates(locale)
  for (const candidate of localeCandidates) {
    const value = localizedText[candidate]
    if (value?.trim()) { return value.trim() }
  }

  for (const candidate of buildLocaleCandidates(FALLBACK_LOCALE)) {
    const value = localizedText[candidate]
    if (value?.trim()) { return value.trim() }
  }

  return source
}

export function parseLocalizedText(text: string) {
  const result: Record<string, string> = {}
  const pattern = /<([a-zA-Z][a-zA-Z0-9_-]*)>([\s\S]*?)<\/\1>/g
  let match = pattern.exec(text)

  while (match !== null) {
    const language = match[1]
    const value = match[2].trim()
    buildLocaleCandidates(language).forEach((candidate) => {
      result[candidate] = value
    })
    match = pattern.exec(text)
  }

  return result
}

function buildLocaleCandidates(locale: Locale | string) {
  const normalized = locale.trim()
  if (!normalized) { return [] }

  const lower = normalized.toLowerCase()
  const hyphen = normalized.replace(/_/g, '-')
  const underscore = normalized.replace(/-/g, '_')
  const language = lower.split(/[-_]/)[0]
  const candidates = [
    normalized,
    hyphen,
    underscore,
    lower,
    lower.replace(/_/g, '-'),
    lower.replace(/-/g, '_'),
    language,
  ]

  switch (language) {
    case 'zh':
      candidates.push('zh-CN', 'zh_CN', 'zh-Hans', 'zh_Hans', 'zh')
      break
    case 'en':
      candidates.push('en-US', 'en_US', 'en')
      break
    case 'es':
      candidates.push('es-ES', 'es_ES', 'es')
      break
    case 'pt':
      candidates.push('pt-BR', 'pt_BR', 'pt')
      break
    case 'ja':
      candidates.push('ja-JP', 'ja_JP', 'ja')
      break
    case 'fr':
      candidates.push('fr-FR', 'fr_FR', 'fr')
      break
    case 'vi':
      candidates.push('vi-VN', 'vi_VN', 'vi')
      break
  }

  return Array.from(new Set(candidates.filter(Boolean)))
}
