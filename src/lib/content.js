import { supabase, isSupabaseConfigured } from './supabase'
import { DEFAULT_CATEGORIES, DEFAULT_PRODUCTS, DEFAULT_SITE } from '../data/defaults'

export async function loadPublicContent() {
  if (!isSupabaseConfigured) return { site: DEFAULT_SITE, categories: DEFAULT_CATEGORIES, products: DEFAULT_PRODUCTS, source: 'defaults' }
  try {
    const [siteResult, categoryResult, productResult] = await Promise.all([
      supabase.from('site_content').select('*').eq('id', 1).maybeSingle(),
      supabase.from('categories').select('*').eq('is_visible', true).order('position'),
      supabase.from('products').select('*, category:categories(id, name, slug)').eq('is_visible', true).order('position'),
    ])
    const error = siteResult.error || categoryResult.error || productResult.error
    if (error) throw error
    return {
      site: { ...DEFAULT_SITE, ...(siteResult.data || {}), address: siteResult.data?.address?.trim() ? siteResult.data.address : DEFAULT_SITE.address },
      categories: categoryResult.data ?? DEFAULT_CATEGORIES,
      products: productResult.data ?? DEFAULT_PRODUCTS,
      source: 'supabase',
    }
  } catch (error) {
    console.warn('Não foi possível carregar o conteúdo do Supabase. Usando o conteúdo local.', error)
    return { site: DEFAULT_SITE, categories: DEFAULT_CATEGORIES, products: DEFAULT_PRODUCTS, source: 'defaults' }
  }
}

export async function uploadMedia(file) {
  if (!supabase) throw new Error('Configure o Supabase antes de enviar imagens.')
  if (!file?.type?.startsWith('image/')) throw new Error('Escolha um arquivo de imagem.')
  if (file.size > 8 * 1024 * 1024) throw new Error('A imagem deve ter até 8 MB.')
  const safeName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase()
  const path = `${Date.now()}-${safeName}`
  const { error } = await supabase.storage.from('ametista-media').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from('ametista-media').getPublicUrl(path)
  return data.publicUrl
}
