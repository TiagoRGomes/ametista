import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown, ArrowLeft, ArrowUp, Check, ChevronRight, Eye, EyeOff,
  FileText, ImagePlus, LayoutDashboard, LogOut, Package, Pencil, Plus,
  Save, Settings, ShieldCheck, Trash2, Upload, X, Boxes, AlertCircle, Palette, RotateCcw,
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase.js'
import { uploadMedia } from './lib/content.js'
import { DEFAULT_CATEGORIES, DEFAULT_PRODUCTS, DEFAULT_SITE } from './data/defaults.js'
import { DEFAULT_THEME_COLOR, THEME_PRESETS, getReadableTextColor, getThemeCssVariables, isValidHexColor, normalizeHexColor } from './lib/theme.js'

const tabs = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'site', label: 'Página inicial', icon: FileText },
  { id: 'appearance', label: 'Aparência', icon: Palette },
  { id: 'categories', label: 'Categorias', icon: Boxes },
  { id: 'products', label: 'Produtos', icon: Package },
]
const sectionLabels = { categories: 'Categorias', products: 'Produtos', about: 'Sobre a loja', cta: 'Faixa de contacto' }
const slugify = (text = '') => text.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function Field({ label, value, onChange, placeholder = '', multiline = false, type = 'text', hint = '' }) {
  const klass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/20'
  return <label className="block text-sm font-bold text-slate-700">{label}{hint && <span className="ml-2 text-xs font-normal text-slate-400">{hint}</span>}{multiline ? <textarea rows={3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${klass} resize-y`} /> : <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={klass}/>}</label>
}
function Toggle({ label, checked, onChange, description }) {
  return <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-slate-200 p-3"><span><span className="block text-sm font-bold text-slate-800">{label}</span>{description && <span className="mt-0.5 block text-xs text-slate-500">{description}</span>}</span><input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 accent-brand"/></label>
}
function Notice({ children, error = false }) {
  return <div className={`mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}><AlertCircle size={17} className="mt-0.5 shrink-0"/><span>{children}</span></div>
}
function ImageField({ label, value, onChange }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function handleFile(file) {
    if (!file) return
    setError(''); setBusy(true)
    try { const url = await uploadMedia(file); onChange(url) }
    catch (err) { setError(err.message || 'Não foi possível enviar a imagem.') }
    finally { setBusy(false) }
  }
  return <div><label className="block text-sm font-bold text-slate-700">{label}</label><div className="mt-1.5 flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 p-3 sm:flex-row sm:items-center"><div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-slate-100">{value ? <img src={value} alt="Pré-visualização" className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center text-slate-400"><ImagePlus size={24}/></div>}</div><div className="min-w-0 flex-1"><input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="URL da imagem ou envie um arquivo" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand"/><label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"><Upload size={14}/>{busy ? 'Enviando...' : 'Enviar imagem'}<input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = '' }}/></label><p className="mt-1 text-[11px] text-slate-400">A imagem deve ter até 8 MB. O envio exige o Storage configurado no Supabase.</p>{error && <p className="mt-1 text-xs text-red-600">{error}</p>}</div></div></div>
}

export default function Admin() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [page, setPage] = useState('overview')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [site, setSite] = useState(DEFAULT_SITE)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [editCategory, setEditCategory] = useState(null)
  const [editProduct, setEditProduct] = useState(null)

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  async function loadAdminData() {
    setBusy(true); setError('')
    try {
      const [s, c, p] = await Promise.all([
        supabase.from('site_content').select('*').eq('id', 1).maybeSingle(),
        supabase.from('categories').select('*').order('position'),
        supabase.from('products').select('*, category:categories(id, name, slug)').order('position'),
      ])
      const failure = s.error || c.error || p.error
      if (failure) throw failure
      setSite({ ...DEFAULT_SITE, ...(s.data || {}) })
      setCategories(c.data || [])
      setProducts(p.data || [])
    } catch (err) {
      setError(`${err.message || 'Erro ao carregar os dados.'} Verifique se executou supabase/schema.sql e cadastrou seu usuário em admin_users.`)
    } finally { setBusy(false) }
  }
  useEffect(() => { if (session && isSupabaseConfigured) loadAdminData() }, [session])

  async function signIn(event) {
    event.preventDefault(); setAuthError(''); setBusy(true)
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (authErr) setAuthError(authErr.message)
    setBusy(false)
  }
  async function resetPassword() {
    setAuthError('')
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/admin` })
    setAuthError(resetErr ? resetErr.message : 'Se esse e-mail estiver cadastrado, você receberá um link para redefinir a senha.')
  }
  async function signOut() { await supabase.auth.signOut(); setSession(null) }
  async function saveSite(event) {
    event.preventDefault()
    if (page === 'appearance' && !isValidHexColor(site.theme_primary)) {
      setError('Informe uma cor hexadecimal válida, como #f0782c.')
      setMessage('')
      return
    }
    setBusy(true); setError(''); setMessage('')
    const payload = { ...site, theme_primary: normalizeHexColor(site.theme_primary), id: 1, updated_at: new Date().toISOString() }
    const { error: saveError } = await supabase.from('site_content').upsert(payload, { onConflict: 'id' })
    if (saveError) setError(saveError.message)
    else { setMessage('Conteúdo da página salvo com sucesso.'); setSite(payload) }
    setBusy(false)
  }
  async function saveCategory(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    const payload = { ...editCategory, slug: slugify(editCategory.slug || editCategory.name), products: typeof editCategory.productsText === 'string' ? editCategory.productsText.split('\n').map((x) => x.trim()).filter(Boolean) : editCategory.products || [], updated_at: new Date().toISOString() }
    delete payload.productsText
    const result = payload.id ? await supabase.from('categories').update(payload).eq('id', payload.id) : await supabase.from('categories').insert(payload)
    if (result.error) setError(result.error.message)
    else { setMessage('Categoria salva.'); setEditCategory(null); await loadAdminData() }
    setBusy(false)
  }
  async function deleteCategory(category) {
    if (!window.confirm(`Excluir a categoria “${category.name}”?`)) return
    setBusy(true); const { error: deleteError } = await supabase.from('categories').delete().eq('id', category.id)
    if (deleteError) setError(deleteError.message); else { setMessage('Categoria excluída.'); await loadAdminData() }
    setBusy(false)
  }
  async function saveProduct(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    const payload = { ...editProduct, category_id: editProduct.category_id || null, slug: slugify(editProduct.slug || editProduct.name), updated_at: new Date().toISOString() }
    delete payload.category
    const result = payload.id ? await supabase.from('products').update(payload).eq('id', payload.id) : await supabase.from('products').insert(payload)
    if (result.error) setError(result.error.message)
    else { setMessage('Produto salvo.'); setEditProduct(null); await loadAdminData() }
    setBusy(false)
  }
  async function deleteProduct(product) {
    if (!window.confirm(`Excluir o produto “${product.name}”?`)) return
    setBusy(true); const { error: deleteError } = await supabase.from('products').delete().eq('id', product.id)
    if (deleteError) setError(deleteError.message); else { setMessage('Produto excluído.'); await loadAdminData() }
    setBusy(false)
  }
  async function toggleVisibility(table, item) {
    setBusy(true); const { error: updateError } = await supabase.from(table).update({ is_visible: !item.is_visible }).eq('id', item.id)
    if (updateError) setError(updateError.message); else await loadAdminData()
    setBusy(false)
  }
  async function moveSection(index, direction) {
    const order = [...(site.section_order || ['categories','products','about','cta'])]
    const target = index + direction
    if (target < 0 || target >= order.length) return
    ;[order[index], order[target]] = [order[target], order[index]]
    setSite({ ...site, section_order: order })
  }

  if (!isSupabaseConfigured) return <ConfigHelp />
  if (authLoading) return <div className="grid min-h-screen place-items-center bg-slate-50 text-slate-500">Verificando sessão...</div>
  if (!session) return <div className="flex min-h-screen items-center justify-center bg-[#f6f5f2] p-4" style={getThemeCssVariables(DEFAULT_THEME_COLOR)}><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9"><a href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand"><ArrowLeft size={16}/> Voltar ao site</a><div className="mt-7 flex items-center gap-3"><img src="/images/logo-ametista.jpg" alt="Ametista" className="h-14 w-14 object-contain"/><div><p className="text-xs font-extrabold uppercase tracking-[.2em] text-brand">Área restrita</p><h1 className="text-2xl font-black text-slate-900">Administração</h1></div></div><p className="mt-4 text-sm leading-6 text-slate-500">Entre com o usuário de administrador criado no Supabase. O cadastro público não é permitido.</p>{authError && <Notice error>{authError}</Notice>}<form className="mt-6 space-y-4" onSubmit={signIn}><Field label="E-mail" value={email} onChange={setEmail} type="email" placeholder="admin@sualoja.com.br"/><Field label="Senha" value={password} onChange={setPassword} type="password" placeholder="Sua senha"/><button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 font-extrabold text-brand-contrast transition hover:brightness-95 disabled:opacity-60">{busy ? 'Entrando...' : 'Entrar no painel'}<ChevronRight size={18}/></button></form><button onClick={resetPassword} className="mt-4 text-sm font-semibold text-slate-500 hover:text-brand">Esqueci minha senha</button><p className="mt-7 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-400">A conta de administrador é criada no painel de autenticação do Supabase, não nesta página.</p></div></div>

  return <div className="min-h-screen bg-[#f6f5f2] text-slate-900" style={getThemeCssVariables(site.theme_primary)}><aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-950 text-white lg:flex"><a href="/" className="flex items-center gap-3 border-b border-white/10 px-5 py-5"><img src="/images/logo-ametista.jpg" className="h-11 w-11 rounded-lg bg-white object-contain" alt="Ametista"/><span><strong className="block font-black tracking-widest">AMETISTA</strong><span className="text-xs text-slate-400">Gestão do site</span></span></a><nav className="flex-1 space-y-1 p-3">{tabs.map(({id,label,icon:Icon})=><button key={id} onClick={()=>{setPage(id);setEditCategory(null);setEditProduct(null);setMessage('');setError('')}} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${page===id?'bg-brand text-brand-contrast':'text-slate-300 hover:bg-white/10 hover:text-white'}`}><Icon size={18}/>{label}</button>)}</nav><div className="border-t border-white/10 p-3"><a href="/" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10"><Eye size={17}/> Ver site público</a><button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10"><LogOut size={17}/> Sair</button></div></aside>
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-brand">Ametista CMS</p><h1 className="text-lg font-black sm:text-xl">{tabs.find((t)=>t.id===page)?.label || 'Editor'}</h1></div><div className="flex items-center gap-3"><a href="/" className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:border-brand/50 sm:inline-flex"><Eye size={16}/> Ver site</a><button onClick={signOut} title="Sair" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:text-red-600"><LogOut size={17}/></button></div></header>
      <main className="mx-auto max-w-6xl p-4 sm:p-7">{message && <Notice>{message}</Notice>}{error && <Notice error>{error}</Notice>}{busy && <p className="mb-3 text-xs font-semibold text-slate-400">Processando...</p>}
        {page==='overview' && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{label:'Categorias cadastradas',value:categories.length,icon:Boxes},{label:'Produtos cadastrados',value:products.length,icon:Package},{label:'Categorias visíveis',value:categories.filter(x=>x.is_visible).length,icon:Eye},{label:'Produtos visíveis',value:products.filter(x=>x.is_visible).length,icon:ShieldCheck}].map(({label,value,icon:Icon})=><div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">{label}</span><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand"><Icon size={19}/></span></div><p className="mt-5 text-3xl font-black">{value}</p></div>)}</div><div className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="text-lg font-black">Comece por aqui</h2><p className="mt-1 text-sm text-slate-500">Edite os conteúdos mais importantes do site.</p><div className="mt-5 space-y-3">{[{title:'Atualize o banner inicial',desc:'Troque título, texto e foto da fachada.',tab:'site',icon:FileText},{title:'Organize as categorias',desc:'Altere nomes, descrições e imagens.',tab:'categories',icon:Boxes},{title:'Gerencie os produtos',desc:'Cadastre produtos sem precisar alterar código.',tab:'products',icon:Package},{title:'Personalize as cores',desc:'Escolha o tom da marca e veja uma prévia do site.',tab:'appearance',icon:Palette}].map(({title,desc,tab,icon:Icon})=><button key={tab} onClick={()=>setPage(tab)} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left hover:border-brand/50 hover:bg-brand/10"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700"><Icon size={19}/></span><span className="flex-1"><strong className="block text-sm">{title}</strong><span className="mt-1 block text-xs text-slate-500">{desc}</span></span><ChevronRight size={17} className="text-slate-400"/></button>)}</div></div><div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 sm:p-6"><div className="flex items-center gap-2 text-brand"><ShieldCheck size={20}/><h2 className="font-black">Antes de publicar</h2></div><p className="mt-3 text-sm leading-6 text-orange-900/80">Confira os links de WhatsApp, morada e horário. As imagens enviadas pelo painel ficam no Supabase Storage, enquanto textos e catálogo ficam no banco de dados.</p><a href="/" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white">Abrir site público <ChevronRight size={16}/></a></div></div></>}

        {page==='site' && <form onSubmit={saveSite} className="space-y-5"><div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><h2 className="text-lg font-black">Identidade da loja</h2><p className="mb-5 mt-1 text-sm text-slate-500">Marca, contactos e informações gerais.</p><div className="grid gap-4 md:grid-cols-2"><Field label="Nome da loja" value={site.business_name} onChange={(v)=>setSite({...site,business_name:v})}/><Field label="Descrição curta" value={site.tagline} onChange={(v)=>setSite({...site,tagline:v})}/><Field label="Telefone fixo" value={site.phone} onChange={(v)=>setSite({...site,phone:v})}/><Field label="WhatsApp construção (código país + número)" value={site.whatsapp_construction} onChange={(v)=>setSite({...site,whatsapp_construction:v.replace(/\D/g,'')})} hint="Ex.: 5535999633377"/><Field label="WhatsApp" value={site.whatsapp_agro} onChange={(v)=>setSite({...site,whatsapp_agro:v.replace(/\D/g,'')})}/><Field label="Morada" value={site.address} onChange={(v)=>setSite({...site,address:v})} placeholder="Endereço da loja"/><Field label="Horário de atendimento" value={site.opening_hours} onChange={(v)=>setSite({...site,opening_hours:v})} placeholder="Seg–Sex, 8h às 18h"/></div></div><div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><h2 className="text-lg font-black">Banner principal</h2><div className="mt-5 grid gap-4"><Field label="Etiqueta pequena" value={site.hero_badge} onChange={(v)=>setSite({...site,hero_badge:v})}/><Field label="Título principal" value={site.hero_title} onChange={(v)=>setSite({...site,hero_title:v})} multiline/><Field label="Texto do banner" value={site.hero_description} onChange={(v)=>setSite({...site,hero_description:v})} multiline/><div className="grid gap-4 md:grid-cols-2"><ImageField label="Logotipo" value={site.logo_url} onChange={(v)=>setSite({...site,logo_url:v})}/><ImageField label="Imagem de destaque" value={site.hero_image_url} onChange={(v)=>setSite({...site,hero_image_url:v})}/></div></div></div><div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><h2 className="text-lg font-black">Sobre a loja e chamada final</h2><div className="mt-5 grid gap-4"><Field label="Título da seção Sobre" value={site.about_title} onChange={(v)=>setSite({...site,about_title:v})} multiline/><Field label="Texto sobre a loja" value={site.about_description} onChange={(v)=>setSite({...site,about_description:v})} multiline/><Field label="Título da chamada final" value={site.cta_title} onChange={(v)=>setSite({...site,cta_title:v})} multiline/><Field label="Texto da chamada final" value={site.cta_description} onChange={(v)=>setSite({...site,cta_description:v})} multiline/></div></div><div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><h2 className="text-lg font-black">Blocos e ordem da página</h2><p className="mb-4 mt-1 text-sm text-slate-500">Escolha o que aparece e mova as seções para cima ou para baixo.</p><div className="grid gap-3 sm:grid-cols-2">{[{key:'show_categories',label:'Categorias'},{key:'show_products',label:'Catálogo de produtos'},{key:'show_about',label:'Sobre a loja'},{key:'show_cta',label:'Faixa de contacto'}].map(({key,label})=><Toggle key={key} label={label} checked={site[key]} onChange={(v)=>setSite({...site,[key]:v})} description="Mostrar esta seção no site público"/>)}</div><div className="mt-5 space-y-2">{(site.section_order||['categories','products','about','cta']).map((item,index,order)=><div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5"><span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-xs font-black">{index+1}</span><span className="flex-1 text-sm font-bold">{sectionLabels[item]}</span><button type="button" disabled={index===0} onClick={()=>moveSection(index,-1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-25" aria-label="Mover seção para cima"><ArrowUp size={16}/></button><button type="button" disabled={index===order.length-1} onClick={()=>moveSection(index,1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-25" aria-label="Mover seção para baixo"><ArrowDown size={16}/></button></div>)}</div></div><div className="sticky bottom-4 flex justify-end"><button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 font-extrabold text-brand-contrast shadow-lg shadow-black/10 hover:brightness-95 disabled:opacity-60"><Save size={17}/> Salvar página</button></div></form>}

        {page==='appearance' && <form onSubmit={saveSite} className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-lg font-black">Tema de cores</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Escolha a cor principal da Ametista. Ela atualiza a faixa superior, o rodapé, destaques, ícones e elementos de ação do site público. A configuração fica salva no Supabase — não é necessário fazer outro deploy.</p></div>
              <button type="button" onClick={()=>setSite({...site,theme_primary:DEFAULT_THEME_COLOR})} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-brand/50 hover:text-brand"><RotateCcw size={14}/> Restaurar laranja original</button>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700">Escolha uma cor personalizada</label>
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                    <input type="color" value={normalizeHexColor(site.theme_primary)} onChange={(event)=>setSite({...site,theme_primary:event.target.value})} aria-label="Selecionar cor do tema" className="h-12 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-0"/>
                    <div className="min-w-0 flex-1"><label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Código hexadecimal</label><input value={site.theme_primary || ''} onChange={(event)=>setSite({...site,theme_primary:event.target.value})} placeholder="#f0782c" spellCheck="false" className={`mt-1 w-full rounded-lg border px-3 py-2.5 font-mono text-sm uppercase outline-none focus:ring-4 ${isValidHexColor(site.theme_primary)?'border-slate-200 focus:border-brand focus:ring-brand/20':'border-red-300 focus:border-red-400 focus:ring-red-100'}`}/>{!isValidHexColor(site.theme_primary) && <p className="mt-1 text-xs text-red-600">Use # seguido de 3 ou 6 caracteres hexadecimais.</p>}</div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Cores sugeridas</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                    {THEME_PRESETS.map((preset)=>{const selected=normalizeHexColor(site.theme_primary)===preset.value;return <button type="button" key={preset.value} onClick={()=>setSite({...site,theme_primary:preset.value})} className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${selected?'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10':'border-slate-200 hover:border-slate-400'}`} aria-pressed={selected} title={`Usar ${preset.name}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-black/10" style={{backgroundColor:preset.value}}>{selected&&<Check size={16} color={getReadableTextColor(preset.value)}/>}</span><span className="min-w-0"><span className="block truncate text-xs font-bold text-slate-700">{preset.name}</span><span className="block font-mono text-[10px] text-slate-400">{preset.value}</span></span></button>})}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Pré-visualização</p>
                <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 shadow-sm" style={getThemeCssVariables(site.theme_primary)}>
                  <div className="bg-brand px-4 py-3 text-sm font-bold text-brand-contrast"><div className="flex flex-wrap items-center justify-between gap-2"><span>Materiais para construção</span><span className="text-xs">(35) 3464-1120</span></div></div>
                  <div className="p-5 sm:p-6"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-brand">Ametista · Sua loja de confiança</p><h3 className="mt-2 text-2xl font-black text-slate-900">Uma obra começa com boas escolhas.</h3><p className="mt-2 text-sm leading-6 text-slate-600">A cor exata escolhida aparece nos destaques, nos botões e nos elementos da marca.</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-lg bg-brand px-3 py-2 text-xs font-bold text-brand-contrast">Destaque</span><span className="rounded-lg bg-brand px-3 py-2 text-xs font-bold text-brand-contrast">Pedir orçamento</span></div></div>
                  <div className="bg-brand px-4 py-4 text-brand-contrast"><p className="font-black tracking-wide">AMETISTA</p><p className="mt-1 text-xs opacity-85">Materiais para construir, reformar e cuidar.</p></div>
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600"/><p>Botões, destaques, links e textos da marca usam a cor exata escolhida. Quando o texto fica sobre essa cor, o sistema escolhe preto ou branco para manter a leitura.</p></div>
              </div>
            </div>
          </div>
          <div className="sticky bottom-4 flex justify-end"><button disabled={busy || !isValidHexColor(site.theme_primary)} className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 font-extrabold text-brand-contrast shadow-lg shadow-black/10 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"><Save size={17}/> Salvar tema</button></div>
        </form>}

        {page==='categories' && <>{!editCategory ? <><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black">Categorias do catálogo</h2><p className="mt-1 text-sm text-slate-500">Imagens, descrições e visibilidade das linhas de produtos.</p></div><button onClick={()=>setEditCategory({name:'',slug:'',eyebrow:'',description:'',image_url:'/images/fachada.jpg',icon_name:'package',products:[],productsText:'',position:categories.length+1,is_visible:true})} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-extrabold text-brand-contrast hover:brightness-95"><Plus size={17}/> Nova categoria</button></div><div className="grid gap-4 md:grid-cols-2">{categories.map((cat)=><article key={cat.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex gap-4 p-4"><img src={cat.image_url||'/images/fachada.jpg'} alt="" className="h-24 w-28 rounded-xl bg-slate-100 object-cover"/><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="font-black">{cat.name}</h3><span className={`rounded-md px-2 py-1 text-[10px] font-extrabold ${cat.is_visible?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-500'}`}>{cat.is_visible?'Visível':'Oculta'}</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{cat.description}</p><p className="mt-2 text-xs font-semibold text-slate-400">/{cat.slug}</p></div></div><div className="flex items-center justify-between border-t border-slate-100 px-4 py-3"><button onClick={()=>toggleVisibility('categories',cat)} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand">{cat.is_visible?<EyeOff size={15}/>:<Eye size={15}/>} {cat.is_visible?'Ocultar':'Mostrar'}</button><div className="flex gap-2"><button onClick={()=>setEditCategory({...cat,productsText:(cat.products||[]).join('\n')})} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50"><Pencil size={14}/> Editar</button><button onClick={()=>deleteCategory(cat)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-red-200 hover:text-red-600" title="Excluir"><Trash2 size={14}/></button></div></div></article>)}</div></> : <form onSubmit={saveCategory} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><div className="mb-5 flex items-center justify-between"><div><button type="button" onClick={()=>setEditCategory(null)} className="mb-2 inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-brand"><ArrowLeft size={15}/> Categorias</button><h2 className="text-xl font-black">{editCategory.id?'Editar categoria':'Nova categoria'}</h2></div><button type="button" onClick={()=>setEditCategory(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18}/></button></div><div className="grid gap-4 md:grid-cols-2"><Field label="Nome" value={editCategory.name} onChange={(v)=>setEditCategory({...editCategory,name:v,slug:editCategory.id?editCategory.slug:slugify(v)})}/><Field label="Slug / endereço curto" value={editCategory.slug} onChange={(v)=>setEditCategory({...editCategory,slug:slugify(v)})}/><Field label="Subtítulo curto" value={editCategory.eyebrow} onChange={(v)=>setEditCategory({...editCategory,eyebrow:v})}/><Field label="Ícone (ex.: droplets, lightbulb, hammer, nut, wrench)" value={editCategory.icon_name} onChange={(v)=>setEditCategory({...editCategory,icon_name:v})}/><div className="md:col-span-2"><Field label="Descrição" value={editCategory.description} onChange={(v)=>setEditCategory({...editCategory,description:v})} multiline/></div><div className="md:col-span-2"><ImageField label="Imagem da categoria" value={editCategory.image_url} onChange={(v)=>setEditCategory({...editCategory,image_url:v})}/></div><div className="md:col-span-2"><Field label="Itens exibidos como etiquetas (um por linha)" value={editCategory.productsText ?? (editCategory.products||[]).join('\n')} onChange={(v)=>setEditCategory({...editCategory,productsText:v})} multiline/></div><Field label="Posição na página" value={String(editCategory.position ?? 1)} onChange={(v)=>setEditCategory({...editCategory,position:Number(v)||1})} type="number"/><div className="flex items-end"><Toggle label="Categoria visível" checked={editCategory.is_visible} onChange={(v)=>setEditCategory({...editCategory,is_visible:v})}/></div></div><button disabled={busy} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3.5 font-extrabold text-brand-contrast hover:brightness-95"><Save size={17}/> Salvar categoria</button></form>}</>}

        {page==='products' && <>{!editProduct ? <><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black">Produtos do catálogo</h2><p className="mt-1 text-sm text-slate-500">Cadastre produtos, imagens e preços opcionais, ou apenas linhas de produtos para consulta.</p></div><button onClick={()=>setEditProduct({name:'',slug:'',description:'',category_id:categories[0]?.id || '',image_url:'/images/fachada.jpg',price:'',position:products.length+1,is_visible:true})} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-extrabold text-brand-contrast hover:brightness-95"><Plus size={17}/> Novo produto</button></div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="hidden grid-cols-[minmax(0,1fr)_150px_100px_150px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-400 md:grid"><span>Produto</span><span>Categoria</span><span>Visibilidade</span><span className="text-right">Ações</span></div>{products.map((prod)=><div key={prod.id} className="grid gap-3 border-b border-slate-100 p-4 last:border-0 md:grid-cols-[minmax(0,1fr)_150px_100px_150px] md:items-center md:gap-4 md:px-5"><div className="flex min-w-0 items-center gap-3"><img src={prod.image_url||'/images/fachada.jpg'} alt="" className="h-14 w-16 shrink-0 rounded-lg bg-slate-100 object-cover"/><div className="min-w-0"><p className="truncate text-sm font-extrabold">{prod.name}</p><p className="mt-1 line-clamp-1 text-xs text-slate-500">{prod.description}</p>{prod.price&&<p className="mt-1 text-xs font-bold text-brand">{prod.price}</p>}</div></div><span className="text-xs font-semibold text-slate-500">{prod.category?.name || categories.find((c)=>c.id===prod.category_id)?.name || 'Sem categoria'}</span><span className={`w-fit rounded-md px-2 py-1 text-[10px] font-extrabold ${prod.is_visible?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-500'}`}>{prod.is_visible?'Visível':'Oculto'}</span><div className="flex justify-start gap-2 md:justify-end"><button onClick={()=>toggleVisibility('products',prod)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-brand" title={prod.is_visible?'Ocultar':'Mostrar'}>{prod.is_visible?<EyeOff size={15}/>:<Eye size={15}/>}</button><button onClick={()=>setEditProduct({...prod,category_id:prod.category_id || prod.category?.id || ''})} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:text-brand" title="Editar"><Pencil size={15}/></button><button onClick={()=>deleteProduct(prod)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-red-200 hover:text-red-600" title="Excluir"><Trash2 size={15}/></button></div></div>)}</div></> : <form onSubmit={saveProduct} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><div className="mb-5 flex items-center justify-between"><div><button type="button" onClick={()=>setEditProduct(null)} className="mb-2 inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-brand"><ArrowLeft size={15}/> Produtos</button><h2 className="text-xl font-black">{editProduct.id?'Editar produto':'Novo produto'}</h2></div><button type="button" onClick={()=>setEditProduct(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18}/></button></div><div className="grid gap-4 md:grid-cols-2"><Field label="Nome do produto" value={editProduct.name} onChange={(v)=>setEditProduct({...editProduct,name:v,slug:editProduct.id?editProduct.slug:slugify(v)})}/><Field label="Slug" value={editProduct.slug} onChange={(v)=>setEditProduct({...editProduct,slug:slugify(v)})}/><label className="block text-sm font-bold text-slate-700">Categoria<select value={editProduct.category_id || ''} onChange={(e)=>setEditProduct({...editProduct,category_id:e.target.value || null})} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-brand"><option value="">Sem categoria</option>{categories.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><Field label="Preço (opcional)" value={editProduct.price || ''} onChange={(v)=>setEditProduct({...editProduct,price:v})} placeholder="Ex.: Consulte ou R$ 29,90"/><div className="md:col-span-2"><Field label="Descrição" value={editProduct.description} onChange={(v)=>setEditProduct({...editProduct,description:v})} multiline/></div><div className="md:col-span-2"><ImageField label="Imagem do produto" value={editProduct.image_url} onChange={(v)=>setEditProduct({...editProduct,image_url:v})}/></div><Field label="Posição na listagem" value={String(editProduct.position??1)} onChange={(v)=>setEditProduct({...editProduct,position:Number(v)||1})} type="number"/><div className="flex items-end"><Toggle label="Produto visível" checked={editProduct.is_visible} onChange={(v)=>setEditProduct({...editProduct,is_visible:v})}/></div></div><button disabled={busy} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3.5 font-extrabold text-brand-contrast hover:brightness-95"><Save size={17}/> Salvar produto</button></form>}</>}
      </main></div>
    <div className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white p-1 lg:hidden">{tabs.map(({id,label,icon:Icon})=><button key={id} onClick={()=>setPage(id)} className={`flex min-w-0 flex-col items-center gap-1 rounded-lg px-0.5 py-2 text-[10px] font-bold ${page===id?'text-brand':'text-slate-500'}`}><Icon size={18}/><span className="max-w-full truncate">{label}</span></button>)}</div>
  </div>
}

function ConfigHelp() {
  return <div className="min-h-screen bg-[#f6f5f2] p-4 sm:p-8" style={getThemeCssVariables(DEFAULT_THEME_COLOR)}><div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-9"><a href="/" className="text-sm font-bold text-slate-500 hover:text-brand">← Voltar ao site</a><div className="mt-5 flex items-center gap-3"><img src="/images/logo-ametista.jpg" alt="Ametista" className="h-14 w-14 object-contain"/><div><p className="text-xs font-extrabold uppercase tracking-[.2em] text-brand">Configuração inicial</p><h1 className="text-2xl font-black">Conecte o Supabase</h1></div></div><p className="mt-4 leading-7 text-slate-600">O painel administrativo precisa das variáveis públicas do projeto Supabase. Configure isso localmente e depois cadastre os mesmos valores no Cloudflare Pages.</p><ol className="mt-6 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-700"><li>Copie <code className="rounded bg-slate-100 px-1.5 py-0.5">.env.example</code> para um novo arquivo chamado <code className="rounded bg-slate-100 px-1.5 py-0.5">.env</code>.</li><li>Preencha <code className="rounded bg-slate-100 px-1.5 py-0.5">VITE_SUPABASE_URL</code> e <code className="rounded bg-slate-100 px-1.5 py-0.5">VITE_SUPABASE_ANON_KEY</code> usando as informações do seu projeto Supabase.</li><li>Execute o SQL de <code className="rounded bg-slate-100 px-1.5 py-0.5">supabase/schema.sql</code> no SQL Editor do Supabase.</li><li>Crie o usuário administrador em Authentication → Users e adicione o UID desse usuário à tabela <code className="rounded bg-slate-100 px-1.5 py-0.5">admin_users</code> conforme o README.</li><li>Reinicie <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run dev</code> e abra <code className="rounded bg-slate-100 px-1.5 py-0.5">/admin</code>.</li></ol><div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Segurança:</strong> use somente a chave pública anon/publishable no frontend. Nunca coloque a chave <code>service_role</code> no React, num arquivo <code>VITE_*</code> ou no GitHub. As permissões dos dados ficam protegidas por RLS no SQL.</div><a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 font-extrabold text-white hover:bg-slate-700">Abrir Supabase <ChevronRight size={17}/></a></div></div>
}
