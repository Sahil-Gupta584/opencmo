import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from '@tanstack/react-router'
import {
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
  Avatar,
  Button,
} from '@heroui/react'
import { useQuery } from '@tanstack/react-query'
import { orpc } from '#/lib/orpc'
import { authClient } from '#/lib/auth-client'
import { getActiveProjectId, setActiveProjectId } from '#/lib/active-project'
import { Brand } from '#/components/Brand'
import {
  RiInboxLine,
  RiSendPlaneLine,
  RiRedditLine,
  RiSettingsLine,
  RiMenuLine,
  RiCloseLine,
  RiBellLine,
  RiAddLine,
  RiArrowDownSLine,
  RiFlashlightLine,
  RiLogoutBoxLine,
  RiDashboardLine,
  RiNotification3Line,
} from 'react-icons/ri'
import { useState, useMemo, useEffect } from 'react'

export const Route = createFileRoute('/_protected/dashboard')({
  component: DashboardLayout,
})

function getFaviconUrl(url?: string) {
  if (!url) return null
  try {
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return null
  }
}

function ProductLogo({ url, name, size = 'sm' }: { url?: string; name?: string; size?: 'sm' | 'md' }) {
  const [imgError, setImgError] = useState(false)
  const favicon = getFaviconUrl(url)
  const dimensions = size === 'md' ? 'h-7 w-7' : 'h-6 w-6 text-[10px]'

  if (favicon && !imgError) {
    return (
      <img
        src={favicon}
        alt={name ?? 'Product'}
        onError={() => setImgError(true)}
        className={`${dimensions} shrink-0 rounded-md object-cover`}
      />
    )
  }

  return (
    <div className={`flex ${dimensions} shrink-0 items-center justify-center rounded-md bg-coral font-bold text-white shadow-sm`}>
      {(name?.[0] ?? 'P').toUpperCase()}
    </div>
  )
}

function DashboardLayout() {
  const navigate = useNavigate()
  const { user } = Route.useRouteContext()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(getActiveProjectId())

  // Fetch all user projects
  const { data: projects = [], isLoading } = useQuery({
    ...orpc.listProjects.queryOptions(),
    staleTime: 0,
  })

  // Validate or set active project ID
  useEffect(() => {
    if (isLoading) return

    if (projects.length === 0) {
      if (!pathname.endsWith('/new')) {
        void navigate({ to: '/new', replace: true })
      }
      return
    }

    const currentCachedId = getActiveProjectId()
    const validProject = projects.find((p) => p.id === currentCachedId)

    if (validProject) {
      setSelectedProjectId(validProject.id)
    } else {
      // If 404 or missing, set to first project
      const fallbackId = projects[0].id
      setActiveProjectId(fallbackId)
      setSelectedProjectId(fallbackId)
    }
  }, [isLoading, projects, pathname, navigate])

  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) ?? projects[0]
  }, [projects, selectedProjectId])

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId)
    setSelectedProjectId(projectId)
  }

  const NAV_ITEMS = [
    { label: 'Inbounds', to: '/dashboard/inbounds', icon: RiInboxLine },
    { label: 'Outbound', to: '/dashboard/outbound', icon: RiSendPlaneLine },
    { label: 'Subreddits', to: '/dashboard/subreddits', icon: RiRedditLine },
    { label: 'Mentions', to: '/dashboard/mentions', icon: RiBellLine },
    { label: 'Alerts', to: '/dashboard/alerts', icon: RiNotification3Line },
    { label: 'Settings', to: '/dashboard/settings', icon: RiSettingsLine },
  ] as const

  const handleSignOut = async () => {
    await authClient.signOut()
    void navigate({ to: '/login', search: {} })
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : (user?.email?.[0] ?? 'U').toUpperCase()

  const displayName = user?.name ?? user?.email ?? 'User'

  // Get current active tab name for top bar breadcrumb
  const currentNav = NAV_ITEMS.find((item) => pathname.includes(item.label.toLowerCase()))
  const pageTitle = pathname.endsWith('/new') ? 'Add New Product' : currentNav ? currentNav.label : 'Dashboard'

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-card border-r border-line shadow-[0_0_0_1px_rgba(255,255,255,0.5)]">
      {/* 1. App Brand Logo (Very Top Left) */}
      <div className="flex h-[56px] items-center px-4">
        <Brand to="/dashboard" size="sm" />
      </div>

      {/* 2. Product Dropdown Switcher */}
      <div className="p-3">
        <Dropdown placement="bottom-start" classNames={{ content: 'w-56 p-1' }}>
          <DropdownTrigger>
            <button className="flex w-full items-center justify-between gap-2.5 rounded-xl border border-line bg-card/80 px-3 py-2 text-left transition hover:border-coral/40 hover:bg-card focus:outline-none cursor-pointer control-outline">
              <div className="flex items-center gap-2.5 min-w-0">
                <ProductLogo url={activeProject?.url ?? undefined} name={activeProject?.name} size="md" />
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-ink truncate leading-tight">
                    {activeProject ? activeProject.name : 'Loading...'}
                  </span>
                </div>
              </div>
              <RiArrowDownSLine className="text-faint shrink-0 text-sm" />
            </button>
          </DropdownTrigger>

          <DropdownMenu aria-label="Product switcher" variant="flat">
            <DropdownSection title="Your Products" showDivider>
              {projects.map((p) => (
                <DropdownItem
                  key={p.id}
                  onPress={() => handleSelectProject(p.id)}
                  startContent={<ProductLogo url={p.url ?? undefined} name={p.name} size="sm" />}
                  className={p.id === activeProject?.id ? 'bg-coral/10 text-coral-dark font-semibold' : ''}
                >
                  {p.name}
                </DropdownItem>
              ))}
            </DropdownSection>
            <DropdownSection>
              <DropdownItem
                key="add-new"
                onPress={() => void navigate({ to: '/new' })}
                startContent={<RiAddLine className="text-coral text-base" />}
                className="text-coral font-semibold"
              >
                Add New Product
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* 3. Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => {
          const isActive = pathname.includes(label.toLowerCase())
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 no-underline',
                isActive
                  ? 'bg-coral/10 text-coral-dark font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]'
                  : 'text-muted hover:bg-sand hover:text-ink',
              ].join(' ')}
            >
              <Icon className={['text-lg shrink-0', isActive ? 'text-coral' : 'text-faint'].join(' ')} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* 4. Bottom Upgrade Card */}
      <div className="p-3 border-t border-line">
        <Link to="/pricing">
          <Button
            size="sm"
            color="primary"
            variant="flat"
            fullWidth
            startContent={<RiFlashlightLine className="text-sm" />}
            className="font-semibold text-xs justify-start"
          >
            {user?.plan === 'PRO' ? 'Pro Plan Active' : 'Upgrade Plan'}
          </Button>
        </Link>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-sand">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-sand">
      {/* ── Desktop sidebar (Full height 100vh from top:0) ─────────────────── */}
      <aside className="hidden md:flex w-[230px] shrink-0 flex-col h-full z-20">
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar overlay ────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[230px] z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main area (To the right of sidebar) ───────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-[56px] items-center justify-between border-b border-line bg-card px-6 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden rounded-lg p-1.5 text-muted hover:bg-sand transition"
            >
              {mobileOpen ? <RiCloseLine className="text-xl" /> : <RiMenuLine className="text-xl" />}
            </button>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">{pageTitle}</span>
            </div>
          </div>

          {/* Right Header Actions & User Profile Dropdown */}
          <div className="flex items-center gap-3">
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <button className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-sand focus:outline-none">
                  <Avatar
                    src={user?.image ?? undefined}
                    name={initials}
                    size="sm"
                    classNames={{
                      base: 'shrink-0 bg-coral/15',
                      name: 'text-coral-dark text-xs font-bold',
                    }}
                  />
                  <span className="hidden sm:inline text-sm font-medium text-ink max-w-[140px] truncate">
                    {displayName}
                  </span>
                  <RiArrowDownSLine className="text-faint text-sm" />
                </button>
              </DropdownTrigger>

              <DropdownMenu aria-label="User account menu" variant="flat" classNames={{ base: 'w-56' }}>
                <DropdownSection showDivider>
                  <DropdownItem key="identity" isReadOnly className="cursor-default opacity-100">
                    <div className="flex items-center gap-2.5 py-1">
                      <Avatar src={user?.image ?? undefined} name={initials} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-ink">{displayName}</p>
                        <p className="truncate text-[11px] text-faint">{user?.email}</p>
                      </div>
                    </div>
                  </DropdownItem>
                </DropdownSection>

                <DropdownSection showDivider>
                  <DropdownItem
                    key="all-products"
                    startContent={<RiDashboardLine className="text-base text-muted" />}
                    onPress={() => void navigate({ to: '/dashboard' })}
                  >
                    All Products
                  </DropdownItem>
                  <DropdownItem
                    key="settings"
                    startContent={<RiSettingsLine className="text-base text-muted" />}
                    onPress={() => void navigate({ to: '/dashboard/settings' })}
                  >
                    Settings
                  </DropdownItem>
                </DropdownSection>

                <DropdownSection>
                  <DropdownItem
                    key="signout"
                    color="danger"
                    startContent={<RiLogoutBoxLine className="text-base" />}
                    onPress={handleSignOut}
                  >
                    Log out
                  </DropdownItem>
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
