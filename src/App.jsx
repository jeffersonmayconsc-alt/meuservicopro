import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Filter,
  Image,
  LayoutDashboard,
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
import './App.css'

const times = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']

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
}

const BRAND_COLUMN_MAP = {
  name: 'brand_name',
  accent: 'brand_accent',
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
    client: row.client,
    contact: row.contact,
    date: row.date,
    time: row.time,
    status: row.status,
    notes: row.notes,
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

async function optionalSelect(table) {
  const { data, error } = await supabase.from(table).select('*')
  if (error) {
    console.warn(`Tabela opcional indisponivel: ${table}`, error.message)
    return []
  }
  return data || []
}

async function fetchInitialData() {
  const [settingsRes, providersRes, providerServicesRes, bookingsRes, clientsRes, providerClientsRes, blockedSlotsRes, privacyRequestsRes] =
    await Promise.all([
      supabase.from('platform_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('providers').select('*'),
      supabase.from('provider_services').select('*'),
      supabase.from('bookings').select('*'),
      supabase.from('clients').select('*'),
      supabase.from('provider_clients').select('*'),
      supabase.from('blocked_slots').select('*'),
      supabase.from('privacy_requests').select('*'),
    ])

  const failed = [settingsRes, providersRes, providerServicesRes, bookingsRes, clientsRes, providerClientsRes, blockedSlotsRes, privacyRequestsRes].find(
    (res) => res.error,
  )
  if (failed) throw failed.error

  const { brand, settings } = mapPlatformSettingsRow(settingsRes.data)

  return {
    brand,
    settings,
    providers: providersRes.data.map(mapProviderRow),
    providerServices: providerServicesRes.data.map(mapProviderServiceRow),
    portfolioPhotos: [],
    bookings: bookingsRes.data.map(mapBookingRow),
    clients: clientsRes.data.map(mapClientRow),
    providerClients: providerClientsRes.data.map(mapProviderClientRow),
    blockedSlots: blockedSlotsRes.data.map(mapBlockedSlotRow),
    privacyRequests: privacyRequestsRes.data.map(mapPrivacyRequestRow),
    providerInvites: (await optionalSelect('provider_invites')).map(mapProviderInviteRow),
    clientInvites: (await optionalSelect('client_invites')).map(mapClientInviteRow),
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

function formatServicePrice(service) {
  if (!service) return ''
  if (service.priceMode === 'sob_consulta') return 'Sob consulta'
  if (service.priceMode === 'a_partir_de') return 'A partir de ' + currency(service.price)
  return currency(service.price)
}

function formatServiceDuration(service) {
  return service?.duration ? service.duration + ' min' : 'Duracao variavel'
}

function serviceWithProvider(service, providers) {
  const provider = providers.find((item) => item.id === service.providerId)
  return provider ? { ...service, provider } : null
}

function App() {
  const [appearance, setAppearance] = useState(() => localStorage.getItem('agenda-appearance') || 'system')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginForm, setLoginForm] = useState({ email: 'demo@meuservicopro.com.br', password: '123456' })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [session, setSession] = useState(null)
  const [publicProviderId, setPublicProviderId] = useState(null)
  const [publicEntryType, setPublicEntryType] = useState('agendar')
  const [view, setView] = useState('cliente')
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [query, setQuery] = useState('')
  const [providerTab, setProviderTab] = useState('agenda')
  const [agendaFilter, setAgendaFilter] = useState('todos')
  const [agendaDate, setAgendaDate] = useState(new Date().toISOString().slice(0, 10))
  const [clientFilter, setClientFilter] = useState('todos')
  const [clientSearch, setClientSearch] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [privacyContact, setPrivacyContact] = useState('')
  const [privacyMessage, setPrivacyMessage] = useState('')
  const [blockForm, setBlockForm] = useState({ time: '11:00', reason: '' })
  const [inviteDrafts, setInviteDrafts] = useState({})
  const [loadedPortfolioProviders, setLoadedPortfolioProviders] = useState({})
  const [savedNotice, setSavedNotice] = useState('')
  const [bookingForm, setBookingForm] = useState({
    serviceId: '',
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
  const [providerInviteToken, setProviderInviteToken] = useState(null)
  const [clientInviteToken, setClientInviteToken] = useState(null)

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
        setBookingForm((current) => ({
          ...current,
          serviceId: currentData.providerServices.find((service) => service.providerId === invitedProvider.id && service.active)?.id || '',
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
    setBookingForm((current) => ({
      ...current,
      serviceId: currentData.providerServices.find((service) => service.providerId === linkedProvider.id && service.active)?.id || '',
    }))
    return true
  }

  useEffect(() => {
    let cancelled = false

    fetchInitialData()
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
    if (!data) return
    const handlePublicRoute = () => resolvePublicRoute(data)
    window.addEventListener('hashchange', handlePublicRoute)
    return () => window.removeEventListener('hashchange', handlePublicRoute)
  }, [data])

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
  const provider = data ? data.providers.find((item) => item.id === selectedProvider) || data.providers[0] : null
  const providerServices = data && provider
    ? data.providerServices
        .filter((service) => service.providerId === provider.id)
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
  const agendaDayBookings = providerBookings.filter((booking) => booking.date === agendaDate)
  const agendaDayBlocks = providerBlockedSlots.filter((slot) => slot.date === agendaDate)
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
  const nextBookings = providerBookings.filter((booking) => booking.date >= today && booking.status !== 'cancelado').slice(0, 4)
  const availableTimes = data
    ? times.map((time) => {
        const selectedBookingService = data.providerServices.find((service) => service.id === bookingForm.serviceId)
        const eligibleProviders = selectedBookingService
          ? activeProviders.filter((item) => item.id === selectedBookingService.providerId)
          : []
        const hasProviderAvailable = eligibleProviders.some(
          (item) =>
            !data.blockedSlots.some(
              (slot) => slot.providerId === item.id && slot.date === bookingForm.date && slot.time === time,
            ) &&
            !data.bookings.some(
              (booking) =>
                booking.providerId === item.id &&
                booking.date === bookingForm.date &&
                booking.time === time &&
                booking.status !== 'cancelado',
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

  const createBooking = async (event) => {
    event.preventDefault()
    const selectedBookingService = data.providerServices.find((service) => service.id === bookingForm.serviceId)
    const eligibleProviders = selectedBookingService
      ? activeProviders.filter((item) => item.id === selectedBookingService.providerId)
      : []
    const availableProvider = eligibleProviders.find(
      (item) =>
        !data.blockedSlots.some(
          (slot) =>
            slot.providerId === item.id &&
            slot.date === bookingForm.date &&
            slot.time === bookingForm.time,
        ) &&
        !data.bookings.some((booking) =>
          booking.providerId === item.id &&
        booking.date === bookingForm.date &&
        booking.time === bookingForm.time &&
        booking.status !== 'cancelado',
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
          providerId: availableProvider.id,
          status: 'pendente',
        },
      ],
    }))

    setBookingForm({ ...bookingForm, client: '', contact: '', notes: '', consent: false })
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
    updateData((current) => ({
      ...current,
      providers: current.providers.map((item) =>
        item.id === id ? { ...item, active: true, approvalStatus: 'aprovado' } : item,
      ),
    }))
    const { error } = await supabase.from('providers').update({ active: true, approval_status: 'aprovado' }).eq('id', id)
    if (error) alert('Não foi possível aprovar esse prestador no banco de dados. Tente novamente.')
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

    updateData((current) => ({
      ...current,
      providers: current.providers.map((item) =>
        item.id === id
          ? {
              ...item,
              active: nextActive,
              approvalStatus: nextApprovalStatus,
            }
          : item,
      ),
    }))
    const { error } = await supabase
      .from('providers')
      .update({ active: nextActive, approval_status: nextApprovalStatus })
      .eq('id', id)
    if (error) alert('Não foi possível salvar essa alteração no banco de dados. Tente novamente.')
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

  const getProviderInviteLink = (invite) => `${window.location.origin}${window.location.pathname}#prestador=${invite.token}`

  const createProviderInvite = async (event) => {
    event.preventDefault()
    const nowIso = new Date().toISOString()
    const invite = {
      id: crypto.randomUUID(),
      token: tokenValue(),
      createdByAdmin: 'admin-demo',
      invitedEmail: providerInviteForm.email.trim().toLowerCase(),
      status: 'ativo',
      expiresAt: null,
      usedByProviderId: null,
      usedAt: null,
      createdAt: nowIso,
    }

    updateData((current) => ({ ...current, providerInvites: [invite, ...current.providerInvites] }))
    setProviderInviteForm({ email: '' })
    setProviderInviteNotice(getProviderInviteLink(invite))

    const { error } = await supabase.from('provider_invites').insert({
      id: invite.id,
      token: invite.token,
      created_by_admin: invite.createdByAdmin,
      invited_email: invite.invitedEmail,
      status: invite.status,
      expires_at: invite.expiresAt,
      created_at: invite.createdAt,
    })
    if (error) setProviderInviteNotice('Convite criado na tela, mas a tabela provider_invites ainda precisa ser criada no Supabase.')
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

  const login = (role, providerId = 'p1') => {
    window.history.replaceState(null, '', window.location.pathname)
    setPublicProviderId(null)
    setPublicEntryType('agendar')
    setSession({ role, providerId })
    setSelectedProvider(providerId)
    setView(role === 'admin' ? 'admin' : role)
    setProviderTab('agenda')
  }

  const submitLogin = (event) => {
    event.preventDefault()
    setLoginError('')
    if (!loginForm.email.includes('@') || loginForm.password.length < 6) {
      setLoginError('Informe um e-mail válido e uma senha com pelo menos 6 caracteres.')
      return
    }
    const email = loginForm.email.trim().toLowerCase()
    const role = email.startsWith('admin@') ? 'admin' : email.startsWith('cliente@') ? 'cliente' : 'prestador'
    login(role, role === 'prestador' ? selectedProvider : undefined)
  }

  const logout = () => {
    window.history.replaceState(null, '', window.location.pathname)
    setPublicProviderId(null)
    setPublicEntryType('agendar')
    setSession(null)
    setView('cliente')
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
    return (
      <main className="loginShell" style={{ '--accent': data.brand.accent }}>
        <section className="loginPanel">
          <aside className="loginContext">
            <div className="brand loginBrand">
              <div className="brandMark"><CalendarCheck size={20} /></div>
              <div><strong>{data.brand.name}</strong><span>Gestão de agenda</span></div>
            </div>
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

            <form className="loginForm" onSubmit={submitLogin}>
              <label>E-mail
                <div className="fieldWithIcon"><Mail size={18} /><input type="email" autoComplete="username" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} placeholder="voce@empresa.com.br" /></div>
              </label>
              <label>Senha
                <div className="fieldWithIcon"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} placeholder="Sua senha" /><button type="button" onClick={() => setShowPassword((current) => !current)} title={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
              </label>
              <div className="loginOptions"><label className="remember"><input type="checkbox" defaultChecked /> Lembrar meu acesso</label><button type="button" className="textButton">Esqueci minha senha</button></div>
              {loginError && <div className="loginError" role="alert"><AlertCircle size={17} />{loginError}</div>}
              <button className="primary loginSubmit" type="submit">Entrar</button>
              <p className="demoCredentials">Ambiente demonstrativo: as credenciais já estão preenchidas.</p>
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
    return (
      <main
        className="publicStorefront"
        style={{
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
                    window.location.hash = `agendar=${activeProvider.slug || activeProvider.id}`
                    setPublicEntryType('agendar')
                  }}
                >
                  Agendar agora
                </button>
              )}
            </div>
          </div>

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
                        setBookingForm({ ...bookingForm, serviceId: item.id })
                        window.location.hash = `agendar=${item.provider.slug || item.provider.id}`
                        setPublicEntryType('agendar')
                      }}
                    >
                      {servicePhoto && <img src={servicePhoto.imageBase64} alt="" />}
                      <strong>{item.name}</strong>
                      <span>{item.description || item.provider.category}</span>
                      <small>{formatServiceDuration(item)} • {formatServicePrice(item)}</small>
                    </button>
                  )
                })}
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
                    onClick={() => setBookingForm({ ...bookingForm, serviceId: item.id })}
                  >
                    <strong>{item.name}</strong>
                    <span>{item.description || activeProvider.category}</span>
                    <small>{formatServiceDuration(item)} • {formatServicePrice(item)}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {publicEntryType === 'agendar' && (
            <form className="panel form" onSubmit={createBooking}>
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
                    {formatServiceDuration(bookingService)} • {formatServicePrice(bookingService)}
                  </small>
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
                <input required value={bookingForm.contact} onChange={(event) => setBookingForm({ ...bookingForm, contact: event.target.value })} />
              </label>
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
                    Seus dados ficam vinculados somente ao prestador deste link. Você pode solicitar acesso ou exclusão pelo canal de privacidade.
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

  return (
    <main className="shell" style={{ '--accent': data.brand.accent }}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark"><CalendarCheck size={20} /></div>
          <div>
            <strong>{data.brand.name}</strong>
            <span>Gestão de atendimentos</span>
          </div>
        </div>

        {session.role === 'admin' ? (
          <nav className="nav">
            <>
              <button className={view === 'admin' ? 'active' : ''} onClick={() => setView('admin')}>
                <LayoutDashboard size={18} /> Admin
              </button>
              <button className={view === 'prestador' ? 'active' : ''} onClick={() => setView('prestador')}>
                <Store size={18} /> Ver prestador
              </button>
              <button className={view === 'cliente' ? 'active' : ''} onClick={() => setView('cliente')}>
                <CalendarDays size={18} /> Ver cliente
              </button>
            </>
          </nav>
        ) : (
          <div className="currentArea">{session.role === 'prestador' ? <Store size={18} /> : <CalendarDays size={18} />}<div><span>Área atual</span><strong>{session.role === 'prestador' ? provider?.name : 'Cliente'}</strong></div></div>
        )}

        <div className="sidebarAppearance">
          <span>Aparência</span>
          {appearanceControl}
        </div>

        <div className="statusBox">
          <CheckCircle2 size={18} />
          <div>
            <strong>Ambiente de teste</strong>
            <span>Dados e acessos para homologação.</span>
          </div>
        </div>

        <button className="logout" onClick={logout}>Sair</button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{view === 'admin' ? 'Administração' : view === 'prestador' ? provider?.name : publicProviderId ? bookingService?.provider.name : 'Agendamento'}</p>
            <h1>{view === 'admin' ? 'Visão geral da plataforma' : view === 'prestador' ? 'Agenda e operação' : publicEntryType === 'loja' ? 'Serviços disponíveis' : 'Agendar atendimento'}</h1>
          </div>
          {session.role === 'admin' && <div className="summary">
            <Stat icon={<Users />} label="Clientes" value={stats.clients} />
            <Stat icon={<Store />} label="Prestadores" value={stats.activeProviders} />
            <Stat icon={<CalendarCheck />} label="Agendamentos" value={stats.bookings} />
          </div>}
        </header>

        {view === 'cliente' && (
          <section className="grid two">
            {publicProviderId && bookingService && (
              <div
                className={`inviteHero ${bookingService.provider.theme?.style || 'profissional'}`}
                style={{
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
                          setBookingForm({ ...bookingForm, serviceId: item.id })
                          window.location.hash = `agendar=${item.provider.slug || item.provider.id}`
                          setPublicEntryType('agendar')
                        }}
                      >
                        {servicePhoto && <img src={servicePhoto.imageBase64} alt="" />}
                        <strong>{item.name}</strong>
                        <span>{item.description || item.provider.category}</span>
                        <small>{formatServiceDuration(item)} • {formatServicePrice(item)}</small>
                      </button>
                    )
                  })}
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
                    onClick={() => setBookingForm({ ...bookingForm, serviceId: item.id })}
                  >
                    <strong>{item.name}</strong>
                    <span>{item.provider.name} • {item.provider.category} • {item.provider.city}</span>
                        <small>{formatServiceDuration(item)} • {formatServicePrice(item)}</small>
                  </button>
                ))}
              </div>
            </div>}

            {publicEntryType === 'agendar' && <form className="panel form" onSubmit={createBooking}>
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
                    {bookingService.provider.category} • {bookingService.provider.city} • {formatServiceDuration(bookingService)} • {formatServicePrice(bookingService)}
                  </small>
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
                <input required value={bookingForm.contact} onChange={(event) => setBookingForm({ ...bookingForm, contact: event.target.value })} />
              </label>
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
                    Seus dados ficam vinculados somente ao prestador deste link. Você pode solicitar acesso ou exclusão pelo canal de privacidade.
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
                <div className="saveRow">
                  <button type="button" onClick={() => saveInviteDraft(provider.id)}>Salvar alterações</button>
                  {hasUnsavedChanges ? (
                    <span className="unsavedNotice">Alterações não salvas</span>
                  ) : (
                    savedNotice && <span>{savedNotice}</span>
                  )}
                </div>
              </div>

              <div className="tabs">
                <button className={providerTab === 'agenda' ? 'active' : ''} onClick={() => setProviderTab('agenda')}>
                  <CalendarCheck size={17} /> Agenda
                </button>
                <button className={providerTab === 'servicos' ? 'active' : ''} onClick={() => setProviderTab('servicos')}>
                  <Store size={17} /> Servicos
                </button>
                <button className={providerTab === 'clientes' ? 'active' : ''} onClick={() => setProviderTab('clientes')}>
                  <Users size={17} /> Clientes
                </button>
                <button className={providerTab === 'insights' ? 'active' : ''} onClick={() => setProviderTab('insights')}>
                  <TrendingUp size={17} /> Insights
                </button>
              </div>

              {providerTab === 'agenda' && (
                <div className="providerSection">
                  <div className="sectionTools">
                    <div>
                      <h3>Agenda operacional</h3>
                      <span className="sectionSub">Ocupação do dia: {occupancyRate}% • {occupiedSlots}/{times.length} horários usados</span>
                    </div>
                    <div className="agendaTools">
                      <input type="date" value={agendaDate} onChange={(event) => setAgendaDate(event.target.value)} />
                      <label className="compactSelect">
                        <Filter size={16} />
                        <select value={agendaFilter} onChange={(event) => setAgendaFilter(event.target.value)}>
                          <option value="todos">Todos</option>
                          <option value="pendente">Pendentes</option>
                          <option value="confirmado">Confirmados</option>
                  <Stat label="Concluidos" value={completedBookings} icon={<CheckCircle2 />} />
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
                          <span>{formatDate(booking.date)} às {booking.time} • {bookingServiceName(booking)} • {booking.contact}</span>
                          <small>{booking.notes || 'Sem observações'}</small>
                        </div>
                        <select value={booking.status} onChange={(event) => updateBookingStatus(booking.id, event.target.value)}>
                          <option value="pendente">Pendente</option>
                          <option value="confirmado">Confirmado</option>
                          <option value="concluido">Concluído</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </article>
                    ))}
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
                            <label>Preco
                              <input type="number" min="0" value={service.price} onChange={(event) => updateProviderService(service.id, 'price', Number(event.target.value))} />
                            </label>
                            <label>Modo
                              <select value={service.priceMode} onChange={(event) => updateProviderService(service.id, 'priceMode', event.target.value)}>
                                <option value="fixo">Fixo</option>
                                <option value="a_partir_de">A partir de</option>
                                <option value="sob_consulta">Sob consulta</option>
                              </select>
                            </label>
                            <label>Duracao
                              <input type="number" min="0" placeholder="Variavel" value={service.duration || ''} onChange={(event) => updateProviderService(service.id, 'duration', event.target.value ? Number(event.target.value) : null)} />
                            </label>
                          </div>
                          <label>Descricao
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
                          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Olá, ${client.name}! Vamos agendar seu próximo atendimento? ${getInviteLink(provider)}`)}`, '_blank', 'noopener,noreferrer')}
                        >
                          <MessageCircle size={16} /> Recontatar
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {providerTab === 'insights' && (
                <div className="insightGrid">
                  <Stat label="Receita estimada" value={currency(providerRevenue)} icon={<Store />} />
                  <Stat label="Sob consulta" value={providerConsultationBookings} icon={<AlertCircle />} />
                  <Stat label="Concluidos" value={completedBookings} icon={<CheckCircle2 />} />
                  <Stat label="Sem retorno" value={clientsWithoutReturn} icon={<Clock3 />} />
                  <div className="insightPanel">
                    <h3>Proximos atendimentos</h3>
                    {nextBookings.map((booking) => (
                      <span key={booking.id}>{formatDate(booking.date)} as {booking.time} • {bookingServiceName(booking)} • {booking.client}</span>
                    ))}
                    {nextBookings.length === 0 && <span>Nenhum atendimento futuro encontrado.</span>}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {view === 'admin' && (
          <section className="grid two">
            <div className="panel">
              <div className="panelHeader compact">
                <div>
                  <p className="eyebrow">Gestão admin</p>
                  <h2>Prestadores cadastrados</h2>
                </div>
                <Settings size={22} />
              </div>

              <div className="metricGrid">
                <Stat label="Total" value={stats.providers} icon={<Store />} />
                <Stat label="Ativos" value={stats.activeProviders} icon={<CheckCircle2 />} />
                <Stat label="LGPD abertas" value={openPrivacyRequests} icon={<Shield />} />
              </div>

              <form className="shareBox" onSubmit={createProviderInvite}>
                <div>
                  <strong>Convite de prestador</strong>
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

              <div className="providerRows">
                {data.providers.map((item) => (
                  <article className="providerRow" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.owner} • {item.category} • {item.city} • {item.approvalStatus}</span>
                    </div>
                    {item.approvalStatus === 'analise' ? (
                      <button className="toggle review" onClick={() => approveProvider(item.id)}>Aprovar</button>
                    ) : (
                      <button className={item.active ? 'toggle on' : 'toggle'} onClick={() => toggleProvider(item.id)}>
                        {item.active ? 'Ativo' : 'Pausado'}
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </div>

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

            <div className="panel settingsPanel">
              <div className="panelHeader compact">
                <div>
                  <p className="eyebrow">Parâmetros</p>
                  <h2>Regras da plataforma</h2>
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

            <div className="panel governancePanel">
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
                <span>Cadastro: {data.settings.allowProviderSelfSignup ? 'aberto' : 'fechado'}</span>
                <span>Aprovação: {data.settings.approvalMode === 'manual' ? 'manual' : 'automática'}</span>
                <span>Agenda: até {data.settings.maxAdvanceDays} dias</span>
                <span>Retorno: {data.settings.returnAlertDays}/{data.settings.inactiveAlertDays} dias</span>
              </div>
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
            </div>
          </section>
        )}
      </section>
    </main>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat">
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  )
}

export default App
