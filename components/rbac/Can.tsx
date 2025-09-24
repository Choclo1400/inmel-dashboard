"use client"

import React from 'react'
import type { AppRole } from '@/config/nav'
import { useRole } from './RoleProvider'

export function Can({ roles, children }: { roles: AppRole[]; children: React.ReactNode }) {
  const { role } = useRole()
  if (!role || !roles.includes(role)) return null
  return <>{children}</>
}
