'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  PenSquare, 
  FileCheck, 
  Users, 
  Share2,
  LogOut,
  Menu,
  X,
  Calendar,
  BarChart3,
  Settings,
  LayoutTemplate,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { UserRole } from '@/types'

interface SidebarProps {
  userRole: UserRole
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const mainNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'user'] },
    { name: 'Calendrier', href: '/calendar', icon: Calendar, roles: ['admin', 'manager', 'user'] },
    { name: 'Statistiques', href: '/statistiques', icon: BarChart3, roles: ['admin', 'manager', 'user'] },
    { name: 'Templates', href: '/templates', icon: LayoutTemplate, roles: ['admin', 'manager', 'user'] },
    { name: 'Avis Google', href: '/avis', icon: Star, roles: ['admin', 'manager', 'user'] },
    { name: 'Créer un post', href: '/posts/new', icon: PenSquare, roles: ['admin', 'manager', 'user'] },
    { name: 'Mes posts', href: '/posts', icon: FileCheck, roles: ['admin', 'manager', 'user'] },
    { name: 'Validation', href: '/validation', icon: FileCheck, roles: ['admin', 'manager'] },
    { name: 'Comptes sociaux', href: '/admin/social-accounts', icon: Share2, roles: ['admin'] },
  ]

  const bottomNavigation = [
    { name: 'Utilisateurs', href: '/admin/users', icon: Users, roles: ['admin'] },
    { name: 'Réglages', href: '/admin/settings', icon: Settings, roles: ['admin'] },
  ]

  const filteredMainNavigation = mainNavigation.filter(item => 
    item.roles.includes(userRole)
  )

  const filteredBottomNavigation = bottomNavigation.filter(item => 
    item.roles.includes(userRole)
  )

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b">
            <span className="text-xl font-bold text-primary">Carmen Social</span>
          </div>

          {/* Navigation principale */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {filteredMainNavigation.map((item) => {
              // Logique plus précise pour éviter que /posts/new active aussi /posts
              let isActive = false
              if (item.href === '/posts') {
                // Pour "Mes posts", on veut que ce soit actif seulement si on est exactement sur /posts ou /posts/[id] mais pas /posts/new
                isActive = pathname === '/posts' || (pathname.startsWith('/posts/') && !pathname.startsWith('/posts/new'))
              } else {
                // Pour les autres, on utilise la logique normale
                isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              }
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Navigation bas (Utilisateurs, Réglages) + Logout */}
          <div className="border-t">
            {filteredBottomNavigation.length > 0 && (
              <nav className="px-4 py-2 space-y-1">
                {filteredBottomNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            )}
            <div className="p-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-600"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
