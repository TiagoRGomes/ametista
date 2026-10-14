export const DEFAULT_THEME_COLOR = '#f0782c'

export const THEME_PRESETS = [
  { name: 'Laranja Ametista', value: '#f0782c' },
  { name: 'Laranja vivo', value: '#ed6a0c' },
  { name: 'Terracota', value: '#c65322' },
  { name: 'Âmbar', value: '#f59e0b' },
  { name: 'Azul', value: '#2563eb' },
  { name: 'Verde', value: '#16803c' },
  { name: 'Vinho', value: '#be123c' },
  { name: 'Grafite', value: '#52525b' },
]

export function isValidHexColor(value) {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value || '').trim())
}

export function normalizeHexColor(value, fallback = DEFAULT_THEME_COLOR) {
  const raw = String(value || '').trim()
  if (!isValidHexColor(raw)) return fallback
  const hex = raw.slice(1)
  return `#${hex.length === 3 ? hex.split('').map((digit) => digit + digit).join('') : hex}`.toLowerCase()
}

function rgbFromHex(hex) {
  const normalized = normalizeHexColor(hex)
  return normalized.slice(1).match(/.{2}/g).map((part) => Number.parseInt(part, 16))
}

function luminance(hex) {
  const channels = rgbFromHex(hex).map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrastRatio(first, second) {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}

export function getReadableTextColor(hex) {
  const normalized = normalizeHexColor(hex)
  return contrastRatio(normalized, '#000000') >= contrastRatio(normalized, '#ffffff')
    ? '#000000'
    : '#ffffff'
}

export function getThemeCssVariables(value) {
  const color = normalizeHexColor(value)
  const [red, green, blue] = rgbFromHex(color)
  const contrastColor = getReadableTextColor(color)
  const [contrastRed, contrastGreen, contrastBlue] = rgbFromHex(contrastColor)
  return {
    '--brand-color': color,
    '--brand-rgb': `${red} ${green} ${blue}`,
    // Legacy alias retained for existing utility classes; it now uses the exact selected brand color.
    '--brand-dark-color': color,
    '--brand-contrast-color': contrastColor,
    '--brand-contrast-rgb': `${contrastRed} ${contrastGreen} ${contrastBlue}`,
  }
}
