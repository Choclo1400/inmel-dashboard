"use client"

import React, { createContext, useContext } from 'react'
import type { AppRole } from '@/config/nav'

type RoleContextValue = { role: AppRole | null; userId: string | null }

const RoleContext = createContext<RoleContextValue>({ role: null, userId: null })

export function RoleProvider({ value, children }: { value: RoleContextValue; children: React.ReactNode }) {
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  return useContext(RoleContext)
}
