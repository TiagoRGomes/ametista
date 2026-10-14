export const DEFAULT_SITE = {
  id: 1,
  theme_primary: '#f0782c',
  business_name: 'AMETISTA',
  tagline: 'Materiais para construção',
  hero_badge: 'A sua loja de confiança',
  hero_title: 'Tudo para sua obra. Perto de você.',
  hero_description: 'Da hidráulica à elétrica, do cimento ao acabamento: na Ametista você encontra materiais para construir, reformar e cuidar de cada detalhe.',
  logo_url: '/images/logo-ametista.jpg',
  hero_image_url: '/images/fachada.jpg',
  about_title: 'Mais praticidade para construir, reformar e cuidar.',
  about_description: 'A Ametista reúne produtos para diferentes fases da obra, de instalações hidráulicas e elétricas a materiais de construção, acabamento e fixação. Nossa equipe está pronta para ajudar você a encontrar o que precisa.',
  cta_title: 'Fale com a Ametista e peça seu orçamento.',
  cta_description: 'Envie sua lista de materiais pelo WhatsApp e consulte preços e disponibilidade com nossa equipe.',
  phone: '(35) 3464-1120',
  whatsapp_construction: '5535999633377',
  whatsapp_agro: '5535999683336',
  address: 'Avenida Alvarenga Peixoto, 807 - Centro, Inconfidentes - MG, Brasil',
  opening_hours: '',
  show_categories: true,
  show_products: true,
  show_about: true,
  show_cta: true,
  section_order: ['categories', 'products', 'about', 'cta'],
}

export const DEFAULT_CATEGORIES = [
  { id: 'hidraulica', slug: 'hidraulica', name: 'Hidráulica', eyebrow: 'Água e instalação', description: 'Tubos de PVC, conexões, linha de água quente e torneiras.', image_url: '/images/torneiras-metais.jpg', icon_name: 'droplets', products: ['Conexões', 'Tubos de PVC', 'Tubos de água quente', 'Conexões de água quente', 'Torneiras e metais'], position: 1, is_visible: true },
  { id: 'eletrica', slug: 'eletrica', name: 'Materiais elétricos', eyebrow: 'Instalações e iluminação', description: 'Itens para instalações elétricas, reparos e iluminação.', image_url: '/images/iluminacao-eletrica.jpg', icon_name: 'lightbulb', products: ['Materiais elétricos', 'Lâmpadas e iluminação', 'Componentes e acessórios'], position: 2, is_visible: true },
  { id: 'vedacit', slug: 'vedacit', name: 'Vedacit e acabamento', eyebrow: 'Proteção e manutenção', description: 'Linha Vedacit, produtos para vedação, tintas e manutenção.', image_url: '/images/prateleira-vedacit-tintas.jpg', icon_name: 'paint-bucket', products: ['Linha Vedacit', 'Vedação e impermeabilização', 'Tintas e manutenção'], position: 3, is_visible: true },
  { id: 'cimento', slug: 'cimento', name: 'Cimento e cal Itaú', eyebrow: 'Base para sua obra', description: 'Cimento Itaú e Cal Itaú para diferentes etapas da construção.', image_url: '/images/fachada.jpg', icon_name: 'hammer', products: ['Cimento Itaú', 'Cal Itaú', 'Materiais para construção em geral'], position: 4, is_visible: true },
  { id: 'fixacao', slug: 'fixacao', name: 'Parafusos e pregos', eyebrow: 'Fixação e montagem', description: 'Itens de fixação para reparos, montagem e obra.', image_url: '/images/parafusos-pregos.jpg', icon_name: 'nut', products: ['Parafusos', 'Pregos', 'Fixadores e acessórios'], position: 5, is_visible: true },
  { id: 'torneiras', slug: 'torneiras', name: 'Torneiras e metais', eyebrow: 'Detalhes que fazem diferença', description: 'Torneiras e metais para instalações, trocas e reformas.', image_url: '/images/torneiras-metais.jpg', icon_name: 'wrench', products: ['Torneiras', 'Metais para instalação', 'Acessórios hidráulicos'], position: 6, is_visible: true },
]

const product = (id, name, slug, description, categorySlug, image, position) => ({
  id, name, slug, description, category_slug: categorySlug, image_url: image, price: '', position, is_visible: true,
})
export const DEFAULT_PRODUCTS = [
  product('p1', 'Tubos de PVC', 'tubos-de-pvc', 'Tubos para instalações hidráulicas. Consulte os diâmetros disponíveis.', 'hidraulica', '/images/torneiras-metais.jpg', 1),
  product('p2', 'Conexões', 'conexoes', 'Conexões para montagem e manutenção de instalações.', 'hidraulica', '/images/torneiras-metais.jpg', 2),
  product('p3', 'Linha de água quente', 'linha-agua-quente', 'Tubos e conexões indicados para instalações de água quente.', 'hidraulica', '/images/torneiras-metais.jpg', 3),
  product('p4', 'Materiais elétricos', 'materiais-eletricos', 'Produtos para instalações e manutenção elétrica.', 'eletrica', '/images/iluminacao-eletrica.jpg', 4),
  product('p5', 'Linha Vedacit', 'linha-vedacit', 'Produtos Vedacit para vedação e proteção da construção.', 'vedacit', '/images/prateleira-vedacit-tintas.jpg', 5),
  product('p6', 'Cimento Itaú', 'cimento-itau', 'Consulte disponibilidade e valores do cimento Itaú.', 'cimento', '/images/fachada.jpg', 6),
  product('p7', 'Cal Itaú', 'cal-itau', 'Consulte disponibilidade e valores da cal Itaú.', 'cimento', '/images/fachada.jpg', 7),
  product('p8', 'Torneiras', 'torneiras', 'Opções de torneiras e metais para sua instalação.', 'torneiras', '/images/torneiras-metais.jpg', 8),
  product('p9', 'Parafusos e pregos', 'parafusos-e-pregos', 'Itens de fixação para diversas aplicações.', 'fixacao', '/images/parafusos-pregos.jpg', 9),
]
