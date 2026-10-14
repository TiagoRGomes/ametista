import { DEFAULT_CATEGORIES, DEFAULT_PRODUCTS, DEFAULT_SITE } from '../data/defaults.js'
import { isSupabaseConfigured, supabase } from './supabase.js'

const clone = (value) => JSON.parse(JSON.stringify(value))

function localFallback() {
  return {
    site: clone(DEFAULT_SITE),
    categories: clone(DEFAULT_CATEGORIES),
    products: clone(DEFAULT_PRODUCTS),
  }
}

/**
 * Loads public page content from Supabase. If configuration or database access
 * is unavailable, the website remains usable with the bundled default content.
 */
export async function loadPublicContent() {
  if (!isSupabaseConfigured || !supabase) return localFallback()

  try {
    const [siteResult, categoriesResult, productsResult] = await Promise.all([
      supabase.from('site_content').select('*').eq('id', 1).maybeSingle(),
      supabase.from('categories').select('*').eq('is_visible', true).order('position', { ascending: true }),
      supabase
        .from('products')
        .select('*, category:categories(id, name, slug)')
        .eq('is_visible', true)
        .order('position', { ascending: true }),
    ])

    const failedResult = [siteResult, categoriesResult, productsResult].find((result) => result.error)
    if (failedResult?.error) throw failedResult.error

    const fallback = localFallback()
    return {
      site: { ...fallback.site, ...(siteResult.data || {}) },
      categories: (categoriesResult.data || []).map((category) => ({
        ...category,
        products: Array.isArray(category.products) ? category.products : [],
      })),
      products: productsResult.data || [],
    }
  } catch (error) {
    // Do not leave the public page blank if Supabase is not yet fully set up.
    console.error('[Ametista] Não foi possível carregar o conteúdo do Supabase. Usando conteúdo padrão.', error)
    return localFallback()
  }
}

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
])
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024
const EXTENSION_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
}

/** Uploads an image to the public bucket used by the Ametista CMS. */
export async function uploadMedia(file) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('O Supabase não está configurado. Confira as variáveis VITE_SUPABASE_* no arquivo .env.')
  }
  if (!file || typeof file !== 'object') {
    throw new Error('Selecione uma imagem para enviar.')
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Formato não permitido. Use JPG, PNG, WebP, GIF ou SVG.')
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('A imagem excede o limite de 8 MB.')
  }

  const originalName = String(file.name || 'imagem').replace(/\.[^.]+$/, '')
  const safeName = originalName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'imagem'
  const uniqueId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const path = `${uniqueId}-${safeName}.${EXTENSION_BY_TYPE[file.type]}`

  const { data, error } = await supabase.storage
    .from('ametista-media')
    .upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

  if (error) throw new Error(`Falha ao enviar imagem: ${error.message}`)

  const { data: publicData } = supabase.storage.from('ametista-media').getPublicUrl(data.path)
  if (!publicData?.publicUrl) throw new Error('A imagem foi enviada, mas não foi possível obter sua URL pública.')
  return publicData.publicUrl
}
