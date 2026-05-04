'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/lib/api'

export function PlanMenuLoader() {
  const { user, setAllowedMenus } = useAuthStore()

  useEffect(() => {
    if (!user) return
    api.get('/companies/me/plan')
      .then((res) => {
        const menus = res.data?.data?.allowedMenus
        if (Array.isArray(menus) && menus.length > 0) {
          setAllowedMenus(menus)
        }
      })
      .catch(() => {/* silent — fallback to show all menus */})
  }, [user?.id])

  return null
}
