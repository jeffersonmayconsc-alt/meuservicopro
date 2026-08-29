import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  Filter,
  Image,
  LayoutDashboard,
  LogOut,
  LockKeyhole,
  Mail,
  MessageCircle,
  Monitor,
  Moon,
  Palette,
  Plus,
  Shield,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Sun,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react'
import { supabase } from './lib/supabaseClient'
import { Stat } from './components/Stat'
import { AccountSecurity } from './modules/account/AccountSecurity'
import { ProviderManagementRow } from './modules/admin/ProviderManagementRow'
import { ClientServiceHistory } from './modules/client/ClientServiceHistory'
import { OperationalSummary } from './modules/provider/OperationalSummary'
import { StorePerformance } from './modules/provider/StorePerformance'
import { RepresentativePreview } from './modules/representative/RepresentativePreview'
import './App.css'

const times = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']
const MASTER_ADMIN_EMAIL = 'jeffersonmaycon.sc@gmail.com'

const SETTINGS_COLUMN_MAP = {
  approvalMode: 'approval_mode',
  minLeadHours: 'min_lead_hours',
  maxAdvanceDays: 'max_advance_days',
  returnAlertDays: 'return_alert_days',
  inactiveAlertDays: 'inactive_alert_days',
  cancellationWindowHours: 'cancellation_window_hours',
  defaultSlotInterval: 'default_slot_interval',
  requireConsent: 'require_consent',
  allowClientPrivacyRequest: 'allow_client_privacy_request',
  allowProviderSelfSignup: 'allow_provider_self_signup',
  allowWhatsAppShare: 'allow_whatsapp_share',
  platformFeePercent: 'platform_fee_percent',
  inviteEmailEnabled: 'invite_email_enabled',
  inviteSenderName: 'invite_sender_name',
  inviteSenderEmail: 'invite_sender_email',
  inviteReplyToEmail: 'invite_reply_to_email',
  minPasswordLength: 'min_password_length',
}

const BRAND_COLUMN_MAP = {
  name: 'brand_name',
  accent: 'brand_accent',
  logoUrl: 'brand_logo_url',
  logotypeUrl: 'brand_logotype_url',
  logotypeSize: 'brand_logotype_size',
  support: 'brand_support',
  privacyEmail: 'brand_privacy_email',
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function providerPublicSlug(provider) {
  return `${slugify(provider.name)}-${provider.id.slice(0, 8)}`
}

function mapPlatformSettingsRow(row) {
  return {
    brand: {
      name: row.brand_name,
      accent: row.brand_accent,
      logoUrl: row.brand_logo_url || '',
      logotypeUrl: row.brand_logotype_url || '',
      logotypeSize: Number(row.brand_logotype_size || 64),
      support: row.brand_support,
      privacyEmail: row.brand_privacy_email,
    },
    settings: {
      approvalMode: row.approval_mode,
      minLeadHours: row.min_lead_hours,
      maxAdvanceDays: row.max_advance_days,
      returnAlertDays: row.return_alert_days,
      inactiveAlertDays: row.inactive_alert_days,
      cancellationWindowHours: row.cancellation_window_hours,
      defaultSlotInterval: row.default_slot_interval,
      requireConsent: row.require_consent,
      allowClientPrivacyRequest: row.allow_client_privacy_request,
      allowProviderSelfSignup: row.allow_provider_self_signup,
      allowWhatsAppShare: row.allow_whatsapp_share,
      // numeric colunas voltam como string do supabase-js — cast explícito.
      platformFeePercent: Number(row.platform_fee_percent),
      inviteEmailEnabled: Boolean(row.invite_email_enabled),
      inviteSenderName: row.invite_sender_name || 'Meu Serviço Online',
      inviteSenderEmail: row.invite_sender_email || '',
      inviteReplyToEmail: row.invite_reply_to_email || '',
      minPasswordLength: row.min_password_length || 8,
    },
  }
}

function mapProviderRow(row) {
  return {
    id: row.id,
    name: row.name,
    owner: row.owner,
    category: row.category,
    city: row.city,
    about: row.about || '',
    highlights: row.highlights || [],
    inviteTitle: row.invite_title,
    inviteMessage: row.invite_message,
    firstOffer: row.first_offer,
    logoUrl: row.logo_url,
    theme: row.theme,
    active: row.active,
    approvalStatus: row.approval_status,
    capacity: row.capacity,
    slug: row.slug,
    ownerUserId: row.owner_user_id || null,
    representativeUserId: row.representative_user_id || null,
    showPrices: row.show_prices === undefined ? true : row.show_prices,
  }
}

function mapProviderServiceRow(row) {
  return {
    id: row.id,
    providerId: row.provider_id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    priceMode: row.price_mode,
    duration: row.duration,
    active: row.active,
    position: row.position,
    createdAt: row.created_at,
  }
}

function mapProviderResourceRow(row) {
  return {
    id: row.id,
    providerId: row.provider_id,
    name: row.name,
    bio: row.bio,
    photoUrl: row.photo_url,
    active: row.active,
    position: row.position,
    createdAt: row.created_at,
  }
}

function mapPortfolioPhotoRow(row) {
  return {
    id: row.id,
    providerId: row.provider_id,
    serviceId: row.service_id,
    imageBase64: row.image_base64,
    caption: row.caption,
    position: row.position,
    createdAt: row.created_at,
  }
}
function mapBookingRow(row) {
  return {
    id: row.id,
    providerId: row.provider_id,
    serviceId: row.service_id,
    resourceId: row.resource_id,
    client: row.client,
    contact: row.contact,
    date: row.date,
    time: row.time,
    status: row.status,
    notes: row.notes,
    extraServices: row.extra_services || '',
  }
}

function mapClientRow(row) {
  return {
    id: row.id,
    name: row.name,
    contact: row.contact,
    consent: row.consent,
    createdAt: row.created_at,
  }
}

function mapProviderClientRow(row) {
  return {
    id: row.id,
    providerId: row.provider_id,
    clientId: row.client_id,
    consent: row.consent,
    consentAt: row.consent_at,
    consentText: row.consent_text,
    createdAt: row.created_at,
  }
}

function mapBlockedSlotRow(row) {
  return {
    id: row.id,
    providerId: row.provider_id,
    date: row.date,
    time: row.time,
    reason: row.reason,
    resourceId: row.resource_id,
  }
}

function mapAnnouncementRow(row) {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    active: row.active,
    createdAt: row.created_at,
  }
}

function mapPrivacyRequestRow(row) {
  return {
    id: row.id,
    providerId: row.provider_id,
    contact: row.contact,
    type: row.type,
    status: row.status,
    createdAt: row.created_at,
  }
}

function mapProviderInviteRow(row) {
  return {
    id: row.id,
    token: row.token,
    createdByAdmin: row.created_by_admin,
    invitedEmail: row.invited_email,
    status: row.status,
    expiresAt: row.expires_at,
    usedByProviderId: row.used_by_provider_id,
    usedAt: row.used_at,
    createdAt: row.created_at,
    representativeUserId: row.representative_user_id || null,
    createdByUserId: row.created_by_user_id || null,
  }
}

function mapClientInviteRow(row) {
  return {
    id: row.id,
    token: row.token,
    providerId: row.provider_id,
    createdByProviderId: row.created_by_provider_id,
    invitedContact: row.invited_contact,
    status: row.status,
    expiresAt: row.expires_at,
    usedByClientId: row.used_by_client_id,
    usedAt: row.used_at,
    createdAt: row.created_at,
  }
}

function mapAnalyticsEventRow(row) {
  return {
    id: row.id,
    providerId: row.provider_id,
    serviceId: row.service_id,
    eventType: row.event_type,
    visitorId: row.visitor_id,
    source: row.source,
    createdAt: row.created_at,
  }
}

async function optionalSelect(table) {
  const { data, error } = await supabase.from(table).select('*')
  if (error) {
    console.warn(`Tabela opcional indisponivel: ${table}`, error.message)
    return []
  }
  return data || []
}

// Só o suficiente pra decidir o que renderizar primeiro: marca/config (login
// tem cara própria desde a primeira pintura) e o necessário pra resolvePublicRoute
// decidir se quem chegou é um cliente com link direto de um prestador específico
// (providers/providerServices/clientInvites). O resto da plataforma (bookings,
// clientes, etc. de TODOS os prestadores) não precisa existir ainda pra isso.
async function fetchCriticalData() {
  const [settingsRes, providersRes, providerServicesRes] = await Promise.all([
    supabase.from('platform_settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('providers').select('*'),
    supabase.from('provider_services').select('*'),
  ])

  const failed = [settingsRes, providersRes, providerServicesRes].find((res) => res.error)
  if (failed) throw failed.error

  const { brand, settings } = mapPlatformSettingsRow(settingsRes.data)

  return {
    brand,
    settings,
    providers: providersRes.data.map(mapProviderRow),
    providerServices: providerServicesRes.data.map(mapProviderServiceRow),
    clientInvites: (await optionalSelect('client_invites')).map(mapClientInviteRow),
    providerResources: [],
    portfolioPhotos: [],
    bookings: [],
    clients: [],
    providerClients: [],
    blockedSlots: [],
    privacyRequests: [],
    providerInvites: [],
    analyticsEvents: [],
    announcements: [],
  }
}

// Carregado depois, em segundo plano, sem bloquear a primeira pintura — uma
// falha aqui não derruba o app (fica como aviso no console e os campos
// continuam vazios) porque, a essa altura, quem estava vendo a tela de
// carregamento já está vendo login/agenda de verdade.
async function fetchBackgroundData() {
  const [bookingsRes, clientsRes, providerClientsRes, blockedSlotsRes, privacyRequestsRes] = await Promise.all([
    supabase.from('bookings').select('*'),
    supabase.from('clients').select('*'),
    supabase.from('provider_clients').select('*'),
    supabase.from('blocked_slots').select('*'),
    supabase.from('privacy_requests').select('*'),
  ])

  for (const res of [bookingsRes, clientsRes, providerClientsRes, blockedSlotsRes, privacyRequestsRes]) {
    if (res.error) console.warn('Não foi possível carregar parte dos dados em segundo plano.', res.error.message)
  }

  const [providerResources, providerInvites, analyticsEvents, announcements] = await Promise.all([
    optionalSelect('provider_resources'),
    optionalSelect('provider_invites'),
    optionalSelect('analytics_events'),
    optionalSelect('platform_announcements'),
  ])

  return {
    bookings: bookingsRes.error ? [] : bookingsRes.data.map(mapBookingRow),
    clients: clientsRes.error ? [] : clientsRes.data.map(mapClientRow),
    providerClients: providerClientsRes.error ? [] : providerClientsRes.data.map(mapProviderClientRow),
    blockedSlots: blockedSlotsRes.error ? [] : blockedSlotsRes.data.map(mapBlockedSlotRow),
    privacyRequests: privacyRequestsRes.error ? [] : privacyRequestsRes.data.map(mapPrivacyRequestRow),
    providerResources: providerResources.map(mapProviderResourceRow),
    providerInvites: providerInvites.map(mapProviderInviteRow),
    analyticsEvents: analyticsEvents.map(mapAnalyticsEventRow),
    announcements: announcements.map(mapAnnouncementRow),
  }
}

function getLinkedProviderId() {
  const params = new URLSearchParams(window.location.hash.replace('#', ''))
  return params.get('agendar') || params.get('loja')
}

function getPublicEntryType() {
  const params = new URLSearchParams(window.location.hash.replace('#', ''))
  return params.get('loja') ? 'loja' : 'agendar'
}

function getInviteToken(type) {
  const params = new URLSearchParams(window.location.hash.replace('#', ''))
  return params.get(type)
}

function getSavedClient(providerId) {
  try {
    const raw = localStorage.getItem(`agenda-client-${providerId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveClient(providerId, payload) {
  try {
    localStorage.setItem(`agenda-client-${providerId}`, JSON.stringify(payload))
  } catch {
    // localStorage indisponível (ex.: navegação privada) — segue sem salvar
  }
}

function getVisitorId() {
  const storageKey = 'agenda-analytics-visitor'
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) return saved
    const visitorId = crypto.randomUUID()
    localStorage.setItem(storageKey, visitorId)
    return visitorId
  } catch {
    return crypto.randomUUID()
  }
}

function getTrafficSource() {
  const source = new URLSearchParams(window.location.search).get('utm_source')
  if (source) return source.slice(0, 80)
  try {
    return document.referrer ? new URL(document.referrer).hostname : 'direto'
  } catch {
    return 'direto'
  }
}

function clearSavedClient(providerId) {
  try {
    localStorage.removeItem(`agenda-client-${providerId}`)
  } catch {
    // localStorage indisponível — nada a limpar
  }
}

function preferredServiceId(currentData, providerId, saved) {
  const activeServices = currentData.providerServices.filter((service) => service.providerId === providerId && service.active)
  const savedService = saved?.lastServiceId && activeServices.find((service) => service.id === saved.lastServiceId)
  return savedService?.id || activeServices[0]?.id || ''
}

function hasExistingConsent(currentData, providerId, contact) {
  const normalizedContact = (contact || '').trim().toLowerCase()
  if (!providerId || !normalizedContact) return false
  const matchedClient = currentData.clients.find((client) => client.contact.toLowerCase() === normalizedContact)
  if (!matchedClient) return false
  return currentData.providerClients.some((link) => link.providerId === providerId && link.clientId === matchedClient.id && link.consent)
}

function tokenValue() {
  return crypto.randomUUID().replaceAll('-', '')
}

function currency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(`${date}T00:00:00`),
  )
}

function daysSince(date) {
  if (!date) return null
  const today = new Date()
  const reference = new Date(`${date}T00:00:00`)
  return Math.max(0, Math.floor((today - reference) / 86400000))
}

function formatServicePrice(service, showPrices = true) {
  if (!service) return ''
  if (!showPrices || service.priceMode === 'sob_consulta') return 'Sob consulta'
  if (service.priceMode === 'a_partir_de') return 'A partir de ' + currency(service.price)
  return currency(service.price)
}

function formatServiceDuration(service) {
  return service?.duration ? service.duration + ' min' : 'Duração variável'
}

function deviceName(userAgent = '') {
  const browser = userAgent.includes('Edg/') ? 'Microsoft Edge' : userAgent.includes('Firefox/') ? 'Firefox' : userAgent.includes('Chrome/') ? 'Google Chrome' : userAgent.includes('Safari/') ? 'Safari' : 'Navegador'
  const system = userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Android') ? 'Android' : userAgent.includes('iPhone') || userAgent.includes('iPad') ? 'iOS' : userAgent.includes('Mac OS') ? 'macOS' : userAgent.includes('Linux') ? 'Linux' : 'Dispositivo desconhecido'
  return `${browser} em ${system}`
}

function formatDateTime(value) {
  return value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Data indisponível'
}

function serviceWithProvider(service, providers) {
  const provider = providers.find((item) => item.id === service.providerId)
  return provider ? { ...service, provider } : null
}

function App() {
  const [appearance, setAppearance] = useState(() => localStorage.getItem('agenda-appearance') || 'system')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginForm, setLoginForm] = useState({ email: MASTER_ADMIN_EMAIL, password: '' })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [session, setSession] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [accountSessions, setAccountSessions] = useState([])
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountNotice, setAccountNotice] = useState({ type: '', text: '' })
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const [forcedPasswordChange, setForcedPasswordChange] = useState(false)
  const [passwordProvisionNotice, setPasswordProvisionNotice] = useState(null)
  const [provisioningTarget, setProvisioningTarget] = useState('')
  const [representativeSecurity, setRepresentativeSecurity] = useState({})
  const trackedAnalytics = useRef(new Set())
  const [publicProviderId, setPublicProviderId] = useState(null)
  const [publicEntryType, setPublicEntryType] = useState('agendar')
  const [view, setView] = useState('cliente')
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [query, setQuery] = useState('')
  const [providerTab, setProviderTab] = useState('agenda')
  const [analyticsDays, setAnalyticsDays] = useState(30)
  const [providerProfileTab, setProviderProfileTab] = useState('identidade')
  const [expandedNavGroup, setExpandedNavGroup] = useState('admin')
  const [adminTab, setAdminTab] = useState('visao-geral')
  const [agendaFilter, setAgendaFilter] = useState('todos')
  const [agendaDate, setAgendaDate] = useState(new Date().toISOString().slice(0, 10))
  const [clientFilter, setClientFilter] = useState('todos')
  const [clientSearch, setClientSearch] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [privacyContact, setPrivacyContact] = useState('')
  const [privacyMessage, setPrivacyMessage] = useState('')
  const [blockForm, setBlockForm] = useState({ time: '11:00', reason: '' })
  const [agendaResource, setAgendaResource] = useState('todos')
  const [inviteDrafts, setInviteDrafts] = useState({})
  const [loadedPortfolioProviders, setLoadedPortfolioProviders] = useState({})
  const [savedNotice, setSavedNotice] = useState('')
  const [bookingForm, setBookingForm] = useState({
    serviceId: '',
    resourceId: '',
    cartServiceIds: [],
    client: '',
    contact: '',
    date: new Date().toISOString().slice(0, 10),
    time: '09:00',
    notes: '',
    consent: false,
  })
  const [providerForm, setProviderForm] = useState({
    name: '',
    owner: '',
    category: '',
    city: '',
    service: '',
    duration: 50,
    price: 100,
    capacity: 6,
  })
  const [providerInviteForm, setProviderInviteForm] = useState({ email: '' })
  const [providerInviteNotice, setProviderInviteNotice] = useState('')
  const [clientInviteForm, setClientInviteForm] = useState({ contact: '' })
  const [clientInviteNotice, setClientInviteNotice] = useState('')
  const [representatives, setRepresentatives] = useState([])
  const [representativeInvites, setRepresentativeInvites] = useState([])
  const [representativeEmail, setRepresentativeEmail] = useState('')
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '' })
  const [configSubTab, setConfigSubTab] = useState('marca')
  const [representativeNotice, setRepresentativeNotice] = useState('')
  const [representativeDeliveryNotice, setRepresentativeDeliveryNotice] = useState('')
  const [representativeInviteLink, setRepresentativeInviteLink] = useState('')
  const [inviteEmailConnection, setInviteEmailConnection] = useState({ checked: false, configured: false })
  const [representativePreviewId, setRepresentativePreviewId] = useState('')
  const [representativeTab, setRepresentativeTab] = useState('visao-geral')
  const [providerInviteToken, setProviderInviteToken] = useState(null)
  const [clientInviteToken, setClientInviteToken] = useState(null)

  const resolveAuthenticatedRole = async (user) => {
    const { data: platformRole } = await supabase.rpc('get_my_platform_role')
    if (platformRole === 'admin') return { role: 'admin', isMasterAdmin: true, isRepresentative: false }
    if (platformRole === 'representante') return { role: 'admin', isMasterAdmin: false, isRepresentative: true }

    const representativeToken = getInviteToken('representante')
    if (representativeToken) {
      const { error } = await supabase.rpc('accept_representative_invite', { invite_token: representativeToken })
      if (error) throw new Error(error.message)
      return { role: 'admin', isMasterAdmin: false, isRepresentative: true }
    }

    const email = user.email?.toLowerCase() || ''
    return { role: email.startsWith('cliente@') ? 'cliente' : 'prestador', isMasterAdmin: false, isRepresentative: false }
  }

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyAppearance = () => {
      const resolved = appearance === 'system' ? (media.matches ? 'dark' : 'light') : appearance
      document.documentElement.dataset.theme = resolved
      document.documentElement.style.colorScheme = resolved
    }

    localStorage.setItem('agenda-appearance', appearance)
    applyAppearance()
    media.addEventListener('change', applyAppearance)
    return () => media.removeEventListener('change', applyAppearance)
  }, [appearance])

  useEffect(() => {
    const link = document.querySelector('link[rel="icon"]')
    if (!link) return
    if (data?.brand?.logoUrl) {
      link.href = data.brand.logoUrl
      link.type = data.brand.logoUrl.match(/^data:([^;]+)/)?.[1] || 'image/png'
    } else {
      link.href = '/favicon.svg'
      link.type = 'image/svg+xml'
    }
  }, [data?.brand?.logoUrl])

  useEffect(() => {
    if (!data || getInviteToken('prestador') || getInviteToken('cliente') || getLinkedProviderId()) return undefined

    let active = true
    supabase.auth.getSession().then(async ({ data: authData }) => {
      if (!active || !authData.session?.user) return
      const user = authData.session.user
      const email = user.email?.toLowerCase() || ''
      const access = await resolveAuthenticatedRole(user)
      const role = access.role
      const providerId = role === 'prestador' ? data.providers[0]?.id : undefined
      setAuthUser(user)
      setSession({ role, providerId, email, isMasterAdmin: access.isMasterAdmin, isRepresentative: access.isRepresentative })
      setSelectedProvider(providerId || data.providers[0]?.id || null)
      if (user.user_metadata?.must_change_password) {
        setForcedPasswordChange(true)
        setView('conta')
      } else {
        setView(access.isRepresentative ? 'representante' : role === 'admin' ? 'admin' : role)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, authSession) => {
      if (!active) return
      setAuthUser(authSession?.user || null)
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
        setView('conta')
      }
      if (event === 'SIGNED_IN' && authSession?.user?.user_metadata?.must_change_password) {
        setForcedPasswordChange(true)
        setView('conta')
      }
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [data])

  useEffect(() => {
    if (!session?.isMasterAdmin) return
    Promise.all([
      supabase.from('platform_representatives').select('*').order('created_at', { ascending: false }),
      supabase.from('representative_invites').select('*').order('created_at', { ascending: false }),
    ]).then(([representativesResult, invitesResult]) => {
      setRepresentatives(representativesResult.data || [])
      setRepresentativeInvites(invitesResult.data || [])
    })
  }, [session?.isMasterAdmin])

  useEffect(() => {
    if (!session?.isMasterAdmin || representatives.length === 0) {
      setRepresentativeSecurity({})
      return
    }
    supabase
      .rpc('get_account_security_status', { target_user_ids: representatives.map((item) => item.user_id) })
      .then(({ data: rows }) => {
        const map = {}
        for (const row of rows || []) {
          map[row.user_id] = {
            emailConfirmed: row.email_confirmed,
            mustChangePassword: row.must_change_password,
            lastSignInAt: row.last_sign_in_at,
          }
        }
        setRepresentativeSecurity(map)
      })
  }, [session?.isMasterAdmin, representatives])

  const appearanceControl = (
    <div className="appearanceControl" role="group" aria-label="Aparência">
      <button type="button" className={appearance === 'light' ? 'active' : ''} onClick={() => setAppearance('light')} title="Tema claro" aria-label="Usar tema claro"><Sun size={17} /></button>
      <button type="button" className={appearance === 'system' ? 'active' : ''} onClick={() => setAppearance('system')} title="Usar tema do sistema" aria-label="Usar tema do sistema"><Monitor size={17} /></button>
      <button type="button" className={appearance === 'dark' ? 'active' : ''} onClick={() => setAppearance('dark')} title="Tema escuro" aria-label="Usar tema escuro"><Moon size={17} /></button>
    </div>
  )

  const updateData = (producer) => {
    setData((current) => producer(current))
  }

  const trackAnalyticsEvent = useCallback(async (eventType, targetService, allowRepeat = false) => {
    if (!targetService?.providerId) return
    const visitorId = getVisitorId()
    const trackingKey = `${eventType}:${targetService.id}:${visitorId}`
    if (!allowRepeat && trackedAnalytics.current.has(trackingKey)) return
    trackedAnalytics.current.add(trackingKey)

    const event = {
      id: crypto.randomUUID(),
      providerId: targetService.providerId,
      serviceId: targetService.id,
      eventType,
      visitorId,
      source: getTrafficSource(),
      createdAt: new Date().toISOString(),
    }

    setData((current) => current ? { ...current, analyticsEvents: [...(current.analyticsEvents || []), event] } : current)
    const { error } = await supabase.from('analytics_events').insert({
      id: event.id,
      provider_id: event.providerId,
      service_id: event.serviceId,
      event_type: event.eventType,
      visitor_id: event.visitorId,
      source: event.source,
      created_at: event.createdAt,
    })
    if (error) console.warn('Não foi possível registrar o evento de desempenho.', error.message)
  }, [])

  const resolvePublicRoute = (currentData) => {
    const providerToken = getInviteToken('prestador')
    if (providerToken) {
      setProviderInviteToken(providerToken)
      setClientInviteToken(null)
      setPublicProviderId(null)
      setSession(null)
      return false
    }

    const clientToken = getInviteToken('cliente')
    const clientInvite = currentData.clientInvites.find((invite) => invite.token === clientToken && invite.status === 'ativo')
    if (clientInvite) {
      const invitedProvider = currentData.providers.find((item) => item.id === clientInvite.providerId && item.active)
      if (invitedProvider) {
        setClientInviteToken(clientToken)
        setPublicProviderId(invitedProvider.id)
        setPublicEntryType('agendar')
        setSelectedProvider(invitedProvider.id)
        setSession({ role: 'cliente', providerId: invitedProvider.id, clientInviteToken: clientToken })
        setView('cliente')
        const savedInvitedClient = getSavedClient(invitedProvider.id)
        setBookingForm((current) => ({
          ...current,
          client: savedInvitedClient?.name || current.client,
          contact: savedInvitedClient?.contact || current.contact,
          consent: current.consent || hasExistingConsent(currentData, invitedProvider.id, savedInvitedClient?.contact),
          serviceId: preferredServiceId(currentData, invitedProvider.id, savedInvitedClient),
        }))
        return true
      }
    }

    const providerKey = getLinkedProviderId()
    const entryType = getPublicEntryType()
    const linkedProvider = currentData.providers.find(
      (item) => (item.id === providerKey || item.slug === providerKey) && item.active,
    )

    if (!linkedProvider) return false

    setPublicProviderId(linkedProvider.id)
    setPublicEntryType(entryType)
    setSelectedProvider(linkedProvider.id)
    setSession({ role: 'cliente', providerId: linkedProvider.id })
    setView('cliente')
    const savedLinkedClient = getSavedClient(linkedProvider.id)
    setBookingForm((current) => ({
      ...current,
      client: savedLinkedClient?.name || current.client,
      contact: savedLinkedClient?.contact || current.contact,
      consent: current.consent || hasExistingConsent(currentData, linkedProvider.id, savedLinkedClient?.contact),
      serviceId: preferredServiceId(currentData, linkedProvider.id, savedLinkedClient),
    }))
    return true
  }

  useEffect(() => {
    let cancelled = false

    fetchCriticalData()
      .then((initial) => {
        if (cancelled) return
        setData(initial)
        const hasLinkedProvider = resolvePublicRoute(initial)
        if (!hasLinkedProvider) {
          const fallbackProvider = initial.providers[0]
          setSelectedProvider(fallbackProvider?.id || null)
          setBookingForm((current) => ({
            ...current,
            serviceId: fallbackProvider
              ? initial.providerServices.find((service) => service.providerId === fallbackProvider.id && service.active)?.id || ''
              : '',
          }))
        }
        setLoading(false)

        fetchBackgroundData()
          .then((extra) => {
            if (cancelled) return
            setData((current) => ({ ...current, ...extra }))
          })
          .catch((error) => {
            console.warn('Falha ao carregar dados complementares em segundo plano.', error)
          })
      })
      .catch((error) => {
        if (cancelled) return
        setLoadError(error)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!data || !publicProviderId || !bookingForm.contact || bookingForm.consent) return
    if (hasExistingConsent(data, publicProviderId, bookingForm.contact)) {
      setBookingForm((current) => (current.consent ? current : { ...current, consent: true }))
    }
  }, [data?.clients, data?.providerClients, publicProviderId, bookingForm.contact, bookingForm.consent])

  useEffect(() => {
    if (!data) return
    const handlePublicRoute = () => resolvePublicRoute(data)
    window.addEventListener('hashchange', handlePublicRoute)
    return () => window.removeEventListener('hashchange', handlePublicRoute)
  }, [data])

  useEffect(() => {
    if (view !== 'conta' || !authUser) return
    let active = true
    supabase.rpc('list_my_auth_sessions').then(({ data: sessions, error }) => {
      if (!active) return
      setAccountLoading(false)
      if (error) {
        setAccountNotice({ type: 'error', text: 'Não foi possível consultar os dispositivos conectados.' })
        return
      }
      setAccountSessions(sessions || [])
    })
    return () => { active = false }
  }, [view, authUser])

  useEffect(() => {
    const providerId = publicProviderId || (providerTab === 'servicos' ? selectedProvider : null)
    if (!data || !providerId || loadedPortfolioProviders[providerId]) return

    let cancelled = false
    supabase
      .from('portfolio_photos')
      .select('*')
      .eq('provider_id', providerId)
      .then(({ data: rows, error }) => {
        if (cancelled) return
        if (error) {
          alert('Nao foi possivel carregar o portfolio desse prestador.')
          return
        }
        updateData((current) => ({
          ...current,
          portfolioPhotos: [
            ...current.portfolioPhotos.filter((photo) => photo.providerId !== providerId),
            ...(rows || []).map(mapPortfolioPhotoRow),
          ],
        }))
        setLoadedPortfolioProviders((current) => ({ ...current, [providerId]: true }))
      })

    return () => {
      cancelled = true
    }
  }, [data, publicProviderId, providerTab, selectedProvider, loadedPortfolioProviders])


  const activeProviders = data ? data.providers.filter((provider) => provider.active && provider.approvalStatus === 'aprovado') : []
  const storeEntry = publicEntryType === 'loja' && Boolean(publicProviderId)
  const publicServices = data
    ? data.providerServices
        .filter((service) => service.active)
        .map((service) => serviceWithProvider(service, activeProviders))
        .filter(Boolean)
        .filter((service) => !publicProviderId || service.providerId === publicProviderId)
        .sort((first, second) => first.position - second.position || first.name.localeCompare(second.name))
    : []
  const filteredServices = publicServices.filter((service) =>
    `${service.name} ${service.description} ${service.provider.name} ${service.provider.category} ${service.provider.city}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  )
  const bookingService = publicServices.find((item) => item.id === bookingForm.serviceId) || publicServices[0]
  const publicResources = data && bookingService
    ? data.providerResources
        .filter((resource) => resource.providerId === bookingService.providerId && resource.active)
        .sort((first, second) => first.position - second.position || first.name.localeCompare(second.name))
    : []
  const cartServices = publicServices.filter((item) => bookingForm.cartServiceIds.includes(item.id) && item.id !== bookingService?.id)
  const trackedServiceId = bookingService?.id
  const trackedProviderId = bookingService?.providerId
  const activeSessionRole = session?.role

  useEffect(() => {
    if (!activeSessionRole || view !== 'cliente' || activeSessionRole === 'admin' || publicEntryType !== 'agendar' || !trackedServiceId || !trackedProviderId) return
    trackAnalyticsEvent('visualizou_servico', { id: trackedServiceId, providerId: trackedProviderId })
  }, [view, activeSessionRole, publicEntryType, trackedServiceId, trackedProviderId, trackAnalyticsEvent])

  const provider = data ? data.providers.find((item) => item.id === selectedProvider) || data.providers[0] : null
  const providerServices = data && provider
    ? data.providerServices
        .filter((service) => service.providerId === provider.id)
        .sort((first, second) => first.position - second.position || first.name.localeCompare(second.name))
    : []
  const providerResources = data && provider
    ? data.providerResources
        .filter((resource) => resource.providerId === provider.id)
        .sort((first, second) => first.position - second.position || first.name.localeCompare(second.name))
    : []
  const providerPhotos = data && provider
    ? data.portfolioPhotos
        .filter((photo) => photo.providerId === provider.id)
        .sort((first, second) => first.position - second.position || first.caption.localeCompare(second.caption))
    : []
  const publicPhotos = data && publicProviderId
    ? data.portfolioPhotos
        .filter((photo) => photo.providerId === publicProviderId)
        .sort((first, second) => first.position - second.position || first.caption.localeCompare(second.caption))
    : []
  const publicGeneralPhotos = publicPhotos.filter((photo) => !photo.serviceId)
  const inviteDraft = (provider && inviteDrafts[provider.id]) || provider
  const hasUnsavedChanges = Boolean(provider && inviteDrafts[provider.id])
  const bookingServiceName = (booking) =>
    data?.providerServices.find((service) => service.id === booking.serviceId)?.name || 'Servico nao especificado'
  const providerBookings = data
    ? data.bookings
        .filter((booking) => booking.providerId === provider?.id)
        .sort((first, second) => `${first.date} ${first.time}`.localeCompare(`${second.date} ${second.time}`))
    : []
  const providerBlockedSlots = data ? data.blockedSlots.filter((slot) => slot.providerId === provider?.id) : []
  const agendaDayBookings = providerBookings
    .filter((booking) => booking.date === agendaDate)
    .filter((booking) => agendaResource === 'todos' || booking.resourceId === agendaResource)
  const agendaDayBlocks = providerBlockedSlots
    .filter((slot) => slot.date === agendaDate)
    .filter((slot) => agendaResource === 'todos' || slot.resourceId === agendaResource)
  const providerClientLinks = data ? data.providerClients.filter((link) => link.providerId === provider?.id) : []
  const providerClients = providerClientLinks
    .map((link) => {
      const client = data.clients.find((item) => item.id === link.clientId)
      return client ? { ...client, link } : null
    })
    .filter(Boolean)
  const managedClients = providerClients.map((client) => {
    const visits = providerBookings
      .filter(
        (booking) =>
          booking.contact.toLowerCase() === client.contact.toLowerCase() &&
          ['confirmado', 'concluido'].includes(booking.status),
      )
      .sort((first, second) => `${second.date} ${second.time}`.localeCompare(`${first.date} ${first.time}`))
    const lastVisit = visits[0]
    const inactiveDays = daysSince(lastVisit?.date)
    const relationshipStatus =
      inactiveDays === null
        ? 'Sem atendimento'
        : inactiveDays > data.settings.inactiveAlertDays
          ? 'Sem retorno'
          : inactiveDays > data.settings.returnAlertDays
            ? 'Atenção'
            : 'Ativo'

    return {
      ...client,
      visits: visits.length,
      lastVisit,
      inactiveDays,
      relationshipStatus,
    }
  })
  const clientsWithoutReturn = managedClients.filter((client) => client.relationshipStatus === 'Sem retorno').length
  const filteredProviderBookings = agendaDayBookings.filter((booking) => agendaFilter === 'todos' || booking.status === agendaFilter)
  const filteredManagedClients = managedClients.filter((client) => {
    const matchesStatus = clientFilter === 'todos' || client.relationshipStatus === clientFilter
    const matchesSearch = `${client.name} ${client.contact}`.toLowerCase().includes(clientSearch.toLowerCase())
    return matchesStatus && matchesSearch
  })
  const today = new Date().toISOString().slice(0, 10)
  const maxBookingDateBase = new Date(`${today}T00:00:00`)
  maxBookingDateBase.setDate(maxBookingDateBase.getDate() + (data?.settings.maxAdvanceDays || 0))
  const maxBookingDate = maxBookingDateBase.toISOString().slice(0, 10)
  const todayBookings = providerBookings.filter((booking) => booking.date === today && booking.status !== 'cancelado').length
  const pendingBookings = providerBookings.filter((booking) => booking.status === 'pendente').length
  const completedBookings = providerBookings.filter((booking) => booking.status === 'concluido').length
  const revenueBookings = providerBookings.filter((booking) => booking.status !== 'cancelado')
  const providerRevenue = revenueBookings.reduce((total, booking) => {
    const bookedService = data.providerServices.find((service) => service.id === booking.serviceId)
    return bookedService && bookedService.priceMode !== 'sob_consulta' ? total + bookedService.price : total
  }, 0)
  const providerConsultationBookings = revenueBookings.filter((booking) => {
    const bookedService = data.providerServices.find((service) => service.id === booking.serviceId)
    return bookedService?.priceMode === 'sob_consulta'
  }).length
  const knownClientContacts = new Set(
    [authUser?.email, bookingForm.contact, ...activeProviders.map((item) => getSavedClient(item.id)?.contact)]
      .filter(Boolean)
      .map((contact) => contact.trim().toLowerCase()),
  )
  const clientServiceHistory = data
    ? data.bookings
        .filter((booking) => knownClientContacts.has(booking.contact.trim().toLowerCase()))
        .sort((first, second) => `${second.date} ${second.time}`.localeCompare(`${first.date} ${first.time}`))
        .reduce((history, booking) => {
          if (history.some((entry) => entry.provider.id === booking.providerId)) return history
          const historyProvider = data.providers.find((item) => item.id === booking.providerId)
          const historyService = data.providerServices.find((item) => item.id === booking.serviceId)
          return historyProvider && historyService
            ? [...history, { booking, provider: historyProvider, service: historyService }]
            : history
        }, [])
    : []

  const rebookService = (entry) => {
    setBookingForm((current) => ({ ...current, serviceId: entry.service.id, date: today, time: '09:00', notes: '' }))
    setPublicProviderId(entry.provider.id)
    setPublicEntryType('agendar')
    setSuccessMessage('')
    window.history.replaceState(null, '', `#agendar=${entry.provider.slug || entry.provider.id}`)
    trackAnalyticsEvent('iniciou_agendamento', entry.service)
    window.setTimeout(() => document.querySelector('[data-booking-form]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }
  const analyticsCutoff = new Date()
  analyticsCutoff.setDate(analyticsCutoff.getDate() - analyticsDays)
  const providerAnalytics = (data?.analyticsEvents || []).filter(
    (event) => event.providerId === provider?.id && new Date(event.createdAt) >= analyticsCutoff,
  )
  const serviceViews = providerAnalytics.filter((event) => event.eventType === 'visualizou_servico').length
  const bookingStarts = providerAnalytics.filter((event) => event.eventType === 'iniciou_agendamento').length
  const generatedBookings = providerAnalytics.filter((event) => event.eventType === 'agendamento_concluido').length
  const uniqueVisitors = new Set(providerAnalytics.map((event) => event.visitorId)).size
  const funnelConversion = serviceViews ? Math.min(100, (generatedBookings / serviceViews) * 100) : 0
  const startConversion = bookingStarts ? Math.min(100, (generatedBookings / bookingStarts) * 100) : 0
  const providerServiceAnalytics = providerServices
    .map((service) => {
      const events = providerAnalytics.filter((event) => event.serviceId === service.id)
      const views = events.filter((event) => event.eventType === 'visualizou_servico').length
      const starts = events.filter((event) => event.eventType === 'iniciou_agendamento').length
      const bookings = events.filter((event) => event.eventType === 'agendamento_concluido').length
      return { ...service, views, starts, bookings, conversion: views ? Math.min(100, (bookings / views) * 100) : 0 }
    })
    .sort((first, second) => second.views - first.views)
  const requiresResourceChoice = publicResources.length > 0
  const availableTimes = data
    ? times.map((time) => {
        const selectedBookingService = data.providerServices.find((service) => service.id === bookingForm.serviceId)
        const eligibleProviders = selectedBookingService
          ? activeProviders.filter((item) => item.id === selectedBookingService.providerId)
          : []
        if (requiresResourceChoice && !bookingForm.resourceId) {
          return { time, available: false }
        }
        const hasProviderAvailable = eligibleProviders.some(
          (item) =>
            !data.blockedSlots.some(
              (slot) =>
                slot.providerId === item.id &&
                slot.date === bookingForm.date &&
                slot.time === time &&
                (!requiresResourceChoice || slot.resourceId === bookingForm.resourceId),
            ) &&
            !data.bookings.some(
              (booking) =>
                booking.providerId === item.id &&
                booking.date === bookingForm.date &&
                booking.time === time &&
                booking.status !== 'cancelado' &&
                (!requiresResourceChoice || booking.resourceId === bookingForm.resourceId),
            ),
        )

        return { time, available: hasProviderAvailable }
      })
    : times.map((time) => ({ time, available: false }))
  const agendaSlots = times.map((time) => {
    const booking = agendaDayBookings.find((item) => item.time === time && item.status !== 'cancelado')
    const block = agendaDayBlocks.find((item) => item.time === time)
    return {
      time,
      booking,
      block,
      status: block ? 'bloqueado' : booking ? booking.status : 'livre',
    }
  })
  const occupiedSlots = agendaSlots.filter((slot) => slot.booking || slot.block).length
  const occupancyRate = Math.round((occupiedSlots / times.length) * 100)

  const uniqueClients = data ? data.clients.length : 0
  const revenue = data
    ? data.bookings.reduce((total, booking) => {
        const bookedService = data.providerServices.find((item) => item.id === booking.serviceId)
        return booking.status !== 'cancelado' && bookedService?.priceMode !== 'sob_consulta' ? total + (bookedService?.price || 0) : total
      }, 0)
    : 0
  const stats = {
    providers: data ? data.providers.length : 0,
    activeProviders: activeProviders.length,
    bookings: data ? data.bookings.length : 0,
    clients: uniqueClients,
    revenue,
  }
  const representativePreviewProviders = data
    ? data.providers.filter((item) => item.representativeUserId === (session?.isRepresentative ? authUser?.id : representativePreviewId))
    : []
  const representativePreviewInvites = data
    ? data.providerInvites.filter((item) => item.representativeUserId === (session?.isRepresentative ? authUser?.id : representativePreviewId))
    : []
  const openPrivacyRequests = data ? data.privacyRequests.filter((request) => request.status === 'aberta').length : 0

  const updateSetting = async (field, value) => {
    updateData((current) => ({
      ...current,
      settings: { ...current.settings, [field]: value },
    }))
    const { error } = await supabase
      .from('platform_settings')
      .update({ [SETTINGS_COLUMN_MAP[field]]: value })
      .eq('id', 1)
    if (error) alert('Não foi possível salvar esse parâmetro no banco de dados. Tente novamente.')
  }

  const toggleCartService = (serviceId) => {
    setBookingForm((current) => ({
      ...current,
      cartServiceIds: current.cartServiceIds.includes(serviceId)
        ? current.cartServiceIds.filter((id) => id !== serviceId)
        : [...current.cartServiceIds, serviceId],
    }))
  }

  const createBooking = async (event) => {
    event.preventDefault()
    const selectedBookingService = data.providerServices.find((service) => service.id === bookingForm.serviceId)
    const extraServicesText = data.providerServices
      .filter((service) => bookingForm.cartServiceIds.includes(service.id) && service.id !== selectedBookingService?.id)
      .map((service) => service.name)
      .join(', ')
    const eligibleProviders = selectedBookingService
      ? activeProviders.filter((item) => item.id === selectedBookingService.providerId)
      : []
    const providerRequiresResource = selectedBookingService
      ? data.providerResources.some((resource) => resource.providerId === selectedBookingService.providerId && resource.active)
      : false

    if (providerRequiresResource && !bookingForm.resourceId) {
      alert('Escolha com quem você quer agendar antes de confirmar.')
      return
    }

    const availableProvider = eligibleProviders.find(
      (item) =>
        !data.blockedSlots.some(
          (slot) =>
            slot.providerId === item.id &&
            slot.date === bookingForm.date &&
            slot.time === bookingForm.time &&
            (!providerRequiresResource || slot.resourceId === bookingForm.resourceId),
        ) &&
        !data.bookings.some((booking) =>
          booking.providerId === item.id &&
        booking.date === bookingForm.date &&
        booking.time === bookingForm.time &&
        booking.status !== 'cancelado' &&
        (!providerRequiresResource || booking.resourceId === bookingForm.resourceId),
        ),
    )

    if (!availableProvider) {
      alert('Esse horário já foi ocupado para esse serviço. Escolha outro horário.')
      return
    }

    const existingClient = data.clients.find(
      (client) => client.contact.toLowerCase() === bookingForm.contact.toLowerCase(),
    )
    const clientId = existingClient?.id || crypto.randomUUID()
    const hasProviderLink = data.providerClients.some(
      (link) => link.providerId === availableProvider.id && link.clientId === clientId,
    )
    const consentText = 'Autorizo o uso do meu nome e contato para gerenciar este atendimento, retornos e comunicações com este prestador.'
    const bookingId = crypto.randomUUID()
    const providerClientId = crypto.randomUUID()
    const nowIso = new Date().toISOString()

    updateData((current) => ({
      ...current,
      clients: existingClient
        ? current.clients.map((client) =>
            client.id === clientId
              ? { ...client, name: bookingForm.client, consent: bookingForm.consent }
              : client,
          )
        : [
            ...current.clients,
            {
              id: clientId,
              name: bookingForm.client,
              contact: bookingForm.contact,
              consent: bookingForm.consent,
              createdAt: nowIso,
            },
          ],
      providerClients: hasProviderLink
        ? current.providerClients.map((link) =>
            link.providerId === availableProvider.id && link.clientId === clientId
              ? {
                  ...link,
                  consent: bookingForm.consent,
                  consentAt: nowIso,
                  consentText,
                }
              : link,
          )
        : [
            ...current.providerClients,
            {
              id: providerClientId,
              providerId: availableProvider.id,
              clientId,
              consent: bookingForm.consent,
              consentAt: nowIso,
              consentText,
              createdAt: nowIso,
            },
          ],
      bookings: [
        ...current.bookings,
        {
          id: bookingId,
          client: bookingForm.client,
          contact: bookingForm.contact,
          date: bookingForm.date,
          time: bookingForm.time,
          notes: bookingForm.notes,
          serviceId: selectedBookingService.id,
          resourceId: bookingForm.resourceId || null,
          extraServices: extraServicesText,
          providerId: availableProvider.id,
          status: 'pendente',
        },
      ],
    }))

    saveClient(availableProvider.id, {
      name: bookingForm.client,
      contact: bookingForm.contact,
      lastServiceId: selectedBookingService.id,
    })

    setBookingForm({ ...bookingForm, client: '', contact: '', notes: '', consent: false, cartServiceIds: [] })
    setSuccessMessage('Agendamento solicitado. O prestador recebeu sua solicitação.')
    setSelectedProvider(availableProvider.id)

    try {
      if (existingClient) {
        const { error } = await supabase
          .from('clients')
          .update({ name: bookingForm.client, consent: bookingForm.consent })
          .eq('id', clientId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('clients').insert({
          id: clientId,
          name: bookingForm.client,
          contact: bookingForm.contact,
          consent: bookingForm.consent,
          created_at: nowIso,
        })
        if (error) throw error
      }

      if (hasProviderLink) {
        const { error } = await supabase
          .from('provider_clients')
          .update({ consent: bookingForm.consent, consent_at: nowIso, consent_text: consentText })
          .eq('provider_id', availableProvider.id)
          .eq('client_id', clientId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('provider_clients').insert({
          id: providerClientId,
          provider_id: availableProvider.id,
          client_id: clientId,
          consent: bookingForm.consent,
          consent_at: nowIso,
          consent_text: consentText,
          created_at: nowIso,
        })
        if (error) throw error
      }

      const { error: bookingError } = await supabase.from('bookings').insert({
        id: bookingId,
        provider_id: availableProvider.id,
        service_id: selectedBookingService.id,
        resource_id: bookingForm.resourceId || null,
        extra_services: extraServicesText,
        client: bookingForm.client,
        contact: bookingForm.contact,
        date: bookingForm.date,
        time: bookingForm.time,
        status: 'pendente',
        notes: bookingForm.notes,
      })
      if (bookingError) throw bookingError
      if (clientInviteToken) {
        await supabase
          .from('client_invites')
          .update({ status: 'usado', used_by_client_id: clientId, used_at: nowIso })
          .eq('token', clientInviteToken)
        updateData((current) => ({
          ...current,
          clientInvites: current.clientInvites.map((invite) =>
            invite.token === clientInviteToken
              ? { ...invite, status: 'usado', usedByClientId: clientId, usedAt: nowIso }
              : invite,
          ),
        }))
      }
    } catch {
      alert('O agendamento apareceu na tela, mas houve um erro ao salvar no banco de dados. Atualize a página para conferir se ficou salvo.')
    }
  }

  const createProvider = async (event) => {
    event.preventDefault()
    const invite = providerInviteToken
      ? data.providerInvites.find((item) => item.token === providerInviteToken && item.status === 'ativo')
      : null

    if (session?.role !== 'admin' && !invite && !data.settings.allowProviderSelfSignup) {
      alert('Cadastro de prestador somente por convite do admin.')
      return
    }

    const id = crypto.randomUUID()
    const serviceId = crypto.randomUUID()
    const autoApprove = data.settings.approvalMode === 'automatico'
    const createdAt = new Date().toISOString()
    const newProvider = {
      id,
      name: providerForm.name,
      owner: providerForm.owner,
      category: providerForm.category,
      city: providerForm.city,
      highlights: [],
      slug: providerPublicSlug({ id, name: providerForm.name }),
      inviteTitle: `Agende com ${providerForm.name}`,
      inviteMessage: 'Escolha um horario disponivel e envie sua solicitacao de atendimento.',
      firstOffer: providerForm.service,
      logoUrl: '',
      theme: { accent: data.brand.accent, background: '#111827', style: 'profissional' },
      active: autoApprove,
      approvalStatus: autoApprove ? 'aprovado' : 'analise',
      capacity: providerForm.capacity,
      representativeUserId: invite?.representativeUserId || null,
    }
    const newService = {
      id: serviceId,
      providerId: id,
      name: providerForm.service,
      description: '',
      price: providerForm.price,
      priceMode: 'fixo',
      duration: providerForm.duration,
      active: true,
      position: 0,
      createdAt,
    }

    updateData((current) => ({
      ...current,
      providers: [...current.providers, newProvider],
      providerServices: [...current.providerServices, newService],
      providerInvites: invite
        ? current.providerInvites.map((item) =>
            item.id === invite.id
              ? { ...item, status: 'usado', usedByProviderId: id, usedAt: createdAt }
              : item,
          )
        : current.providerInvites,
    }))
    setProviderForm({ name: '', owner: '', category: '', city: '', service: '', duration: 50, price: 100, capacity: 6 })
    setSelectedProvider(id)

    const { error } = await supabase.from('providers').insert({
      id: newProvider.id,
      name: newProvider.name,
      owner: newProvider.owner,
      category: newProvider.category,
      city: newProvider.city,
      service: newService.name,
      invite_title: newProvider.inviteTitle,
      invite_message: newProvider.inviteMessage,
      first_offer: newProvider.firstOffer,
      logo_url: newProvider.logoUrl,
      theme: newProvider.theme,
      duration: newService.duration || 50,
      price: newService.price,
      highlights: newProvider.highlights,
      active: newProvider.active,
      approval_status: newProvider.approvalStatus,
      capacity: newProvider.capacity,
      slug: newProvider.slug,
      representative_user_id: newProvider.representativeUserId,
    })
    const { error: serviceError } = await supabase.from('provider_services').insert({
      id: newService.id,
      provider_id: newProvider.id,
      name: newService.name,
      description: newService.description,
      price: newService.price,
      price_mode: newService.priceMode,
      duration: newService.duration,
      active: newService.active,
      position: newService.position,
      created_at: newService.createdAt,
    })
    if (invite) {
      await supabase
        .from('provider_invites')
        .update({ status: 'usado', used_by_provider_id: id, used_at: createdAt })
        .eq('id', invite.id)
    }
    if (error || serviceError) alert('O cadastro apareceu na tela, mas houve um erro ao salvar no banco de dados. Atualize a pagina para conferir se ficou salvo.')
  }


  const approveProvider = async (id) => {
    const { error } = await supabase.from('providers').update({ active: true, approval_status: 'aprovado' }).eq('id', id)
    if (error) {
      alert('Não foi possível aprovar esse prestador no banco de dados. Tente novamente.')
      return false
    }
    updateData((current) => ({
      ...current,
      providers: current.providers.map((item) =>
        item.id === id ? { ...item, active: true, approvalStatus: 'aprovado' } : item,
      ),
    }))
    return true
  }

  const linkProviderOwner = async (id, ownerEmail) => {
    const email = ownerEmail.trim().toLowerCase()
    if (!email.includes('@')) {
      alert('Informe o e-mail que o prestador já usou para fazer login.')
      return false
    }
    const { error } = await supabase.rpc('link_provider_owner', { target_provider_id: id, owner_email: email })
    if (error) {
      alert(error.message || 'Não foi possível vincular essa conta a esse prestador.')
      return false
    }
    updateData((current) => ({
      ...current,
      providers: current.providers.map((item) => (item.id === id ? { ...item, ownerUserId: 'vinculado' } : item)),
    }))
    return true
  }

  const provisionProviderOwner = async (providerId, ownerEmail) => {
    const result = await provisionAccountAccess(ownerEmail)
    if (!result) return null
    const linked = await linkProviderOwner(providerId, result.email)
    return { email: result.email, tempPassword: result.tempPassword, linked }
  }

  const updateBookingStatus = async (id, status) => {
    updateData((current) => ({
      ...current,
      bookings: current.bookings.map((booking) => (booking.id === id ? { ...booking, status } : booking)),
    }))
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
    if (error) alert('Não foi possível salvar essa alteração de status no banco de dados. Tente novamente.')
  }

  const createBlockedSlot = async (event) => {
    event.preventDefault()
    const hasBooking = agendaDayBookings.some((booking) => booking.time === blockForm.time && booking.status !== 'cancelado')
    const hasBlock = agendaDayBlocks.some((slot) => slot.time === blockForm.time)

    if (hasBooking || hasBlock) {
      alert('Esse horário já está ocupado ou bloqueado.')
      return
    }

    const id = crypto.randomUUID()
    const reason = blockForm.reason || 'Indisponível'
    // Com filtro em "todos" e recursos cadastrados, o bloqueio vale pra loja
    // inteira (resourceId null); com um recurso selecionado, bloqueia só ele.
    const blockResourceId = agendaResource === 'todos' ? null : agendaResource

    updateData((current) => ({
      ...current,
      blockedSlots: [
        ...current.blockedSlots,
        {
          id,
          providerId: provider.id,
          date: agendaDate,
          time: blockForm.time,
          reason,
          resourceId: blockResourceId,
        },
      ],
    }))
    setBlockForm({ ...blockForm, reason: '' })

    const { error } = await supabase.from('blocked_slots').insert({
      id,
      provider_id: provider.id,
      date: agendaDate,
      time: blockForm.time,
      reason,
      resource_id: blockResourceId,
    })
    if (error) alert('O bloqueio apareceu na tela, mas houve um erro ao salvar no banco de dados. Atualize a página para conferir se ficou salvo.')
  }

  const removeBlockedSlot = async (id) => {
    updateData((current) => ({
      ...current,
      blockedSlots: current.blockedSlots.filter((slot) => slot.id !== id),
    }))
    const { error } = await supabase.from('blocked_slots').delete().eq('id', id)
    if (error) alert('Não foi possível liberar esse horário no banco de dados. Tente novamente.')
  }

  const createProviderService = async () => {
    const id = crypto.randomUUID()
    const nextPosition = providerServices.length
    const service = {
      id,
      providerId: provider.id,
      name: 'Novo servico',
      description: '',
      price: 0,
      priceMode: 'fixo',
      duration: null,
      active: true,
      position: nextPosition,
      createdAt: new Date().toISOString(),
    }

    updateData((current) => ({ ...current, providerServices: [...current.providerServices, service] }))
    const { error } = await supabase.from('provider_services').insert({
      id,
      provider_id: provider.id,
      name: service.name,
      description: service.description,
      price: service.price,
      price_mode: service.priceMode,
      duration: service.duration,
      active: service.active,
      position: service.position,
      created_at: service.createdAt,
    })
    if (error) alert('Nao foi possivel salvar o novo servico no banco de dados.')
  }

  const updateProviderService = async (serviceId, field, value) => {
    updateData((current) => ({
      ...current,
      providerServices: current.providerServices.map((service) =>
        service.id === serviceId ? { ...service, [field]: value } : service,
      ),
    }))

    const columnMap = {
      name: 'name',
      description: 'description',
      price: 'price',
      priceMode: 'price_mode',
      duration: 'duration',
      active: 'active',
      position: 'position',
    }
    const { error } = await supabase.from('provider_services').update({ [columnMap[field]]: value }).eq('id', serviceId)
    if (error) alert('Nao foi possivel salvar esse servico no banco de dados.')
  }

  const moveProviderService = async (serviceId, direction) => {
    const index = providerServices.findIndex((service) => service.id === serviceId)
    const swapIndex = index + direction
    if (index < 0 || swapIndex < 0 || swapIndex >= providerServices.length) return

    const first = providerServices[index]
    const second = providerServices[swapIndex]
    updateData((current) => ({
      ...current,
      providerServices: current.providerServices.map((service) =>
        service.id === first.id
          ? { ...service, position: second.position }
          : service.id === second.id
            ? { ...service, position: first.position }
            : service,
      ),
    }))
    await Promise.all([
      supabase.from('provider_services').update({ position: second.position }).eq('id', first.id),
      supabase.from('provider_services').update({ position: first.position }).eq('id', second.id),
    ])
  }

  const createProviderResource = async () => {
    const id = crypto.randomUUID()
    const nextPosition = providerResources.length
    const resource = {
      id,
      providerId: provider.id,
      name: 'Novo recurso',
      bio: '',
      photoUrl: '',
      active: true,
      position: nextPosition,
      createdAt: new Date().toISOString(),
    }

    updateData((current) => ({ ...current, providerResources: [...current.providerResources, resource] }))
    const { error } = await supabase.from('provider_resources').insert({
      id,
      provider_id: provider.id,
      name: resource.name,
      bio: resource.bio,
      photo_url: resource.photoUrl,
      active: resource.active,
      position: resource.position,
      created_at: resource.createdAt,
    })
    if (error) alert('Não foi possível salvar o novo recurso no banco de dados.')
  }

  const updateProviderResource = async (resourceId, field, value) => {
    updateData((current) => ({
      ...current,
      providerResources: current.providerResources.map((resource) =>
        resource.id === resourceId ? { ...resource, [field]: value } : resource,
      ),
    }))

    const columnMap = { name: 'name', bio: 'bio', photoUrl: 'photo_url', active: 'active', position: 'position' }
    const { error } = await supabase.from('provider_resources').update({ [columnMap[field]]: value }).eq('id', resourceId)
    if (error) alert('Não foi possível salvar esse recurso no banco de dados.')
  }

  const removeProviderResource = async (resourceId) => {
    updateData((current) => ({
      ...current,
      providerResources: current.providerResources.filter((resource) => resource.id !== resourceId),
    }))
    const { error } = await supabase.from('provider_resources').delete().eq('id', resourceId)
    if (error) alert('Não foi possível remover esse recurso no banco de dados.')
  }

  const removeProviderService = async (serviceId) => {
    updateData((current) => ({
      ...current,
      providerServices: current.providerServices.filter((service) => service.id !== serviceId),
      portfolioPhotos: current.portfolioPhotos.map((photo) =>
        photo.serviceId === serviceId ? { ...photo, serviceId: null } : photo,
      ),
    }))
    const { error } = await supabase.from('provider_services').delete().eq('id', serviceId)
    if (error) alert('Nao foi possivel remover esse servico no banco de dados.')
  }

  const imageFileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const image = document.createElement('img')
        image.onload = () => {
          const maxSize = 1024
          const ratio = Math.min(1, maxSize / Math.max(image.width, image.height))
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(image.width * ratio)
          canvas.height = Math.round(image.height * ratio)
          const context = canvas.getContext('2d')
          context.drawImage(image, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg', 0.7))
        }
        image.onerror = reject
        image.src = reader.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const uploadPortfolioPhoto = async (serviceId, file) => {
    if (!file) return
    const targetPhotos = providerPhotos.filter((photo) => (serviceId ? photo.serviceId === serviceId : !photo.serviceId))
    const limit = serviceId ? 6 : 10
    if (targetPhotos.length >= limit) {
      alert(`Limite de ${limit} fotos atingido.`)
      return
    }

    const id = crypto.randomUUID()
    const imageBase64 = await imageFileToBase64(file)
    const photo = {
      id,
      providerId: provider.id,
      serviceId,
      imageBase64,
      caption: '',
      position: targetPhotos.length,
      createdAt: new Date().toISOString(),
    }
    updateData((current) => ({ ...current, portfolioPhotos: [...current.portfolioPhotos, photo] }))
    const { error } = await supabase.from('portfolio_photos').insert({
      id,
      provider_id: provider.id,
      service_id: serviceId,
      image_base64: imageBase64,
      caption: '',
      position: photo.position,
      created_at: photo.createdAt,
    })
    if (error) alert('Nao foi possivel salvar essa foto no banco de dados.')
  }

  const updatePortfolioPhotoCaption = async (photoId, caption) => {
    updateData((current) => ({
      ...current,
      portfolioPhotos: current.portfolioPhotos.map((photo) => (photo.id === photoId ? { ...photo, caption } : photo)),
    }))
    const { error } = await supabase.from('portfolio_photos').update({ caption }).eq('id', photoId)
    if (error) alert('Nao foi possivel salvar a legenda da foto.')
  }

  const removePortfolioPhoto = async (photoId) => {
    updateData((current) => ({
      ...current,
      portfolioPhotos: current.portfolioPhotos.filter((photo) => photo.id !== photoId),
    }))
    const { error } = await supabase.from('portfolio_photos').delete().eq('id', photoId)
    if (error) alert('Nao foi possivel remover essa foto.')
  }

  const createPrivacyRequest = async (event) => {
    event.preventDefault()
    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()

    updateData((current) => ({
      ...current,
      privacyRequests: [
        ...current.privacyRequests,
        {
          id,
          providerId: publicProviderId || null,
          contact: privacyContact,
          type: 'exclusao_ou_acesso',
          status: 'aberta',
          createdAt,
        },
      ],
    }))
    setPrivacyContact('')
    setPrivacyMessage('Solicitação registrada. O responsável pela plataforma deve analisar este pedido.')

    const { error } = await supabase.from('privacy_requests').insert({
      id,
      provider_id: publicProviderId || null,
      contact: privacyContact,
      type: 'exclusao_ou_acesso',
      status: 'aberta',
      created_at: createdAt,
    })
    if (error) alert('A solicitação apareceu na tela, mas houve um erro ao salvar no banco de dados. Atualize a página para conferir se ficou salva.')
  }

  const toggleProvider = async (id) => {
    const target = data.providers.find((item) => item.id === id)
    const nextActive = !target.active
    const nextApprovalStatus = nextActive ? 'aprovado' : 'pausado'

    const { error } = await supabase
      .from('providers')
      .update({ active: nextActive, approval_status: nextApprovalStatus })
      .eq('id', id)
    if (error) {
      alert('Não foi possível salvar essa alteração no banco de dados. Tente novamente.')
      return false
    }
    updateData((current) => ({
      ...current,
      providers: current.providers.map((item) =>
        item.id === id ? { ...item, active: nextActive, approvalStatus: nextApprovalStatus } : item,
      ),
    }))
    return true
  }

  const updateBrand = async (field, value) => {
    updateData((current) => ({
      ...current,
      brand: { ...current.brand, [field]: value },
    }))
    const { error } = await supabase
      .from('platform_settings')
      .update({ [BRAND_COLUMN_MAP[field]]: value })
      .eq('id', 1)
    if (error) alert('Não foi possível salvar essa alteração de marca no banco de dados. Tente novamente.')
  }

  const getInviteLink = (targetProvider) => {
    const invite = data.clientInvites.find((item) => item.providerId === targetProvider.id && item.status === 'ativo')
    return invite
      ? `${window.location.origin}${window.location.pathname}#cliente=${invite.token}`
      : `${window.location.origin}${window.location.pathname}#agendar=${targetProvider.slug || targetProvider.id}`
  }
  const getStoreLink = (targetProvider) => `${window.location.origin}${window.location.pathname}#loja=${targetProvider.slug || targetProvider.id}`

  const buildWhatsAppLink = (client, targetProvider) => {
    const message = `Olá, ${client.name}! Vamos agendar seu próximo atendimento? ${getInviteLink(targetProvider)}`
    const digits = (client.contact || '').replace(/\D/g, '')
    const looksLikePhone = !client.contact.includes('@') && digits.length >= 10 && digits.length <= 13
    const phone = looksLikePhone ? (digits.length <= 11 ? `55${digits}` : digits) : ''
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  const getProviderInviteLink = (invite) => `${window.location.origin}${window.location.pathname}#prestador=${invite.token}`
  const getRepresentativeInviteLink = (invite) => `${window.location.origin}${window.location.pathname}#representante=${invite.token}`

  const createProviderInvite = async (event) => {
    event.preventDefault()
    const { data: createdInvite, error } = await supabase.rpc('create_scoped_provider_invite', {
      target_email: providerInviteForm.email,
    })
    if (error) {
      setProviderInviteNotice(error.message)
      return
    }
    const row = Array.isArray(createdInvite) ? createdInvite[0] : createdInvite
    const invite = mapProviderInviteRow(row)

    updateData((current) => ({ ...current, providerInvites: [invite, ...current.providerInvites] }))
    setProviderInviteForm({ email: '' })
    setProviderInviteNotice(getProviderInviteLink(invite))
  }

  const createClientInvite = async (event) => {
    event.preventDefault()
    if (!provider || provider.approvalStatus !== 'aprovado') {
      alert('Somente prestadores aprovados podem gerar link de cliente.')
      return
    }

    const nowIso = new Date().toISOString()
    const invite = {
      id: crypto.randomUUID(),
      token: tokenValue(),
      providerId: provider.id,
      createdByProviderId: provider.id,
      invitedContact: clientInviteForm.contact.trim(),
      status: 'ativo',
      expiresAt: null,
      usedByClientId: null,
      usedAt: null,
      createdAt: nowIso,
    }

    updateData((current) => ({ ...current, clientInvites: [invite, ...current.clientInvites] }))
    setClientInviteForm({ contact: '' })
    setClientInviteNotice(`${window.location.origin}${window.location.pathname}#cliente=${invite.token}`)

    const { error } = await supabase.from('client_invites').insert({
      id: invite.id,
      token: invite.token,
      provider_id: invite.providerId,
      created_by_provider_id: invite.createdByProviderId,
      invited_contact: invite.invitedContact,
      status: invite.status,
      expires_at: invite.expiresAt,
      created_at: invite.createdAt,
    })
    if (error) setClientInviteNotice('Convite criado na tela, mas a tabela client_invites ainda precisa ser criada no Supabase.')
  }

  const createRepresentativeInvite = async (event) => {
    event.preventDefault()
    setRepresentativeNotice('')
    setRepresentativeDeliveryNotice('')
    setRepresentativeInviteLink('')
    const invitedEmail = representativeEmail.trim().toLowerCase()
    const { data: createdInvite, error } = await supabase.rpc('create_representative_invite', {
      target_email: invitedEmail,
    })
    if (error) {
      setRepresentativeNotice(error.message)
      return
    }
    const invite = Array.isArray(createdInvite) ? createdInvite[0] : createdInvite
    setRepresentativeInvites((current) => [invite, ...current.filter((item) => item.status !== 'ativo' || item.invited_email !== invite.invited_email)])
    setRepresentativeEmail('')
    const inviteUrl = getRepresentativeInviteLink(invite)
    setRepresentativeInviteLink(inviteUrl)
    if (!data.settings.inviteEmailEnabled) {
      setRepresentativeDeliveryNotice('Link criado. O envio automático está desativado.')
      return
    }
    const { error: deliveryError } = await supabase.functions.invoke('send-representative-invite', {
      body: { email: invitedEmail, inviteUrl },
    })
    setRepresentativeDeliveryNotice(deliveryError ? 'Link criado, mas o e-mail não foi enviado. Verifique a conexão de e-mail.' : 'Convite enviado por e-mail com sucesso.')
  }

  const checkInviteEmailConnection = async () => {
    setInviteEmailConnection((current) => ({ ...current, checked: false }))
    const { data: status, error } = await supabase.functions.invoke('send-representative-invite', {
      body: { action: 'status' },
    })
    setInviteEmailConnection({ checked: true, configured: !error && Boolean(status?.configured) })
  }

  const copyRepresentativeInviteLink = async (invite) => {
    try {
      await navigator.clipboard.writeText(getRepresentativeInviteLink(invite))
      setRepresentativeDeliveryNotice('Link do convite copiado.')
    } catch {
      setRepresentativeDeliveryNotice('Não foi possível copiar o link neste navegador.')
    }
  }

  const changeRepresentativeStatus = async (representative) => {
    const nextStatus = representative.status === 'ativo' ? 'suspenso' : 'ativo'
    const { error } = await supabase.rpc('set_representative_status', {
      target_user_id: representative.user_id,
      next_status: nextStatus,
    })
    if (error) {
      setRepresentativeNotice(error.message)
      return
    }
    setRepresentatives((current) => current.map((item) => item.user_id === representative.user_id ? { ...item, status: nextStatus } : item))
  }

  const provisionAccountAccess = async (email, options = {}) => {
    const passwordLength = Math.max(12, data.settings.minPasswordLength || 8)
    const { data: result, error } = await supabase.functions.invoke('admin-set-password', {
      body: { email: email.trim().toLowerCase(), inviteToken: options.inviteToken || undefined, passwordLength },
    })
    if (error || result?.error) {
      alert(result?.error || 'Não foi possível definir a senha de acesso.')
      return null
    }
    setPasswordProvisionNotice({ email: result.email, tempPassword: result.tempPassword })
    return result
  }

  const resetRepresentativePassword = async (representative) => {
    if (provisioningTarget) return
    setProvisioningTarget(representative.user_id)
    try {
      await provisionAccountAccess(representative.email)
    } finally {
      setProvisioningTarget('')
    }
  }

  const provisionRepresentativeInvite = async (invite) => {
    if (provisioningTarget) return
    setProvisioningTarget(invite.id)
    try {
      const result = await provisionAccountAccess(invite.invited_email, { inviteToken: invite.token })
      if (!result) return
      if (!result.inviteFinalized) {
        alert(result.inviteError || 'Senha criada, mas não foi possível concluir o vínculo do convite.')
      }
      const [representativesResult, invitesResult] = await Promise.all([
        supabase.from('platform_representatives').select('*').order('created_at', { ascending: false }),
        supabase.from('representative_invites').select('*').order('created_at', { ascending: false }),
      ])
      setRepresentatives(representativesResult.data || [])
      setRepresentativeInvites(invitesResult.data || [])
    } finally {
      setProvisioningTarget('')
    }
  }

  const transferProvider = async (providerId, representativeUserId) => {
    const { error } = await supabase.rpc('transfer_provider_representative', {
      target_provider_id: providerId,
      target_representative_user_id: representativeUserId || null,
    })
    if (error) {
      alert(error.message)
      return false
    }
    updateData((current) => ({
      ...current,
      providers: current.providers.map((item) => item.id === providerId ? { ...item, representativeUserId: representativeUserId || null } : item),
    }))
    return true
  }

  const updateInviteDraft = (providerId, field, value) => {
    setInviteDrafts((current) => ({
      ...current,
      [providerId]: {
        ...(current[providerId] || data.providers.find((item) => item.id === providerId)),
        [field]: value,
      },
    }))
    setSavedNotice('')
  }

  const updateThemeDraft = (providerId, field, value) => {
    setInviteDrafts((current) => {
      const base = current[providerId] || data.providers.find((item) => item.id === providerId)
      return {
        ...current,
        [providerId]: {
          ...base,
          theme: { ...base.theme, [field]: value },
        },
      }
    })
    setSavedNotice('')
  }

  const saveInviteDraft = async (providerId) => {
    const draft = inviteDrafts[providerId]
    if (!draft) {
      setSavedNotice('Nenhuma alteração pendente.')
      return
    }

    updateData((current) => ({
      ...current,
      providers: current.providers.map((item) =>
        item.id === providerId
          ? {
              ...item,
              name: draft.name,
              category: draft.category,
              city: draft.city,
              about: draft.about,
              highlights: draft.highlights,
              logoUrl: draft.logoUrl,
              inviteTitle: draft.inviteTitle,
              inviteMessage: draft.inviteMessage,
              firstOffer: draft.firstOffer,
              theme: draft.theme,
              showPrices: draft.showPrices,
            }
          : item,
      ),
    }))
    setInviteDrafts((current) => {
      const next = { ...current }
      delete next[providerId]
      return next
    })
    setSavedNotice('Alterações salvas.')

    const { error } = await supabase
      .from('providers')
      .update({
        name: draft.name,
        category: draft.category,
        city: draft.city,
        about: draft.about,
        highlights: draft.highlights,
        logo_url: draft.logoUrl,
        invite_title: draft.inviteTitle,
        invite_message: draft.inviteMessage,
        first_offer: draft.firstOffer,
        theme: draft.theme,
        show_prices: draft.showPrices,
      })
      .eq('id', providerId)
    if (error) setSavedNotice('Erro ao salvar no banco de dados. Tente novamente.')
  }

  const uploadProviderLogo = (providerId, file) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => updateInviteDraft(providerId, 'logoUrl', reader.result)
    reader.readAsDataURL(file)
  }

  const createAnnouncement = async (title, message) => {
    if (!title.trim() || !message.trim()) return
    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    updateData((current) => ({
      ...current,
      announcements: [{ id, title, message, active: true, createdAt }, ...current.announcements],
    }))
    const { error } = await supabase.from('platform_announcements').insert({ id, title, message, active: true, created_at: createdAt })
    if (error) alert('Não foi possível salvar o comunicado no banco de dados.')
  }

  const toggleAnnouncement = async (id) => {
    const current = data.announcements.find((item) => item.id === id)
    if (!current) return
    updateData((state) => ({
      ...state,
      announcements: state.announcements.map((item) => (item.id === id ? { ...item, active: !item.active } : item)),
    }))
    const { error } = await supabase.from('platform_announcements').update({ active: !current.active }).eq('id', id)
    if (error) alert('Não foi possível atualizar esse comunicado no banco de dados.')
  }

  const removeAnnouncement = async (id) => {
    updateData((current) => ({
      ...current,
      announcements: current.announcements.filter((item) => item.id !== id),
    }))
    const { error } = await supabase.from('platform_announcements').delete().eq('id', id)
    if (error) alert('Não foi possível remover esse comunicado no banco de dados.')
  }

  const uploadBrandLogo = (file) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => updateBrand('logoUrl', reader.result)
    reader.readAsDataURL(file)
  }

  const uploadBrandLogotype = (file) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => updateBrand('logotypeUrl', reader.result)
    reader.readAsDataURL(file)
  }

  const shareProviderLink = async (targetProvider) => {
    const url = getInviteLink(targetProvider)
    const text = `Olá! Você pode agendar seu atendimento comigo por este link: ${url}`

    if (navigator.share) {
      await navigator.share({
        title: `Agendamento - ${targetProvider.name}`,
        text,
        url,
      })
      return
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  const login = (role, providerId = 'p1', email = '', access = {}, user = null) => {
    window.history.replaceState(null, '', window.location.pathname)
    setPublicProviderId(null)
    setPublicEntryType('agendar')
    setSession({
      role,
      providerId,
      email,
      isMasterAdmin: access.isMasterAdmin ?? email === MASTER_ADMIN_EMAIL,
      isRepresentative: access.isRepresentative ?? false,
    })
    setSelectedProvider(providerId)
    if (user?.user_metadata?.must_change_password) {
      setForcedPasswordChange(true)
      setView('conta')
    } else {
      setView(access.isRepresentative ? 'representante' : role === 'admin' ? 'admin' : role)
    }
    setProviderTab('agenda')
  }

  const submitLogin = async (event) => {
    event.preventDefault()
    setLoginError('')
    if (!loginForm.email.includes('@') || loginForm.password.length < 8) {
      setLoginError('Informe um e-mail válido e uma senha com pelo menos 8 caracteres.')
      return
    }
    const email = loginForm.email.trim().toLowerCase()
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password: loginForm.password })
    if (error || !authData.user) {
      setLoginError('E-mail ou senha incorretos. Use uma conta cadastrada.')
      return
    }
    setAuthUser(authData.user)
    let access
    try {
      access = await resolveAuthenticatedRole(authData.user)
    } catch (inviteError) {
      setLoginError(inviteError.message)
      await supabase.auth.signOut()
      setAuthUser(null)
      return
    }
    const role = access.role

    if (role === 'prestador') {
      const { data: ownedProvider, error: ownerError } = await supabase
        .from('providers')
        .select('id')
        .eq('owner_user_id', authData.user.id)
        .maybeSingle()

      if (ownerError?.code === '42703') {
        // Coluna owner_user_id ainda não existe nesse banco (migração de vínculo
        // ainda não rodou) — cai no comportamento antigo em vez de bloquear o login.
        login(role, selectedProvider, email, access, authData.user)
        return
      }

      if (ownerError || !ownedProvider) {
        setLoginError('Sua conta ainda não está vinculada a um prestador. Peça para o admin vincular seu acesso na aba Prestadores.')
        await supabase.auth.signOut()
        setAuthUser(null)
        return
      }
      login(role, ownedProvider.id, email, access, authData.user)
      return
    }

    login(role, undefined, email, access, authData.user)
  }

  const createMasterAccess = async () => {
    const email = loginForm.email.trim().toLowerCase()
    const isRepresentativeInvite = Boolean(getInviteToken('representante'))
    if (email !== MASTER_ADMIN_EMAIL && !isRepresentativeInvite) {
      setLoginError('O primeiro acesso direto está disponível somente para o admin master.')
      return
    }
    const minPasswordLength = data.settings.minPasswordLength || 8
    if (loginForm.password.length < minPasswordLength) {
      setLoginError(`Crie uma senha com pelo menos ${minPasswordLength} caracteres para o primeiro acesso.`)
      return
    }
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password: loginForm.password,
      options: {
        data: isRepresentativeInvite ? { role: 'representante' } : { role: 'admin', admin_level: 'master' },
        emailRedirectTo: window.location.href,
      },
    })
    if (error) {
      setLoginError(error.status === 429 ? 'Aguarde alguns minutos antes de solicitar outro acesso.' : 'Não foi possível criar o primeiro acesso.')
      return
    }
    if (authData.session) {
      setAuthUser(authData.user)
      const access = await resolveAuthenticatedRole(authData.user)
      login(access.role, undefined, email, access, authData.user)
      return
    }
    setLoginError('Confira seu e-mail para confirmar o primeiro acesso.')
  }

  const requestPasswordReset = async () => {
    const email = loginForm.email.trim().toLowerCase()
    if (!email.includes('@')) {
      setLoginError('Informe seu e-mail para recuperar a senha.')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    setLoginError(error ? 'Não foi possível enviar o link de recuperação.' : 'Enviamos um link de recuperação para o seu e-mail.')
  }

  const logout = async () => {
    if (authUser) await supabase.auth.signOut()
    window.history.replaceState(null, '', window.location.pathname)
    setPublicProviderId(null)
    setPublicEntryType('agendar')
    setSession(null)
    setAuthUser(null)
    setView('cliente')
  }

  const loadAccountSessions = async () => {
    setAccountLoading(true)
    setAccountNotice({ type: '', text: '' })
    const { data: sessions, error } = await supabase.rpc('list_my_auth_sessions')
    setAccountLoading(false)
    if (error) {
      setAccountNotice({ type: 'error', text: 'Não foi possível consultar os dispositivos conectados.' })
      return
    }
    setAccountSessions(sessions || [])
  }

  const changeOwnPassword = async (event) => {
    event.preventDefault()
    setAccountNotice({ type: '', text: '' })
    const minPasswordLength = data.settings.minPasswordLength || 8
    if (passwordForm.next.length < minPasswordLength) {
      setAccountNotice({ type: 'error', text: `A nova senha precisa ter pelo menos ${minPasswordLength} caracteres.` })
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setAccountNotice({ type: 'error', text: 'A confirmação não corresponde à nova senha.' })
      return
    }
    const email = authUser?.email
    if (!email) return
    if (!passwordRecovery && !forcedPasswordChange) {
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: passwordForm.current })
      if (verifyError) {
        setAccountNotice({ type: 'error', text: 'A senha atual está incorreta.' })
        return
      }
    }
    const updatePayload = { password: passwordForm.next }
    if (forcedPasswordChange) updatePayload.data = { must_change_password: false }
    const { error } = await supabase.auth.updateUser(updatePayload)
    if (error) {
      setAccountNotice({ type: 'error', text: 'Não foi possível alterar a senha. Tente novamente.' })
      return
    }
    setPasswordForm({ current: '', next: '', confirm: '' })
    setPasswordRecovery(false)
    setForcedPasswordChange(false)
    setAccountNotice({ type: 'success', text: 'Senha alterada com sucesso.' })
  }

  const closeOtherSessions = async () => {
    setAccountLoading(true)
    setAccountNotice({ type: '', text: '' })
    const { error } = await supabase.auth.signOut({ scope: 'others' })
    if (error) {
      setAccountLoading(false)
      setAccountNotice({ type: 'error', text: 'Não foi possível encerrar as outras sessões.' })
      return
    }
    await loadAccountSessions()
    setAccountNotice({ type: 'success', text: 'As outras sessões foram encerradas.' })
  }

  const closeSelectedSessions = async (sessionIds) => {
    if (!sessionIds.length) return false
    setAccountLoading(true)
    setAccountNotice({ type: '', text: '' })
    const { data: revokedCount, error } = await supabase.rpc('revoke_my_auth_sessions', {
      target_session_ids: sessionIds,
    })
    if (error) {
      setAccountLoading(false)
      setAccountNotice({ type: 'error', text: 'Não foi possível encerrar os dispositivos selecionados.' })
      return false
    }
    await loadAccountSessions()
    setAccountNotice({ type: 'success', text: `${revokedCount} ${revokedCount === 1 ? 'sessão encerrada' : 'sessões encerradas'} com sucesso.` })
    return true
  }

  if (loading) {
    return (
      <main className="loginShell">
        <section className="loginPanel">
          <div className="brand loginBrand">
            <div className="brandMark"><CalendarCheck size={20} /></div>
            <div>
              <strong>Meu Serviço Online</strong>
              <span>Carregando dados...</span>
            </div>
          </div>
          <p className="loginCopy">Conectando ao banco de dados. Isso leva só um instante.</p>
        </section>
      </main>
    )
  }

  if (loadError || !data) {
    return (
      <main className="loginShell">
        <section className="loginPanel">
          <div className="brand loginBrand">
            <div className="brandMark"><AlertCircle size={20} /></div>
            <div>
              <strong>Meu Serviço Online</strong>
              <span>Não foi possível carregar os dados</span>
            </div>
          </div>
          <p className="loginCopy">Verifique sua conexão e tente novamente.</p>
          <button className="primary" onClick={() => window.location.reload()}>Tentar novamente</button>
        </section>
      </main>
    )
  }

  if (!session) {
    const invalidPublicLink = getLinkedProviderId()
    return (
      <main className="loginShell" style={{ '--accent': data.brand.accent }}>
        <section className="loginPanel">
          <aside className="loginContext">
            {data.brand.logotypeUrl ? (
              <img className="loginLogotype" src={data.brand.logotypeUrl} alt={data.brand.name} />
            ) : (
              <div className="brand loginBrand">
                <div className="brandMark">{data.brand.logoUrl ? <img src={data.brand.logoUrl} alt="" /> : <CalendarCheck size={20} />}</div>
                <div><strong>{data.brand.name}</strong><span>Gestão de agenda</span></div>
              </div>
            )}
            <div className="loginContextCopy">
              <span className="loginKicker">ACESSO SEGURO</span>
              <h1>Sua operação começa pela agenda.</h1>
              <p>Organize atendimentos, disponibilidade, clientes e serviços em um único lugar.</p>
            </div>
            <div className="loginSecurity"><ShieldCheck size={18} /><span>Ambiente de homologação. Não utilize dados reais.</span></div>
          </aside>

          <section className="loginAccess">
            <div className="loginAccessHeader">
              <div><h2>Entrar na conta</h2><p>Use suas credenciais para continuar.</p></div>
              {appearanceControl}
            </div>

            {invalidPublicLink && (
              <div className="loginError" role="alert"><AlertCircle size={17} />Este link de agendamento não está mais disponível.</div>
            )}

            <form className="loginForm" onSubmit={submitLogin}>
              <label>E-mail
                <div className="fieldWithIcon"><Mail size={18} /><input type="email" autoComplete="username" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} placeholder="voce@empresa.com.br" /></div>
              </label>
              <label>Senha
                <div className="fieldWithIcon"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} placeholder="Sua senha" /><button type="button" onClick={() => setShowPassword((current) => !current)} title={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
              </label>
              <div className="loginOptions"><label className="remember"><input type="checkbox" defaultChecked /> Lembrar meu acesso</label><button type="button" className="textButton" onClick={requestPasswordReset}>Esqueci minha senha</button></div>
              {loginError && <div className="loginError" role="alert"><AlertCircle size={17} />{loginError}</div>}
              <button className="primary loginSubmit" type="submit">Entrar</button>
              {(loginForm.email.trim().toLowerCase() === MASTER_ADMIN_EMAIL || getInviteToken('representante')) && <button className="secondaryButton" type="button" onClick={createMasterAccess}>{getInviteToken('representante') ? 'Criar acesso de representante' : 'Criar primeiro acesso'}</button>}
            </form>

            {(data.settings.allowProviderSelfSignup || providerInviteToken) && <details className="signupDetails" open={Boolean(providerInviteToken)}>
              <summary>{providerInviteToken ? 'Convite do admin recebido' : 'Ainda nao possui cadastro?'} <strong>Solicitar acesso</strong></summary>
              <form className="signupInline" onSubmit={createProvider}>
              <div>
                <p className="eyebrow">Novo prestador</p>
                <h2>Solicitar cadastro</h2>
              </div>
                {providerInviteToken && <p className="privacyHint">Este cadastro foi liberado por um link enviado pelo admin.</p>}
              <input required placeholder="Nome do negócio" value={providerForm.name} onChange={(event) => setProviderForm({ ...providerForm, name: event.target.value })} />
              <input required placeholder="Responsável" value={providerForm.owner} onChange={(event) => setProviderForm({ ...providerForm, owner: event.target.value })} />
              <div className="inlineFields">
                <input required placeholder="Categoria" value={providerForm.category} onChange={(event) => setProviderForm({ ...providerForm, category: event.target.value })} />
                <input required placeholder="Cidade" value={providerForm.city} onChange={(event) => setProviderForm({ ...providerForm, city: event.target.value })} />
              </div>
              <input required placeholder="Serviço principal" value={providerForm.service} onChange={(event) => setProviderForm({ ...providerForm, service: event.target.value })} />
              <div className="inlineFields">
                <input type="number" min="15" value={providerForm.duration} onChange={(event) => setProviderForm({ ...providerForm, duration: Number(event.target.value) })} />
                <input type="number" min="0" value={providerForm.price} onChange={(event) => setProviderForm({ ...providerForm, price: Number(event.target.value) })} />
              </div>
              <button className="primary" type="submit">
                {data.settings.approvalMode === 'automatico' ? 'Criar cadastro' : 'Enviar para análise'}
              </button>
              </form>
            </details>}
          </section>
        </section>
      </main>
    )
  }

  if (session.role === 'cliente' && publicProviderId && bookingService) {
    const activeProvider = bookingService.provider
    const savedClient = getSavedClient(activeProvider.id)
    return (
      <main
        className="publicStorefront"
        style={{
          '--accent': activeProvider.theme?.accent || data.brand.accent,
          '--provider-accent': activeProvider.theme?.accent,
          '--provider-bg': activeProvider.theme?.background,
        }}
      >
        <div className="publicStorefrontInner">
          <div className={`inviteHero ${activeProvider.theme?.style || 'profissional'}`}>
            <div className="inviteLogo">
              {activeProvider.logoUrl ? <img src={activeProvider.logoUrl} alt="" /> : <Store size={30} />}
            </div>
            <div>
              <p className="eyebrow">{publicEntryType === 'loja' ? 'Loja do prestador' : 'Convite de agendamento'}</p>
              <h2>{publicEntryType === 'loja' ? activeProvider.name : activeProvider.inviteTitle}</h2>
              <p>{activeProvider.inviteMessage}</p>
              <strong>{activeProvider.firstOffer}</strong>
              {publicEntryType === 'loja' && (
                <button
                  className="storeCta"
                  onClick={() => {
                    trackAnalyticsEvent('visualizou_servico', bookingService)
                    trackAnalyticsEvent('iniciou_agendamento', bookingService)
                    window.location.hash = `agendar=${activeProvider.slug || activeProvider.id}`
                    setPublicEntryType('agendar')
                  }}
                >
                  Agendar agora
                </button>
              )}
            </div>
          </div>

          <ClientServiceHistory
            entries={clientServiceHistory}
            formatDate={formatDate}
            onRebook={rebookService}
            providerId={activeProvider.id}
          />

          {activeProvider.about && (
            <div className="panel aboutPanel">
              <p className="eyebrow">Sobre</p>
              <h3>{activeProvider.name}</h3>
              {activeProvider.about.split('\n').filter((paragraph) => paragraph.trim()).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}

          {publicEntryType === 'loja' && (
            <div className="panel storeFront">
              {activeProvider.highlights.length > 0 && (
                <div className="chips">
                  {activeProvider.highlights.map((highlight) => <span key={highlight}>{highlight}</span>)}
                </div>
              )}
              {publicGeneralPhotos.length > 0 && (
                <div className="publicGallery">
                  {publicGeneralPhotos.map((photo) => (
                    <figure key={photo.id}>
                      <img src={photo.imageBase64} alt="" />
                      {photo.caption && <figcaption>{photo.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              )}
              <div className="providerList">
                {filteredServices.map((item) => {
                  const servicePhoto = publicPhotos.find((photo) => photo.serviceId === item.id)
                  return (
                    <button
                      className="provider serviceCardPublic"
                      key={item.id}
                      onClick={() => {
                        trackAnalyticsEvent('visualizou_servico', item)
                        trackAnalyticsEvent('iniciou_agendamento', item)
                        setBookingForm({ ...bookingForm, serviceId: item.id, resourceId: '' })
                        setSuccessMessage('')
                        window.location.hash = `agendar=${item.provider.slug || item.provider.id}`
                        setPublicEntryType('agendar')
                      }}
                    >
                      {servicePhoto && <img src={servicePhoto.imageBase64} alt="" />}
                      <strong>{item.name}</strong>
                      <span>{item.description || item.provider.category}</span>
                      <small>{formatServiceDuration(item)} • {formatServicePrice(item, item.provider.showPrices)}</small>
                    </button>
                  )
                })}
                {filteredServices.length === 0 && <span className="emptyState">Nenhum serviço encontrado.</span>}
              </div>
            </div>
          )}

          {publicEntryType === 'agendar' && (
            <div className="panel">
              <div className="panelHeader">
                <div>
                  <p className="eyebrow">Portal do cliente</p>
                  <h2>Escolha um serviço</h2>
                </div>
              </div>
              <div className="providerList">
                {filteredServices.map((item) => (
                  <button
                    className={bookingForm.serviceId === item.id ? 'provider selected' : 'provider'}
                    key={item.id}
                    onClick={() => { trackAnalyticsEvent('visualizou_servico', item); trackAnalyticsEvent('iniciou_agendamento', item); setBookingForm({ ...bookingForm, serviceId: item.id, resourceId: '' }); setSuccessMessage('') }}
                  >
                    <strong>{item.name}</strong>
                    <span>{item.description || activeProvider.category}</span>
                    <small>{formatServiceDuration(item)} • {formatServicePrice(item, item.provider.showPrices)}</small>
                    <label className="checkLabel cartCheck" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={bookingForm.cartServiceIds.includes(item.id)}
                        onChange={() => toggleCartService(item.id)}
                      />
                      Também tenho interesse
                    </label>
                  </button>
                ))}
                {filteredServices.length === 0 && <span className="emptyState">Nenhum serviço encontrado.</span>}
              </div>
            </div>
          )}

          {publicEntryType === 'agendar' && (
            <form className="panel form" data-booking-form onSubmit={createBooking} onFocusCapture={() => trackAnalyticsEvent('iniciou_agendamento', bookingService)}>
              <div className="panelHeader compact">
                <div>
                  <p className="eyebrow">Novo agendamento</p>
                  <h2>Solicitar horário</h2>
                </div>
                <Clock3 size={22} />
              </div>

              {bookingService && (
                <div className="selectedService">
                  <span>Serviço selecionado</span>
                  <strong>{bookingService.name}</strong>
                  <small>
                    {formatServiceDuration(bookingService)} • {formatServicePrice(bookingService, bookingService.provider.showPrices)}
                  </small>
                </div>
              )}

              {cartServices.length > 0 && (
                <div className="selectedService">
                  <span>Também tem interesse em</span>
                  {cartServices.map((item) => (
                    <strong key={item.id}>{item.name}{item.provider.showPrices ? ` — ${formatServicePrice(item, true)}` : ''}</strong>
                  ))}
                </div>
              )}

              {successMessage && (
                <div className="successNotice">
                  <CheckCircle2 size={18} />
                  <span>{successMessage}</span>
                </div>
              )}

              {savedClient && (
                <p className="privacyHint">
                  Bem-vindo(a) de volta, {savedClient.name}!{' '}
                  <button
                    type="button"
                    className="textButton"
                    onClick={() => {
                      clearSavedClient(activeProvider.id)
                      setBookingForm({ ...bookingForm, client: '', contact: '' })
                    }}
                  >
                    Não é você? Limpar dados salvos
                  </button>
                </p>
              )}

              <label>Nome do cliente
                <input required value={bookingForm.client} onChange={(event) => setBookingForm({ ...bookingForm, client: event.target.value })} />
              </label>
              <label>E-mail ou WhatsApp
                <input
                  required
                  value={bookingForm.contact}
                  onChange={(event) => {
                    const nextContact = event.target.value
                    setBookingForm({
                      ...bookingForm,
                      contact: nextContact,
                      consent: bookingForm.consent || hasExistingConsent(data, publicProviderId, nextContact),
                    })
                  }}
                />
              </label>
              {publicResources.length > 0 && (
                <div className="timePicker">
                  <strong>Com quem</strong>
                  <div>
                    {publicResources.map((resource) => (
                      <button
                        className={bookingForm.resourceId === resource.id ? 'selected' : ''}
                        key={resource.id}
                        onClick={() => setBookingForm({ ...bookingForm, resourceId: resource.id, time: '' })}
                        type="button"
                      >
                        {resource.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="inlineFields">
                <label>Data
                  <input required max={maxBookingDate} min={today} type="date" value={bookingForm.date} onChange={(event) => setBookingForm({ ...bookingForm, date: event.target.value })} />
                </label>
              </div>
              <div className="timePicker">
                <strong>Horário</strong>
                <div>
                  {availableTimes.map((slot) => (
                    <button
                      className={bookingForm.time === slot.time ? 'selected' : ''}
                      disabled={!slot.available}
                      key={slot.time}
                      onClick={() => setBookingForm({ ...bookingForm, time: slot.time })}
                      type="button"
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
              <label>Observações
                <textarea value={bookingForm.notes} onChange={(event) => setBookingForm({ ...bookingForm, notes: event.target.value })} />
              </label>
              {data.settings.requireConsent && (
                <>
                  <label className="checkLabel">
                    <input
                      required
                      type="checkbox"
                      checked={bookingForm.consent}
                      onChange={(event) => setBookingForm({ ...bookingForm, consent: event.target.checked })}
                    />
                    Autorizo o uso do meu nome e contato para gerenciar este atendimento, retornos e comunicações com este prestador.
                  </label>
                  <p className="privacyHint">
                    {hasExistingConsent(data, publicProviderId, bookingForm.contact)
                      ? 'Consentimento já registrado para esse contato com este prestador. Você pode revisar desmarcando a caixa acima.'
                      : 'Seus dados ficam vinculados somente ao prestador deste link. Você pode solicitar acesso ou exclusão pelo canal de privacidade.'}
                  </p>
                </>
              )}
              <button className="primary" type="submit"><Plus size={18} /> Agendar</button>
            </form>
          )}

          {publicEntryType === 'agendar' && data.settings.allowClientPrivacyRequest && (
            <form className="panel privacyPanel" onSubmit={createPrivacyRequest}>
              <div className="panelHeader compact">
                <div>
                  <p className="eyebrow">Privacidade</p>
                  <h2>Dados do cliente</h2>
                </div>
                <Shield size={22} />
              </div>
              <p>
                Solicite acesso ou exclusão dos seus dados informando o mesmo e-mail ou WhatsApp usado no agendamento.
              </p>
              <input
                required
                placeholder="Seu e-mail ou WhatsApp"
                value={privacyContact}
                onChange={(event) => setPrivacyContact(event.target.value)}
              />
              {privacyMessage && <small className="privacyMessage">{privacyMessage}</small>}
              <button className="secondaryButton" type="submit">Solicitar privacidade</button>
            </form>
          )}

          <footer className="publicStorefrontFooter">
            {appearanceControl}
            <button type="button" className="textButton" onClick={logout}>Sair da pré-visualização</button>
          </footer>
        </div>
      </main>
    )
  }

  if (session.role === 'cliente' && publicProviderId && !bookingService) {
    return (
      <main className="publicStorefront">
        <div className="publicStorefrontInner">
          <div className="panel">
            <p className="eyebrow">Agendamento indisponível</p>
            <h2>Este prestador ainda não tem serviços disponíveis para agendamento.</h2>
          </div>
          <footer className="publicStorefrontFooter">
            {appearanceControl}
            <button type="button" className="textButton" onClick={logout}>Sair da pré-visualização</button>
          </footer>
        </div>
      </main>
    )
  }

  return (
    <main className="shell" style={{ '--accent': data.brand.accent, '--sidebar-logotype-height': `${data.brand.logotypeSize || 64}px` }}>
      <aside className="sidebar">
        {data.brand.logotypeUrl && <div className="brand sidebarBrand" title={data.brand.name}>
          <img className="sidebarLogotype" src={data.brand.logotypeUrl} alt={data.brand.name} />
        </div>}

        <div className="sidebarAccountBar">
          <button type="button" className={`sidebarIdentity${view === 'conta' ? ' active' : ''}`} onClick={() => { setAccountLoading(true); setView('conta') }} title="Abrir minha conta">
            <span className="onlineDot" aria-hidden="true" />
            <div>
              <strong>{session.isMasterAdmin ? 'Admin master' : session.isRepresentative ? 'Representante' : session.role === 'admin' ? 'Administrador' : session.role === 'prestador' ? provider?.name || 'Prestador' : 'Cliente'}</strong>
              <span>Minha conta</span>
            </div>
            <Settings className="accountIndicator" size={16} aria-hidden="true" />
          </button>
          <div className="sidebarQuickActions" aria-label="Ações rápidas">
            <button
              type="button"
              onClick={() => setAppearance(appearance === 'light' ? 'system' : appearance === 'system' ? 'dark' : 'light')}
              title={appearance === 'light' ? 'Tema claro' : appearance === 'dark' ? 'Tema escuro' : 'Tema do sistema'}
              aria-label="Alternar aparência"
            >
              {appearance === 'light' ? <Sun size={18} /> : appearance === 'dark' ? <Moon size={18} /> : <Monitor size={18} />}
            </button>
            <button type="button" onClick={logout} title="Sair" aria-label="Sair da conta">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {session.isRepresentative ? (
          <nav className="nav">
            <button className={view === 'representante' && representativeTab === 'visao-geral' ? 'active' : ''} onClick={() => { setView('representante'); setRepresentativeTab('visao-geral') }}>
              <LayoutDashboard size={18} /> Visão geral
            </button>
            <button className={view === 'representante' && representativeTab === 'carteira' ? 'active' : ''} onClick={() => { setView('representante'); setRepresentativeTab('carteira') }}>
              <Store size={18} /> Minha carteira
            </button>
            <button className={view === 'representante' && representativeTab === 'convites' ? 'active' : ''} onClick={() => { setView('representante'); setRepresentativeTab('convites') }}>
              <Mail size={18} /> Convites
            </button>
          </nav>
        ) : session.role === 'admin' ? (
          <nav className="nav">
            <button className={view === 'admin' ? 'active' : ''} onClick={() => { setView('admin'); setExpandedNavGroup(expandedNavGroup === 'admin' ? null : 'admin') }}>
              <LayoutDashboard size={18} /> Admin
              <ChevronRight size={16} className={`navChevron${expandedNavGroup === 'admin' ? ' open' : ''}`} />
            </button>
            <div className={`navSubList${expandedNavGroup === 'admin' ? ' open' : ''}`}>
            <div className="navSubListInner">
              <button
                className={view === 'admin' && adminTab === 'visao-geral' ? 'active' : ''}
                onClick={() => { setView('admin'); setAdminTab('visao-geral') }}
              >
                Visão geral
              </button>
              <button
                className={view === 'admin' && (adminTab === 'prestadores' || adminTab === 'convites') ? 'active' : ''}
                onClick={() => { setView('admin'); setAdminTab('prestadores') }}
              >
                Prestadores
              </button>
              <button
                className={view === 'admin' && adminTab === 'configuracoes' ? 'active' : ''}
                onClick={() => { setView('admin'); setAdminTab('configuracoes') }}
              >
                Configurações
              </button>
              {session.isMasterAdmin && <button
                className={view === 'admin' && (adminTab === 'representantes' || adminTab === 'visao-projeto') ? 'active' : ''}
                onClick={() => { setView('admin'); setAdminTab('representantes') }}
              >
                Rede de representantes
              </button>}
              <button
                className={view === 'admin' && adminTab === 'privacidade' ? 'active' : ''}
                onClick={() => { setView('admin'); setAdminTab('privacidade') }}
              >
                Privacidade
              </button>
            </div>
            </div>
            <span className="navGroupLabel">Visualizar como</span>
            {session.isMasterAdmin && <>
              <button className={view === 'representante' ? 'active' : ''} onClick={() => { setView('representante'); setExpandedNavGroup(expandedNavGroup === 'representante' ? null : 'representante') }}>
                <Users size={18} /> Representante
                <ChevronRight size={16} className={`navChevron${expandedNavGroup === 'representante' ? ' open' : ''}`} />
              </button>
              <div className={`navSubList${expandedNavGroup === 'representante' ? ' open' : ''}`}>
                <div className="navSubListInner">
                  <button className={view === 'representante' && representativeTab === 'visao-geral' ? 'active' : ''} onClick={() => { setView('representante'); setRepresentativeTab('visao-geral') }}>Visão geral</button>
                  <button className={view === 'representante' && representativeTab === 'carteira' ? 'active' : ''} onClick={() => { setView('representante'); setRepresentativeTab('carteira') }}>Minha carteira</button>
                  <button className={view === 'representante' && representativeTab === 'convites' ? 'active' : ''} onClick={() => { setView('representante'); setRepresentativeTab('convites') }}>Convites</button>
                </div>
              </div>
            </>}
            <button className={view === 'prestador' ? 'active' : ''} onClick={() => { setView('prestador'); setExpandedNavGroup(expandedNavGroup === 'prestador' ? null : 'prestador') }}>
              <Store size={18} /> Prestador
              <ChevronRight size={16} className={`navChevron${expandedNavGroup === 'prestador' ? ' open' : ''}`} />
            </button>
            <div className={`navSubList${expandedNavGroup === 'prestador' ? ' open' : ''}`}>
            <div className="navSubListInner">
              <button
                className={view === 'prestador' && providerTab === 'agenda' ? 'active' : ''}
                onClick={() => { setView('prestador'); setProviderTab('agenda') }}
              >
                Agenda
              </button>
              <button
                className={view === 'prestador' && providerTab === 'servicos' ? 'active' : ''}
                onClick={() => { setView('prestador'); setProviderTab('servicos') }}
              >
                Serviços
              </button>
              <button
                className={view === 'prestador' && providerTab === 'clientes' ? 'active' : ''}
                onClick={() => { setView('prestador'); setProviderTab('clientes') }}
              >
                Clientes
              </button>
              <button
                className={view === 'prestador' && providerTab === 'insights' ? 'active' : ''}
                onClick={() => { setView('prestador'); setProviderTab('insights') }}
              >
                Resumo operacional
              </button>
              <button
                className={view === 'prestador' && providerTab === 'desempenho' ? 'active' : ''}
                onClick={() => { setView('prestador'); setProviderTab('desempenho') }}
              >
                Desempenho da loja
              </button>
              <button
                className={view === 'prestador' && providerTab === 'loja' ? 'active' : ''}
                onClick={() => { setView('prestador'); setProviderTab('loja') }}
              >
                Minha loja
              </button>
            </div>
            </div>
            <button className={view === 'cliente' ? 'active' : ''} onClick={() => { setView('cliente'); setExpandedNavGroup(null) }}>
              <CalendarDays size={18} /> Cliente
            </button>
          </nav>
        ) : session.role === 'prestador' ? (
          <nav className="nav">
            <button className={providerTab === 'agenda' ? 'active' : ''} onClick={() => setProviderTab('agenda')}>
              <CalendarCheck size={18} /> Agenda
            </button>
            <button className={providerTab === 'servicos' ? 'active' : ''} onClick={() => setProviderTab('servicos')}>
              <Store size={18} /> Serviços
            </button>
            <button className={providerTab === 'clientes' ? 'active' : ''} onClick={() => setProviderTab('clientes')}>
              <Users size={18} /> Clientes
            </button>
            <button className={providerTab === 'insights' ? 'active' : ''} onClick={() => setProviderTab('insights')}>
              <LayoutDashboard size={18} /> Resumo
            </button>
            <button className={providerTab === 'desempenho' ? 'active' : ''} onClick={() => setProviderTab('desempenho')}>
              <TrendingUp size={18} /> Desempenho da loja
            </button>
            <button className={providerTab === 'loja' ? 'active' : ''} onClick={() => setProviderTab('loja')}>
              <Store size={18} /> Minha loja
            </button>
          </nav>
        ) : (
          <div className="currentArea"><CalendarDays size={18} /><div><span>Área atual</span><strong>Cliente</strong></div></div>
        )}

      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{view === 'conta' ? 'Conta e segurança' : view === 'admin' ? 'Administração' : view === 'representante' ? 'Acesso delegado' : view === 'prestador' ? provider?.name : publicProviderId ? bookingService?.provider.name : 'Agendamento'}</p>
            <h1 tabIndex="-1">{view === 'conta'
              ? 'Minha conta'
              : view === 'admin'
                ? ({
                    'visao-geral': 'Visão geral da plataforma',
                    prestadores: 'Gestão de prestadores',
                    convites: 'Convites de prestadores',
                    configuracoes: 'Configurações da plataforma',
                    privacidade: 'Privacidade e LGPD',
                    representantes: 'Gestão de representantes',
                  }[adminTab])
                : view === 'representante'
                  ? ({ 'visao-geral': 'Visão geral da carteira', carteira: 'Gestão de prestadores', convites: 'Convites de prestadores' }[representativeTab])
                : view === 'prestador'
                  ? ({
                      agenda: 'Agenda e operação',
                      servicos: 'Catálogo de serviços',
                      clientes: 'Gestão de clientes',
                      desempenho: 'Desempenho da loja',
                      insights: 'Resumo operacional',
                      loja: 'Minha loja',
                    }[providerTab] || 'Agenda e operação')
                  : publicEntryType === 'loja' ? 'Serviços disponíveis' : 'Agendar atendimento'}</h1>
          </div>
          {session.role === 'admin' && !session.isRepresentative && <div className="summary">
            <Stat icon={<Users />} label="Clientes" value={stats.clients} />
            <Stat icon={<Store />} label="Prestadores" value={stats.activeProviders} />
            <Stat icon={<CalendarCheck />} label="Agendamentos" value={stats.bookings} />
          </div>}
        </header>

        {(view === 'prestador' || view === 'representante') && data.announcements.filter((item) => item.active).map((announcement) => (
          <div className="unsavedBanner" key={announcement.id}>
            <Mail size={16} />
            <span><strong>{announcement.title}:</strong> {announcement.message}</span>
          </div>
        ))}

        {view === 'conta' && authUser && <AccountSecurity
          accountLoading={accountLoading}
          accountNotice={accountNotice}
          accountSessions={accountSessions}
          authUser={authUser}
          changeOwnPassword={changeOwnPassword}
          closeOtherSessions={closeOtherSessions}
          closeSelectedSessions={closeSelectedSessions}
          deviceName={deviceName}
          forcedPasswordChange={forcedPasswordChange}
          formatDateTime={formatDateTime}
          loadAccountSessions={loadAccountSessions}
          minPasswordLength={data.settings.minPasswordLength || 8}
          passwordForm={passwordForm}
          passwordRecovery={passwordRecovery}
          session={session}
          setPasswordForm={setPasswordForm}
        />}

        {view === 'representante' && (session.isMasterAdmin || session.isRepresentative) && <RepresentativePreview
          bookings={data.bookings}
          inviteForm={providerInviteForm}
          inviteNotice={providerInviteNotice}
          invites={representativePreviewInvites}
          isMasterPreview={session.isMasterAdmin}
          linkOwner={linkProviderOwner}
          onApprove={approveProvider}
          onCreateInvite={createProviderInvite}
          onOpenProvider={(providerId) => {
            setSelectedProvider(providerId)
            setProviderTab('agenda')
            setView('prestador')
            setExpandedNavGroup('prestador')
          }}
          onSelectRepresentative={setRepresentativePreviewId}
          onToggle={toggleProvider}
          providerClients={data.providerClients}
          providers={representativePreviewProviders}
          representativeId={session.isRepresentative ? authUser?.id || '' : representativePreviewId}
          representatives={representatives}
          setInviteForm={setProviderInviteForm}
          tab={representativeTab}
        />}

        {view === 'cliente' && (
          <section className="grid two">
            <ClientServiceHistory
              entries={clientServiceHistory}
              formatDate={formatDate}
              onRebook={rebookService}
              providerId={publicProviderId}
            />
            {publicProviderId && bookingService && (
              <div
                className={`inviteHero ${bookingService.provider.theme?.style || 'profissional'}`}
                style={{
                  '--accent': bookingService.provider.theme?.accent || data.brand.accent,
                  '--provider-accent': bookingService.provider.theme?.accent,
                  '--provider-bg': bookingService.provider.theme?.background,
                }}
              >
                <div className="inviteLogo">
                  {bookingService.provider.logoUrl ? <img src={bookingService.provider.logoUrl} alt="" /> : <Store size={30} />}
                </div>
                <div>
                  <p className="eyebrow">{publicEntryType === 'loja' ? 'Loja do prestador' : 'Convite de agendamento'}</p>
                  <h2>{publicEntryType === 'loja' ? bookingService.provider.name : bookingService.provider.inviteTitle}</h2>
                  <p>{bookingService.provider.inviteMessage}</p>
                  <strong>{bookingService.provider.firstOffer}</strong>
                  {publicEntryType === 'loja' && (
                    <button
                      className="storeCta"
                      onClick={() => {
                        trackAnalyticsEvent('visualizou_servico', bookingService)
                        trackAnalyticsEvent('iniciou_agendamento', bookingService)
                        window.location.hash = `agendar=${bookingService.provider.slug || bookingService.provider.id}`
                        setPublicEntryType('agendar')
                      }}
                    >
                      Agendar agora
                    </button>
                  )}
                </div>
              </div>
            )}


            {publicEntryType === 'loja' && bookingService && (
              <div className="panel storeFront">
                <div className="chips">
                  {bookingService.provider.highlights.map((highlight) => <span key={highlight}>{highlight}</span>)}
                </div>
                {publicGeneralPhotos.length > 0 && (
                  <div className="publicGallery">
                    {publicGeneralPhotos.map((photo) => (
                      <figure key={photo.id}>
                        <img src={photo.imageBase64} alt="" />
                        {photo.caption && <figcaption>{photo.caption}</figcaption>}
                      </figure>
                    ))}
                  </div>
                )}
                <div className="providerList">
                  {filteredServices.map((item) => {
                    const servicePhoto = publicPhotos.find((photo) => photo.serviceId === item.id)
                    return (
                      <button
                        className="provider serviceCardPublic"
                        key={item.id}
                        onClick={() => {
                          trackAnalyticsEvent('visualizou_servico', item)
                          trackAnalyticsEvent('iniciou_agendamento', item)
                          setBookingForm({ ...bookingForm, serviceId: item.id, resourceId: '' })
                          setSuccessMessage('')
                          window.location.hash = `agendar=${item.provider.slug || item.provider.id}`
                          setPublicEntryType('agendar')
                        }}
                      >
                        {servicePhoto && <img src={servicePhoto.imageBase64} alt="" />}
                        <strong>{item.name}</strong>
                        <span>{item.description || item.provider.category}</span>
                        <small>{formatServiceDuration(item)} • {formatServicePrice(item, item.provider.showPrices)}</small>
                      </button>
                    )
                  })}
                  {filteredServices.length === 0 && <span className="emptyState">Nenhum serviço encontrado.</span>}
                </div>
              </div>
            )}
            {publicEntryType === 'agendar' && <div className="panel">
              <div className="panelHeader">
                <div>
                  <p className="eyebrow">Portal do cliente</p>
                  <h2>{publicProviderId && !storeEntry ? 'Agende seu atendimento' : 'Escolha um serviço'}</h2>
                </div>
                {(!publicProviderId || storeEntry) && (
                  <div className="search">
                    <Search size={17} />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar serviço ou cidade" />
                  </div>
                )}
              </div>

              <div className="providerList">
                {filteredServices.map((item) => (
                  <button
                    className={bookingForm.serviceId === item.id ? 'provider selected' : 'provider'}
                    key={item.id}
                    onClick={() => { trackAnalyticsEvent('visualizou_servico', item); trackAnalyticsEvent('iniciou_agendamento', item); setBookingForm({ ...bookingForm, serviceId: item.id, resourceId: '' }); setSuccessMessage('') }}
                  >
                    <strong>{item.name}</strong>
                    <span>{item.provider.name} • {item.provider.category} • {item.provider.city}</span>
                        <small>{formatServiceDuration(item)} • {formatServicePrice(item, item.provider.showPrices)}</small>
                    <label className="checkLabel cartCheck" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={bookingForm.cartServiceIds.includes(item.id)}
                        onChange={() => toggleCartService(item.id)}
                      />
                      Também tenho interesse
                    </label>
                  </button>
                ))}
                {filteredServices.length === 0 && <span className="emptyState">Nenhum serviço encontrado.</span>}
              </div>
            </div>}

            {publicEntryType === 'agendar' && <form className="panel form" data-booking-form onSubmit={createBooking} onFocusCapture={() => trackAnalyticsEvent('iniciou_agendamento', bookingService)}>
              <div className="panelHeader compact">
                <div>
                  <p className="eyebrow">Novo agendamento</p>
                  <h2>Solicitar horário</h2>
                </div>
                <Clock3 size={22} />
              </div>

              {bookingService && (
                <div className="selectedService">
                  <span>Serviço selecionado</span>
                  <strong>{bookingService.provider.name} • {bookingService.name}</strong>
                  <small>
                    {bookingService.provider.category} • {bookingService.provider.city} • {formatServiceDuration(bookingService)} • {formatServicePrice(bookingService, bookingService.provider.showPrices)}
                  </small>
                </div>
              )}

              {cartServices.length > 0 && (
                <div className="selectedService">
                  <span>Também tem interesse em</span>
                  {cartServices.map((item) => (
                    <strong key={item.id}>{item.name}{item.provider.showPrices ? ` — ${formatServicePrice(item, true)}` : ''}</strong>
                  ))}
                </div>
              )}

              {successMessage && (
                <div className="successNotice">
                  <CheckCircle2 size={18} />
                  <span>{successMessage}</span>
                </div>
              )}

              <label>Nome do cliente
                <input required value={bookingForm.client} onChange={(event) => setBookingForm({ ...bookingForm, client: event.target.value })} />
              </label>
              <label>E-mail ou WhatsApp
                <input
                  required
                  value={bookingForm.contact}
                  onChange={(event) => {
                    const nextContact = event.target.value
                    setBookingForm({
                      ...bookingForm,
                      contact: nextContact,
                      consent: bookingForm.consent || hasExistingConsent(data, bookingService?.providerId, nextContact),
                    })
                  }}
                />
              </label>
              {publicResources.length > 0 && (
                <div className="timePicker">
                  <strong>Com quem</strong>
                  <div>
                    {publicResources.map((resource) => (
                      <button
                        className={bookingForm.resourceId === resource.id ? 'selected' : ''}
                        key={resource.id}
                        onClick={() => setBookingForm({ ...bookingForm, resourceId: resource.id, time: '' })}
                        type="button"
                      >
                        {resource.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="inlineFields">
                <label>Data
                  <input required max={maxBookingDate} min={today} type="date" value={bookingForm.date} onChange={(event) => setBookingForm({ ...bookingForm, date: event.target.value })} />
                </label>
              </div>
              <div className="timePicker">
                <strong>Horário</strong>
                <div>
                  {availableTimes.map((slot) => (
                    <button
                      className={bookingForm.time === slot.time ? 'selected' : ''}
                      disabled={!slot.available}
                      key={slot.time}
                      onClick={() => setBookingForm({ ...bookingForm, time: slot.time })}
                      type="button"
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
              <label>Observações
                <textarea value={bookingForm.notes} onChange={(event) => setBookingForm({ ...bookingForm, notes: event.target.value })} />
              </label>
              {data.settings.requireConsent && (
                <>
                  <label className="checkLabel">
                    <input
                      required
                      type="checkbox"
                      checked={bookingForm.consent}
                      onChange={(event) => setBookingForm({ ...bookingForm, consent: event.target.checked })}
                    />
                    Autorizo o uso do meu nome e contato para gerenciar este atendimento, retornos e comunicações com este prestador.
                  </label>
                  <p className="privacyHint">
                    {hasExistingConsent(data, bookingService?.providerId, bookingForm.contact)
                      ? 'Consentimento já registrado para esse contato com este prestador. Você pode revisar desmarcando a caixa acima.'
                      : 'Seus dados ficam vinculados somente ao prestador deste link. Você pode solicitar acesso ou exclusão pelo canal de privacidade.'}
                  </p>
                </>
              )}
              <button className="primary" type="submit"><Plus size={18} /> Agendar</button>
            </form>}

            {publicEntryType === 'agendar' && data.settings.allowClientPrivacyRequest && (
              <form className="panel privacyPanel" onSubmit={createPrivacyRequest}>
                <div className="panelHeader compact">
                  <div>
                    <p className="eyebrow">Privacidade</p>
                    <h2>Dados do cliente</h2>
                  </div>
                  <Shield size={22} />
                </div>
                <p>
                  Solicite acesso ou exclusão dos seus dados informando o mesmo e-mail ou WhatsApp usado no agendamento.
                </p>
                <input
                  required
                  placeholder="Seu e-mail ou WhatsApp"
                  value={privacyContact}
                  onChange={(event) => setPrivacyContact(event.target.value)}
                />
                {privacyMessage && <small className="privacyMessage">{privacyMessage}</small>}
                <button className="secondaryButton" type="submit">Solicitar privacidade</button>
              </form>
            )}
          </section>
        )}

        {view === 'prestador' && provider && (
          <section className="grid dashboard">
            <div className="panel providerPanel">
              <div className="panelHeader compact">
                <div>
                  <p className="eyebrow">Painel do prestador</p>
                  <h2>{provider.name}</h2>
                </div>
                <select value={selectedProvider} onChange={(event) => setSelectedProvider(event.target.value)}>
                  {data.providers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>

              {providerTab === 'loja' && (
              <>
              <div className="metricGrid">
                <Stat label="Hoje" value={todayBookings} icon={<CalendarDays />} />
                <Stat label="Pendentes" value={pendingBookings} icon={<AlertCircle />} />
                <Stat label="Clientes" value={providerClients.length} icon={<Users />} />
              </div>

              <div className="shareBox">
                <div>
                  <strong>Link de convite de cliente</strong>
                  <span>{getInviteLink(provider)}</span>
                </div>
                <div className="shareActions">
                  {data.settings.allowWhatsAppShare && (
                    <button onClick={() => shareProviderLink(provider)}>
                      Compartilhar
                    </button>
                  )}
                  <button
                    className="secondaryAction"
                    onClick={() => navigator.clipboard.writeText(getInviteLink(provider))}
                  >
                    Copiar link
                  </button>
                </div>
              </div>

              <form className="shareBox" onSubmit={createClientInvite}>
                <div>
                  <strong>Novo convite de cliente</strong>
                  <input
                    placeholder="E-mail ou WhatsApp do cliente"
                    value={clientInviteForm.contact}
                    onChange={(event) => setClientInviteForm({ contact: event.target.value })}
                  />
                  {clientInviteNotice && <span>{clientInviteNotice}</span>}
                </div>
                <div className="shareActions">
                  <button type="submit">Gerar link</button>
                  {clientInviteNotice && (
                    <button type="button" className="secondaryAction" onClick={() => navigator.clipboard.writeText(clientInviteNotice)}>
                      Copiar
                    </button>
                  )}
                </div>
              </form>

              <div className="shareBox">
                <div>
                  <strong>Link da loja</strong>
                  <span>{getStoreLink(provider)}</span>
                </div>
                <div className="shareActions">
                  <button onClick={() => navigator.clipboard.writeText(getStoreLink(provider))}>
                    Copiar loja
                  </button>
                </div>
              </div>

              <div className="inviteEditor">
                {hasUnsavedChanges && (
                  <div className="unsavedBanner">
                    <AlertCircle size={16} />
                    <span>Você tem alterações não salvas nesta página. Clique em "Salvar alterações" para que o cliente veja essas mudanças.</span>
                  </div>
                )}

                <div className="profileTabs" role="tablist" aria-label="Seções do perfil do prestador">
                  <button type="button" className={providerProfileTab === 'identidade' ? 'active' : ''} onClick={() => setProviderProfileTab('identidade')}>Identidade</button>
                  <button type="button" className={providerProfileTab === 'vitrine' ? 'active' : ''} onClick={() => setProviderProfileTab('vitrine')}>Vitrine</button>
                  <button type="button" className={providerProfileTab === 'convite' ? 'active' : ''} onClick={() => setProviderProfileTab('convite')}>Convite</button>
                  <button type="button" className={providerProfileTab === 'recursos' ? 'active' : ''} onClick={() => setProviderProfileTab('recursos')}>Recursos</button>
                </div>

                {providerProfileTab === 'identidade' && (
                  <>
                    <div>
                      <p className="eyebrow">Identidade</p>
                      <h3>Dados do negócio</h3>
                    </div>
                    <div className="inlineFields">
                      <label>Nome do negócio
                        <input
                          value={inviteDraft.name}
                          onChange={(event) => updateInviteDraft(provider.id, 'name', event.target.value)}
                        />
                      </label>
                      <label>Categoria
                        <input
                          value={inviteDraft.category}
                          onChange={(event) => updateInviteDraft(provider.id, 'category', event.target.value)}
                        />
                      </label>
                    </div>
                    <label className="checkLabel">
                      <input
                        type="checkbox"
                        checked={inviteDraft.showPrices}
                        onChange={(event) => updateInviteDraft(provider.id, 'showPrices', event.target.checked)}
                      />
                      Mostrar preços dos serviços na vitrine pública
                    </label>
                    {!inviteDraft.showPrices && (
                      <p className="privacyHint">
                        Com isso desativado, todo serviço aparece como "Sob consulta" pro cliente, mesmo os que têm preço fixo cadastrado — os preços continuam salvos, só não ficam visíveis publicamente.
                      </p>
                    )}
                  </>
                )}

                {providerProfileTab === 'vitrine' && (
                  <>
                    <div>
                      <p className="eyebrow">Vitrine</p>
                      <h3>Sobre o negócio</h3>
                    </div>
                    <label>Conte sua história pro cliente
                      <textarea
                        className="aboutField"
                        placeholder="Fale sobre sua experiência, sua proposta, o que torna seu atendimento diferente. Esse texto aparece na sua página pública, antes dos serviços."
                        value={inviteDraft.about}
                        onChange={(event) => updateInviteDraft(provider.id, 'about', event.target.value)}
                      />
                    </label>

                    <div className="highlightEditor">
                      <div>
                        <p className="eyebrow">Destaques</p>
                        <h3>Chips da vitrine</h3>
                      </div>
                      <div className="chips">
                        {(inviteDraft.highlights || []).map((highlight) => (
                          <button
                            key={highlight}
                            type="button"
                            onClick={() => updateInviteDraft(provider.id, 'highlights', inviteDraft.highlights.filter((item) => item !== highlight))}
                          >
                            {highlight} <Trash2 size={14} />
                          </button>
                        ))}
                      </div>
                      <form
                        className="inlineAdd"
                        onSubmit={(event) => {
                          event.preventDefault()
                          const value = event.currentTarget.elements.highlight.value.trim()
                          if (!value) return
                          updateInviteDraft(provider.id, 'highlights', [...(inviteDraft.highlights || []), value])
                          event.currentTarget.reset()
                        }}
                      >
                        <input name="highlight" maxLength="36" placeholder="Ex.: Atende em domicilio" />
                        <button type="submit">Adicionar</button>
                      </form>
                    </div>
                  </>
                )}

                {providerProfileTab === 'convite' && (
                  <>
                    <div>
                      <p className="eyebrow">Página do convite</p>
                      <h3>Mensagem para o cliente</h3>
                    </div>
                    <div className="logoUploader">
                      <div className="logoPreview">
                        {inviteDraft.logoUrl ? <img src={inviteDraft.logoUrl} alt="" /> : <Store size={26} />}
                      </div>
                      <label>Logo ou imagem da loja
                        <input
                          accept="image/*"
                          type="file"
                          onChange={(event) => uploadProviderLogo(provider.id, event.target.files?.[0])}
                        />
                      </label>
                      {inviteDraft.logoUrl && (
                        <button type="button" onClick={() => updateInviteDraft(provider.id, 'logoUrl', '')}>
                          Remover imagem
                        </button>
                      )}
                    </div>
                    <label>Título do convite
                      <input
                        value={inviteDraft.inviteTitle}
                        onChange={(event) => updateInviteDraft(provider.id, 'inviteTitle', event.target.value)}
                      />
                    </label>
                    <label>Mensagem de boas-vindas
                      <textarea
                        value={inviteDraft.inviteMessage}
                        onChange={(event) => updateInviteDraft(provider.id, 'inviteMessage', event.target.value)}
                      />
                    </label>
                    <label>Proposta do primeiro agendamento
                      <input
                        value={inviteDraft.firstOffer}
                        onChange={(event) => updateInviteDraft(provider.id, 'firstOffer', event.target.value)}
                      />
                    </label>
                    <div className="themeEditor">
                      <label>Cor principal
                        <input
                          type="color"
                          value={inviteDraft.theme?.accent || data.brand.accent}
                          onChange={(event) => updateThemeDraft(provider.id, 'accent', event.target.value)}
                        />
                      </label>
                      <label>Cor de fundo
                        <input
                          type="color"
                          value={inviteDraft.theme?.background || '#111827'}
                          onChange={(event) => updateThemeDraft(provider.id, 'background', event.target.value)}
                        />
                      </label>
                      <label>Estilo
                        <select
                          value={inviteDraft.theme?.style || 'profissional'}
                          onChange={(event) => updateThemeDraft(provider.id, 'style', event.target.value)}
                        >
                          <option value="profissional">Profissional</option>
                          <option value="acolhedor">Acolhedor</option>
                          <option value="premium">Premium</option>
                        </select>
                      </label>
                    </div>
                  </>
                )}

                {providerProfileTab === 'recursos' && (
                  <>
                    <div>
                      <p className="eyebrow">Recursos</p>
                      <h3>Profissionais/salas da loja</h3>
                    </div>
                    <p className="privacyHint">
                      Opcional: se a loja é atendida só por você, não precisa cadastrar nada aqui — a agenda continua sendo 1 só, como sempre foi.
                      Cadastre um recurso pra cada profissional/sala/cadeira que atende de forma independente; o cliente escolherá um deles ao agendar,
                      e a disponibilidade passa a ser calculada por recurso.
                    </p>

                    <div className="serviceList">
                      {providerResources.map((resource) => (
                        <article className="serviceEditor" key={resource.id}>
                          <div className="serviceEditorTop">
                            <label>Nome
                              <input value={resource.name} onChange={(event) => updateProviderResource(resource.id, 'name', event.target.value)} />
                            </label>
                          </div>
                          <label>Bio curta
                            <textarea value={resource.bio} onChange={(event) => updateProviderResource(resource.id, 'bio', event.target.value)} />
                          </label>
                          <div className="serviceActions">
                            <button type="button" onClick={() => updateProviderResource(resource.id, 'active', !resource.active)}>{resource.active ? 'Pausar' : 'Ativar'}</button>
                            <button className="dangerButton" type="button" onClick={() => removeProviderResource(resource.id)}><Trash2 size={16} /> Remover</button>
                          </div>
                        </article>
                      ))}
                      {providerResources.length === 0 && <span className="emptyState">Nenhum recurso cadastrado — a loja funciona com 1 agenda só.</span>}
                    </div>

                    <button className="secondaryButton compactButton" type="button" onClick={createProviderResource}>
                      <Plus size={16} /> Adicionar recurso
                    </button>
                  </>
                )}

                <div className="saveRow">
                  <button type="button" onClick={() => saveInviteDraft(provider.id)}>Salvar alterações</button>
                  {hasUnsavedChanges ? (
                    <span className="unsavedNotice">Alterações não salvas</span>
                  ) : (
                    savedNotice && <span>{savedNotice}</span>
                  )}
                </div>
              </div>
              </>
              )}

              {providerTab === 'agenda' && (
                <div className="providerSection">
                  <div className="sectionTools">
                    <div>
                      <h3>Agenda operacional</h3>
                      <span className="sectionSub">Ocupação do dia: {occupancyRate}% • {occupiedSlots}/{times.length} horários usados</span>
                    </div>
                    <div className="agendaTools">
                      <input type="date" value={agendaDate} onChange={(event) => setAgendaDate(event.target.value)} />
                      {providerResources.length > 0 && (
                        <label className="compactSelect">
                          <Users size={16} />
                          <select value={agendaResource} onChange={(event) => setAgendaResource(event.target.value)}>
                            <option value="todos">Todos os recursos</option>
                            {providerResources.map((resource) => (
                              <option key={resource.id} value={resource.id}>{resource.name}</option>
                            ))}
                          </select>
                        </label>
                      )}
                      <label className="compactSelect">
                        <Filter size={16} />
                        <select value={agendaFilter} onChange={(event) => setAgendaFilter(event.target.value)}>
                          <option value="todos">Todos</option>
                          <option value="pendente">Pendentes</option>
                          <option value="confirmado">Confirmados</option>
                          <option value="concluido">Concluídos</option>
                          <option value="cancelado">Cancelados</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="scheduleBoard">
                    {agendaSlots.map((slot) => (
                      <article className={`slotCard ${slot.status}`} key={slot.time}>
                        <strong>{slot.time}</strong>
                        {slot.booking && (
                          <>
                            <span>{slot.booking.client}</span>
                            <small>{bookingServiceName(slot.booking)} • {slot.booking.status}</small>
                          </>
                        )}
                        {slot.block && (
                          <>
                            <span>{slot.block.reason}</span>
                            <button onClick={() => removeBlockedSlot(slot.block.id)}>Liberar</button>
                          </>
                        )}
                        {!slot.booking && !slot.block && <span>Livre</span>}
                      </article>
                    ))}
                  </div>

                  <form className="blockForm" onSubmit={createBlockedSlot}>
                    <select value={blockForm.time} onChange={(event) => setBlockForm({ ...blockForm, time: event.target.value })}>
                      {times.map((time) => <option key={time}>{time}</option>)}
                    </select>
                    <input placeholder="Motivo do bloqueio" value={blockForm.reason} onChange={(event) => setBlockForm({ ...blockForm, reason: event.target.value })} />
                    <button type="submit">Bloquear horário</button>
                  </form>

                  <div className="appointmentList">
                    {filteredProviderBookings.map((booking) => (
                      <article className="appointment" key={booking.id}>
                        <div>
                          <strong>{booking.client}</strong>
                          <span>
                            {formatDate(booking.date)} às {booking.time} • {bookingServiceName(booking)}
                            {booking.resourceId && ` • ${providerResources.find((resource) => resource.id === booking.resourceId)?.name || 'Recurso removido'}`}
                            {' • '}{booking.contact}
                          </span>
                          <small>{booking.notes || 'Sem observações'}</small>
                          {booking.extraServices && <small>Também tem interesse em: {booking.extraServices}</small>}
                        </div>
                        <div className="statusPills" role="group" aria-label="Status do agendamento">
                          {[
                            { value: 'pendente', label: 'Pendente' },
                            { value: 'confirmado', label: 'Confirmado' },
                            { value: 'concluido', label: 'Concluído' },
                            { value: 'cancelado', label: 'Cancelado' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={`statusPill ${option.value}${booking.status === option.value ? ' active' : ''}`}
                              onClick={() => updateBookingStatus(booking.id, option.value)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </article>
                    ))}
                    {filteredProviderBookings.length === 0 && <span className="emptyState">Nenhum agendamento encontrado para esse filtro.</span>}
                  </div>
                </div>
              )}

              {providerTab === 'servicos' && (
                <div className="providerSection">
                  <div className="sectionTools">
                    <div>
                      <h3>Catalogo de servicos</h3>
                      <span className="sectionSub">Servicos ativos aparecem na busca e na loja publica.</span>
                    </div>
                    <button className="secondaryButton compactButton" type="button" onClick={createProviderService}>
                      <Plus size={16} /> Adicionar servico
                    </button>
                  </div>

                  <div className="serviceList">
                    {providerServices.map((service) => {
                      const servicePhotos = providerPhotos.filter((photo) => photo.serviceId === service.id)
                      return (
                        <article className="serviceEditor" key={service.id}>
                          <div className="serviceEditorTop">
                            <label>Nome
                              <input value={service.name} onChange={(event) => updateProviderService(service.id, 'name', event.target.value)} />
                            </label>
                            <label>Preço
                              <input type="number" min="0" value={service.price} onChange={(event) => updateProviderService(service.id, 'price', Number(event.target.value))} />
                            </label>
                            <label>Modo
                              <select value={service.priceMode} onChange={(event) => updateProviderService(service.id, 'priceMode', event.target.value)}>
                                <option value="fixo">Fixo</option>
                                <option value="a_partir_de">A partir de</option>
                                <option value="sob_consulta">Sob consulta</option>
                              </select>
                            </label>
                            <label>Duração
                              <input type="number" min="0" placeholder="Variável" value={service.duration || ''} onChange={(event) => updateProviderService(service.id, 'duration', event.target.value ? Number(event.target.value) : null)} />
                            </label>
                          </div>
                          <label>Descrição
                            <textarea value={service.description} onChange={(event) => updateProviderService(service.id, 'description', event.target.value)} />
                          </label>
                          <div className="serviceActions">
                            <button type="button" onClick={() => moveProviderService(service.id, -1)}><ArrowUp size={16} /> Subir</button>
                            <button type="button" onClick={() => moveProviderService(service.id, 1)}><ArrowDown size={16} /> Descer</button>
                            <button type="button" onClick={() => updateProviderService(service.id, 'active', !service.active)}>{service.active ? 'Pausar' : 'Ativar'}</button>
                            <button className="dangerButton" type="button" onClick={() => removeProviderService(service.id)}><Trash2 size={16} /> Remover</button>
                          </div>
                          <div className="photoStrip">
                            {servicePhotos.map((photo) => (
                              <div className="photoTile" key={photo.id}>
                                <img src={photo.imageBase64} alt="" />
                                <input placeholder="Legenda" value={photo.caption} onChange={(event) => updatePortfolioPhotoCaption(photo.id, event.target.value)} />
                                <button type="button" onClick={() => removePortfolioPhoto(photo.id)}><Trash2 size={14} /></button>
                              </div>
                            ))}
                            <label className="photoUpload"><Image size={18} /> Foto do servico
                              <input accept="image/*" type="file" onChange={(event) => uploadPortfolioPhoto(service.id, event.target.files?.[0])} />
                            </label>
                          </div>
                        </article>
                      )
                    })}
                  </div>

                  <div className="serviceEditor">
                    <div className="sectionTools">
                      <div>
                        <h3>Fotos gerais</h3>
                        <span className="sectionSub">Aparecem como galeria da loja do prestador.</span>
                      </div>
                      <label className="photoUpload inlineUpload"><Image size={18} /> Adicionar foto
                        <input accept="image/*" type="file" onChange={(event) => uploadPortfolioPhoto(null, event.target.files?.[0])} />
                      </label>
                    </div>
                    <div className="photoStrip">
                      {providerPhotos.filter((photo) => !photo.serviceId).map((photo) => (
                        <div className="photoTile" key={photo.id}>
                          <img src={photo.imageBase64} alt="" />
                          <input placeholder="Legenda" value={photo.caption} onChange={(event) => updatePortfolioPhotoCaption(photo.id, event.target.value)} />
                          <button type="button" onClick={() => removePortfolioPhoto(photo.id)}><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {providerTab === 'clientes' && (
                <div className="providerSection">
                  <div className="sectionTools">
                    <h3>Gestão de clientes</h3>
                    <div className="clientTools">
                      <div className="search">
                        <Search size={17} />
                        <input value={clientSearch} onChange={(event) => setClientSearch(event.target.value)} placeholder="Buscar cliente" />
                      </div>
                      <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
                        <option value="todos">Todos</option>
                        <option value="Ativo">Ativos</option>
                        <option value="Atenção">Atenção</option>
                        <option value="Sem retorno">Sem retorno</option>
                        <option value="Sem atendimento">Sem atendimento</option>
                      </select>
                    </div>
                  </div>
                  <div className="clientList">
                    {filteredManagedClients.map((client) => (
                      <article className="clientRow" key={client.id}>
                        <div>
                          <strong>{client.name}</strong>
                          <span>{client.contact}</span>
                        </div>
                        <div className="clientHealth">
                          <strong className={`health ${client.relationshipStatus.toLowerCase().replace(' ', '-')}`}>
                            {client.relationshipStatus}
                          </strong>
                          <span>
                            {client.lastVisit
                              ? `Último atendimento há ${client.inactiveDays} dia(s)`
                              : 'Ainda sem atendimento confirmado'}
                          </span>
                          <small>{client.visits} atendimento(s) registrados</small>
                        </div>
                        <button
                          className="contactAction"
                          onClick={() => window.open(buildWhatsAppLink(client, provider), '_blank', 'noopener,noreferrer')}
                        >
                          <MessageCircle size={16} /> Recontatar
                        </button>
                      </article>
                    ))}
                    {filteredManagedClients.length === 0 && <span className="emptyState">Nenhum cliente encontrado para esse filtro.</span>}
                  </div>
                </div>
              )}

              {providerTab === 'insights' && (
                <OperationalSummary
                  clientsWithoutReturn={clientsWithoutReturn}
                  completedBookings={completedBookings}
                  currency={currency}
                  providerConsultationBookings={providerConsultationBookings}
                  providerRevenue={providerRevenue}
                />
              )}

              {providerTab === 'desempenho' && (
                <StorePerformance
                  analyticsDays={analyticsDays}
                  bookingStarts={bookingStarts}
                  funnelConversion={funnelConversion}
                  generatedBookings={generatedBookings}
                  providerServiceAnalytics={providerServiceAnalytics}
                  serviceViews={serviceViews}
                  setAnalyticsDays={setAnalyticsDays}
                  startConversion={startConversion}
                  uniqueVisitors={uniqueVisitors}
                />
              )}
            </div>
          </section>
        )}

        {view === 'admin' && (
          <section className="adminWorkspace">
            {adminTab === 'visao-geral' && <div className="adminOverview">
              <div className="metricGrid adminMetrics">
                <Stat label="Prestadores" value={stats.providers} icon={<Store />} />
                <Stat label="Prestadores ativos" value={stats.activeProviders} icon={<CheckCircle2 />} />
                <Stat label="Clientes" value={data.clients.length} icon={<Users />} />
                <Stat label="Pedidos LGPD" value={openPrivacyRequests} icon={<Shield />} />
              </div>
              <div className="adminOverviewGrid">
                <div className="panel">
                  <div className="panelHeader compact">
                    <div><p className="eyebrow">Ações necessárias</p><h2>Pendências da gestão</h2></div>
                    <AlertCircle size={22} />
                  </div>
                  <div className="managementActions">
                    <button type="button" onClick={() => setAdminTab('prestadores')}><span><strong>Prestadores aguardando análise</strong><small>Revise e libere novos cadastros</small></span><strong>{data.providers.filter((item) => item.approvalStatus === 'analise').length}</strong></button>
                    <button type="button" onClick={() => setAdminTab('privacidade')}><span><strong>Solicitações de privacidade</strong><small>Acompanhe pedidos ainda abertos</small></span><strong>{openPrivacyRequests}</strong></button>
                    <button type="button" onClick={() => setAdminTab('convites')}><span><strong>Convidar novo prestador</strong><small>Gere um acesso controlado</small></span><Plus size={20} /></button>
                  </div>
                </div>
                <div className="panel">
                  <div className="panelHeader compact">
                    <div><p className="eyebrow">Operação</p><h2>Políticas ativas</h2></div>
                    <ShieldCheck size={22} />
                  </div>
                  <div className="parameterSummary overviewSummary">
                    <span>Cadastro: {data.settings.allowProviderSelfSignup ? 'aberto' : 'somente por convite'}</span>
                    <span>Aprovação: {data.settings.approvalMode === 'manual' ? 'manual' : 'automática'}</span>
                    <span>Agenda: até {data.settings.maxAdvanceDays} dias</span>
                    <span>Taxa: {data.settings.platformFeePercent}%</span>
                  </div>
                  <button type="button" className="secondaryAction overviewAction" onClick={() => setAdminTab('configuracoes')}>Revisar configurações</button>
                </div>
              </div>
            </div>}

            {(adminTab === 'prestadores' || adminTab === 'convites') && <div className="panel adminSectionPanel">
              <div className="panelHeader compact">
                <div>
                  <p className="eyebrow">Gestão admin</p>
                  <h2>{adminTab === 'prestadores' ? 'Prestadores cadastrados' : 'Convites de prestador'}</h2>
                </div>
                {adminTab === 'prestadores' ? <Store size={22} /> : <Mail size={22} />}
              </div>

              <div className="profileTabs" role="tablist" aria-label="Seções de prestadores">
                <button type="button" className={adminTab === 'prestadores' ? 'active' : ''} onClick={() => setAdminTab('prestadores')}>Cadastrados</button>
                <button type="button" className={adminTab === 'convites' ? 'active' : ''} onClick={() => setAdminTab('convites')}>Convites</button>
              </div>

              {adminTab === 'prestadores' && <div className="metricGrid">
                <Stat label="Total" value={stats.providers} icon={<Store />} />
                <Stat label="Ativos" value={stats.activeProviders} icon={<CheckCircle2 />} />
                <Stat label="LGPD abertas" value={openPrivacyRequests} icon={<Shield />} />
              </div>}

              {adminTab === 'convites' && (
                <>
                  <form className="shareBox" onSubmit={createProviderInvite}>
                    <div>
                      <strong>Convidar prestador</strong>
                      <input
                        type="email"
                        placeholder="email@prestador.com.br"
                        value={providerInviteForm.email}
                        onChange={(event) => setProviderInviteForm({ email: event.target.value })}
                        required
                      />
                      {providerInviteNotice && <span>{providerInviteNotice}</span>}
                    </div>
                    <div className="shareActions">
                      <button type="submit">Gerar link</button>
                      {providerInviteNotice && providerInviteNotice.startsWith('http') && (
                        <button type="button" className="secondaryAction" onClick={() => navigator.clipboard.writeText(providerInviteNotice)}>
                          Copiar
                        </button>
                      )}
                    </div>
                  </form>
                  <p className="privacyHint">
                    Gera um link único pra essa pessoa se cadastrar como prestador. Não envia e-mail sozinho — copie e mande você mesmo (WhatsApp, e-mail, etc.).
                  </p>
                  <div className="requestList">
                    {data.providerInvites.filter((invite) => invite.status === 'ativo').map((invite) => (
                      <article className="requestRow" key={invite.id}>
                        <div><strong>{invite.invitedEmail}</strong><span>Convite de prestador aguardando aceite</span></div>
                        <div className="shareActions">
                          <small>Ativo</small>
                          <button type="button" className="secondaryAction" onClick={() => navigator.clipboard.writeText(getProviderInviteLink(invite))}>Copiar link</button>
                        </div>
                      </article>
                    ))}
                    {data.providerInvites.filter((invite) => invite.status === 'ativo').length === 0 && (
                      <span className="emptyState">Nenhum convite de prestador pendente.</span>
                    )}
                  </div>
                </>
              )}

              {adminTab === 'prestadores' && <div className="providerRows">
                {data.providers.map((item) => (
                  <ProviderManagementRow
                    key={item.id}
                    isMasterAdmin={session.isMasterAdmin}
                    linkOwner={linkProviderOwner}
                    onApprove={approveProvider}
                    onOpen={(providerId) => {
                      setSelectedProvider(providerId)
                      setProviderTab('agenda')
                      setView('prestador')
                      setExpandedNavGroup('prestador')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                      window.setTimeout(() => document.querySelector('.topbar h1')?.focus(), 0)
                    }}
                    onProvisionOwner={provisionProviderOwner}
                    onToggle={toggleProvider}
                    onTransfer={transferProvider}
                    provider={item}
                    representatives={representatives}
                  />
                ))}
                {data.providers.length === 0 && <span className="emptyState">Nenhum prestador cadastrado.</span>}
              </div>}
            </div>}

            {adminTab === 'configuracoes' && <div className="adminSettingsGrid singleColumn">
            <div className="profileTabs" role="tablist" aria-label="Seções de configurações">
              <button type="button" className={configSubTab === 'marca' ? 'active' : ''} onClick={() => setConfigSubTab('marca')}>Marca</button>
              <button type="button" className={configSubTab === 'operacao' ? 'active' : ''} onClick={() => setConfigSubTab('operacao')}>Operação</button>
              {session.isMasterAdmin && <button type="button" className={configSubTab === 'seguranca' ? 'active' : ''} onClick={() => setConfigSubTab('seguranca')}>Segurança</button>}
              {session.isMasterAdmin && <button type="button" className={configSubTab === 'comunicacao' ? 'active' : ''} onClick={() => setConfigSubTab('comunicacao')}>Comunicação</button>}
            </div>

            {configSubTab === 'marca' && (
            <div className="panel form">
              <div className="panelHeader compact">
                <div>
                  <p className="eyebrow">Personalização</p>
                  <h2>Marca da plataforma</h2>
                </div>
                <Palette size={22} />
              </div>

              <label>Nome da plataforma
                <input value={data.brand.name} onChange={(event) => updateBrand('name', event.target.value)} />
              </label>
              <div className="logoUploader">
                <div className="logoPreview">
                  {data.brand.logoUrl ? <img src={data.brand.logoUrl} alt="" /> : <CalendarCheck size={26} />}
                </div>
                <label>Logo (ícone)
                  <input accept="image/*" type="file" onChange={(event) => uploadBrandLogo(event.target.files?.[0])} />
                </label>
                {data.brand.logoUrl && (
                  <button type="button" onClick={() => updateBrand('logoUrl', '')}>
                    Remover imagem
                  </button>
                )}
              </div>
              <p className="privacyHint">Ícone compacto — usado no distintivo do sidebar/login e no favicon da aba do navegador.</p>
              <div className="logoUploader">
                <div className="logoPreview">
                  {data.brand.logotypeUrl ? <img src={data.brand.logotypeUrl} alt="" /> : <CalendarCheck size={26} />}
                </div>
                <label>Logotipo (marca completa)
                  <input accept="image/*" type="file" onChange={(event) => uploadBrandLogotype(event.target.files?.[0])} />
                </label>
                {data.brand.logotypeUrl && (
                  <button type="button" onClick={() => updateBrand('logotypeUrl', '')}>
                    Remover imagem
                  </button>
                )}
              </div>
              <p className="privacyHint">Marca completa — usada em espaços maiores, como a tela de login.</p>
              <label>Tamanho da logomarca no menu
                <div className="brandSizeInput">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={data.brand.logotypeSize || 64}
                    onChange={(event) => updateBrand('logotypeSize', Number(event.target.value))}
                  />
                  <span>px</span>
                </div>
              </label>
              <label>Cor principal
                <input type="color" value={data.brand.accent} onChange={(event) => updateBrand('accent', event.target.value)} />
              </label>
              <label>E-mail de privacidade
                <input value={data.brand.privacyEmail} onChange={(event) => updateBrand('privacyEmail', event.target.value)} />
              </label>
              <p className="privacyHint">
                Novos prestadores solicitam cadastro pela tela inicial. O admin revisa e aprova antes de liberar agenda e link público.
              </p>
            </div>
            )}

            {configSubTab === 'operacao' && (
            <div className="panel settingsPanel">
              <div className="panelHeader compact">
                <div>
                  <p className="eyebrow">Parâmetros</p>
                  <h2>Operação da plataforma</h2>
                </div>
                <Settings size={22} />
              </div>

              <div className="settingsGrid">
                <label>Cadastro de prestador
                  <select value={data.settings.allowProviderSelfSignup ? 'aberto' : 'fechado'} onChange={(event) => updateSetting('allowProviderSelfSignup', event.target.value === 'aberto')}>
                    <option value="aberto">Auto cadastro aberto</option>
                    <option value="fechado">Auto cadastro fechado</option>
                  </select>
                </label>
                <label>Aprovação
                  <select value={data.settings.approvalMode} onChange={(event) => updateSetting('approvalMode', event.target.value)}>
                    <option value="manual">Manual pelo admin</option>
                    <option value="automatico">Automática</option>
                  </select>
                </label>
                <label>Antecedência mínima em horas
                  <input type="number" min="0" value={data.settings.minLeadHours} onChange={(event) => updateSetting('minLeadHours', Number(event.target.value))} />
                </label>
                <label>Agenda aberta por dias
                  <input type="number" min="1" value={data.settings.maxAdvanceDays} onChange={(event) => updateSetting('maxAdvanceDays', Number(event.target.value))} />
                </label>
                <label>Alerta de atenção em dias
                  <input type="number" min="1" value={data.settings.returnAlertDays} onChange={(event) => updateSetting('returnAlertDays', Number(event.target.value))} />
                </label>
                <label>Sem retorno em dias
                  <input type="number" min="1" value={data.settings.inactiveAlertDays} onChange={(event) => updateSetting('inactiveAlertDays', Number(event.target.value))} />
                </label>
                <label>Janela de cancelamento em horas
                  <input type="number" min="0" value={data.settings.cancellationWindowHours} onChange={(event) => updateSetting('cancellationWindowHours', Number(event.target.value))} />
                </label>
                <label>Taxa da plataforma em %
                  <input type="number" min="0" value={data.settings.platformFeePercent} onChange={(event) => updateSetting('platformFeePercent', Number(event.target.value))} />
                </label>
              </div>

              <div className="policySwitches">
                <label className="checkLabel">
                  <input type="checkbox" checked={data.settings.requireConsent} onChange={(event) => updateSetting('requireConsent', event.target.checked)} />
                  Exigir consentimento no agendamento
                </label>
                <label className="checkLabel">
                  <input type="checkbox" checked={data.settings.allowClientPrivacyRequest} onChange={(event) => updateSetting('allowClientPrivacyRequest', event.target.checked)} />
                  Permitir solicitação de privacidade pelo cliente
                </label>
                <label className="checkLabel">
                  <input type="checkbox" checked={data.settings.allowWhatsAppShare} onChange={(event) => updateSetting('allowWhatsAppShare', event.target.checked)} />
                  Permitir compartilhamento via WhatsApp/nativo
                </label>
              </div>
            </div>
            )}

            {configSubTab === 'seguranca' && session.isMasterAdmin && (
            <div className="panel settingsPanel">
              <div className="panelHeader compact">
                <div>
                  <p className="eyebrow">Acesso</p>
                  <h2>Segurança</h2>
                </div>
                <LockKeyhole size={22} />
              </div>
              <div className="settingsGrid">
                <label>Tamanho mínimo de senha (caracteres)
                  <input type="number" min="8" max="64" value={data.settings.minPasswordLength} onChange={(event) => updateSetting('minPasswordLength', Number(event.target.value))} />
                </label>
              </div>
              <p className="privacyHint">
                Vale pra troca de senha (própria conta e primeiro acesso) e é o tamanho usado ao gerar senhas temporárias pelo admin — senhas temporárias nunca ficam abaixo de 12 caracteres, mesmo que o mínimo aqui seja menor.
              </p>
              <p className="privacyHint">
                Pra definir ou redefinir a senha de uma conta específica (representante ou prestador), use o botão "Definir senha"/"Criar acesso" na linha da conta, nas abas Prestadores ou Rede de representantes.
              </p>
            </div>
            )}

            {configSubTab === 'comunicacao' && session.isMasterAdmin && (
            <div className="panel form">
              <div className="panelHeader compact">
                <div>
                  <p className="eyebrow">Comunicação</p>
                  <h2>Comunicados internos</h2>
                </div>
                <Mail size={22} />
              </div>
              <p className="privacyHint">
                Aparece como aviso no painel de todos os prestadores (e representantes) quando eles acessam a conta. Não é visível pro cliente público.
              </p>
              <form
                className="nestedForm"
                onSubmit={(event) => {
                  event.preventDefault()
                  createAnnouncement(announcementForm.title, announcementForm.message)
                  setAnnouncementForm({ title: '', message: '' })
                }}
              >
                <label>Título
                  <input required value={announcementForm.title} onChange={(event) => setAnnouncementForm({ ...announcementForm, title: event.target.value })} />
                </label>
                <label>Mensagem
                  <textarea required value={announcementForm.message} onChange={(event) => setAnnouncementForm({ ...announcementForm, message: event.target.value })} />
                </label>
                <button type="submit">Publicar comunicado</button>
              </form>
              <div className="requestList">
                {data.announcements.map((announcement) => (
                  <article className="requestRow" key={announcement.id}>
                    <div>
                      <strong>{announcement.title}</strong>
                      <span>{announcement.message}</span>
                    </div>
                    <div className="shareActions">
                      <button type="button" className={announcement.active ? 'toggle on' : 'toggle'} onClick={() => toggleAnnouncement(announcement.id)}>
                        {announcement.active ? 'Ativo' : 'Pausado'}
                      </button>
                      <button type="button" className="dangerButton" onClick={() => removeAnnouncement(announcement.id)}><Trash2 size={16} /></button>
                    </div>
                  </article>
                ))}
                {data.announcements.length === 0 && <span className="emptyState">Nenhum comunicado publicado.</span>}
              </div>

              <div className="emailDeliverySettings">
                <div className="panelHeader compact">
                  <div><p className="eyebrow">E-mail transacional</p><h3>Envio de convite de representante</h3></div>
                  <Mail size={20} />
                </div>
                <p className="privacyHint">
                  Vale só pro convite de representante (aba Rede de representantes). Convite de prestador e de cliente não enviam e-mail — geram link pra você copiar e mandar manualmente.
                </p>
                <div className="settingsGrid">
                  <label>Nome do remetente
                    <input value={data.settings.inviteSenderName} onChange={(event) => updateSetting('inviteSenderName', event.target.value)} />
                  </label>
                  <label>E-mail remetente
                    <input type="email" placeholder="convites@seudominio.com" value={data.settings.inviteSenderEmail} onChange={(event) => updateSetting('inviteSenderEmail', event.target.value)} />
                  </label>
                  <label>E-mail para respostas
                    <input type="email" placeholder="contato@seudominio.com" value={data.settings.inviteReplyToEmail} onChange={(event) => updateSetting('inviteReplyToEmail', event.target.value)} />
                  </label>
                </div>
                <div className="emailDeliveryFooter">
                  <label className="checkLabel"><input type="checkbox" checked={data.settings.inviteEmailEnabled} onChange={(event) => updateSetting('inviteEmailEnabled', event.target.checked)} /> Envio automático</label>
                  <span className={`emailConnectionStatus${inviteEmailConnection.configured ? ' connected' : ''}`}>
                    {inviteEmailConnection.checked ? inviteEmailConnection.configured ? 'Conectado' : 'Não conectado' : 'Não verificado'}
                  </span>
                  <button type="button" className="secondaryAction" onClick={checkInviteEmailConnection}>Verificar conexão</button>
                </div>
              </div>
            </div>
            )}
            </div>}

            {(adminTab === 'representantes' || adminTab === 'visao-projeto') && session.isMasterAdmin && (
              <div className="profileTabs" role="tablist" aria-label="Seções de rede de representantes">
                <button type="button" className={adminTab === 'representantes' ? 'active' : ''} onClick={() => setAdminTab('representantes')}>Contas</button>
                <button type="button" className={adminTab === 'visao-projeto' ? 'active' : ''} onClick={() => setAdminTab('visao-projeto')}>Atribuições</button>
              </div>
            )}

            {adminTab === 'representantes' && session.isMasterAdmin && <div className="panel adminSectionPanel">
              <div className="panelHeader compact">
                <div><p className="eyebrow">Acesso delegado</p><h2>Representantes</h2></div>
                <Users size={22} />
              </div>
              <form className="shareBox" onSubmit={createRepresentativeInvite}>
                <div>
                  <strong>Convidar representante</strong>
                  <input type="email" required placeholder="E-mail do representante" value={representativeEmail} onChange={(event) => setRepresentativeEmail(event.target.value)} />
                  {representativeNotice && <span>{representativeNotice}</span>}
                  {representativeDeliveryNotice && <span>{representativeDeliveryNotice}</span>}
                </div>
                <div className="shareActions">
                  <button type="submit">Gerar e enviar</button>
                  {representativeInviteLink && <button type="button" className="secondaryAction" onClick={() => navigator.clipboard.writeText(representativeInviteLink)}>Copiar link</button>}
                </div>
              </form>
              {passwordProvisionNotice && <div className="requestRow" role="status">
                <div><strong>{passwordProvisionNotice.email}</strong><span>Senha temporária: <code>{passwordProvisionNotice.tempPassword}</code> — repasse ao usuário; ele deverá trocá-la no primeiro acesso.</span></div>
                <div className="shareActions">
                  <button type="button" className="secondaryAction" onClick={() => navigator.clipboard.writeText(passwordProvisionNotice.tempPassword)}>Copiar senha</button>
                  <button type="button" className="secondaryAction" onClick={() => setPasswordProvisionNotice(null)}>Fechar</button>
                </div>
              </div>}
              <div className="providerRows">
                {representatives.map((representative) => {
                  const security = representativeSecurity[representative.user_id]
                  const securityHint = security?.mustChangePassword
                    ? 'aguardando troca de senha'
                    : security && !security.lastSignInAt
                      ? 'nunca acessou'
                      : ''
                  return <article className="providerRow" key={representative.user_id}>
                  <div><strong>{representative.email}</strong><span>Representante • {representative.status}{securityHint ? ` • ${securityHint}` : ''}</span></div>
                  <div className="shareActions">
                    <button type="button" className="secondaryAction" disabled={Boolean(provisioningTarget)} onClick={() => resetRepresentativePassword(representative)}>{provisioningTarget === representative.user_id ? 'Salvando...' : 'Definir senha'}</button>
                    <button type="button" className={representative.status === 'ativo' ? 'toggle on' : 'toggle'} onClick={() => changeRepresentativeStatus(representative)}>
                      {representative.status === 'ativo' ? 'Ativo' : 'Suspenso'}
                    </button>
                  </div>
                </article>
                })}
                {representatives.length === 0 && <span className="emptyState">Nenhum representante aceitou um convite.</span>}
              </div>
              {representativeInvites.some((invite) => invite.status === 'ativo') && <div className="requestList">
                {representativeInvites.filter((invite) => invite.status === 'ativo').map((invite) => <article className="requestRow" key={invite.id}>
                  <div><strong>{invite.invited_email}</strong><span>Convite aguardando aceite</span></div>
                  <div className="shareActions">
                    <small>Ativo</small>
                    <button type="button" className="secondaryAction" onClick={() => copyRepresentativeInviteLink(invite)}>Copiar link</button>
                    <button type="button" className="secondaryAction" disabled={Boolean(provisioningTarget)} onClick={() => provisionRepresentativeInvite(invite)}>{provisioningTarget === invite.id ? 'Salvando...' : 'Criar acesso direto'}</button>
                  </div>
                </article>)}
              </div>}
            </div>}

            {adminTab === 'visao-projeto' && session.isMasterAdmin && <div className="panel adminSectionPanel">
              <div className="panelHeader compact">
                <div><p className="eyebrow">Panorama</p><h2>Visão do projeto</h2></div>
                <LayoutDashboard size={22} />
              </div>
              <p className="privacyHint">
                Quem gerencia cada loja na plataforma, agrupado por representante. A aparência/portfólio de cada loja continua sendo configurada
                pelo próprio prestador em "Minha loja". Pra trocar o responsável por uma loja, use o campo "Responsável" na aba Prestadores.
              </p>
              <div className="metricGrid">
                <Stat label="Prestadores" value={data.providers.length} icon={<Store />} />
                <Stat label="Representantes ativos" value={representatives.filter((representative) => representative.status === 'ativo').length} icon={<Users />} />
                <Stat label="Sem representante" value={data.providers.filter((item) => !item.representativeUserId).length} icon={<AlertCircle />} />
              </div>

              {representatives.map((representative) => {
                const managedProviders = data.providers.filter((item) => item.representativeUserId === representative.user_id)
                return (
                  <div key={representative.user_id}>
                    <h3>{representative.email} <small>({managedProviders.length} loja{managedProviders.length === 1 ? '' : 's'})</small></h3>
                    <div className="providerRows">
                      {managedProviders.map((item) => (
                        <article className="providerRow" key={item.id}>
                          <div><strong>{item.name}</strong><span>{item.category} • {item.city}</span></div>
                        </article>
                      ))}
                      {managedProviders.length === 0 && <span className="emptyState">Nenhuma loja atribuída a esse representante.</span>}
                    </div>
                  </div>
                )
              })}

              <div>
                <h3>Sem representante (direto com admin)</h3>
                <div className="providerRows">
                  {data.providers.filter((item) => !item.representativeUserId).map((item) => (
                    <article className="providerRow" key={item.id}>
                      <div><strong>{item.name}</strong><span>{item.category} • {item.city}</span></div>
                    </article>
                  ))}
                  {data.providers.filter((item) => !item.representativeUserId).length === 0 && <span className="emptyState">Todas as lojas têm representante.</span>}
                </div>
              </div>
            </div>}

            {adminTab === 'privacidade' && <div className="panel governancePanel adminSectionPanel">
              <div className="panelHeader compact">
                <div>
                  <p className="eyebrow">Governança</p>
                  <h2>LGPD e dados</h2>
                </div>
                <ShieldCheck size={22} />
              </div>
              <div className="metricGrid">
                <Stat label="Clientes globais" value={data.clients.length} icon={<Users />} />
                <Stat label="Vínculos" value={data.providerClients.length} icon={<Store />} />
                <Stat label="Pedidos abertos" value={openPrivacyRequests} icon={<AlertCircle />} />
              </div>
              <div className="parameterSummary">
                <span>Consentimento no agendamento: {data.settings.requireConsent ? 'obrigatório' : 'opcional'}</span>
                <span>Solicitação de privacidade pelo cliente: {data.settings.allowClientPrivacyRequest ? 'permitida' : 'desativada'}</span>
                <span>E-mail de privacidade: {data.brand.privacyEmail}</span>
              </div>
              <p className="privacyHint">
                Esses switches são editados em Configurações ? Operação. Aqui é só o acompanhamento dos pedidos.
              </p>
              <div className="requestList">
                {data.privacyRequests.map((request) => (
                  <article className="requestRow" key={request.id}>
                    <div>
                      <strong>{request.contact}</strong>
                      <span>{formatDate(request.createdAt.slice(0, 10))} • {request.type.replaceAll('_', ' ')}</span>
                    </div>
                    <small>{request.status}</small>
                  </article>
                ))}
                {data.privacyRequests.length === 0 && <span className="emptyText">Nenhuma solicitação registrada.</span>}
              </div>
            </div>}
          </section>
        )}
      </section>
    </main>
  )
}

export default App
