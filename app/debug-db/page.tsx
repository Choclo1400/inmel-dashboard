"use client"

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function DatabaseDebugPage() {
  const [results, setResults] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function checkDatabase() {
      const logs: string[] = []
      
      logs.push('🔍 VERIFICANDO ESTRUCTURA DE BASE DE DATOS...')
      
      // Verificar tabla 'users'
      logs.push('📋 Probando tabla "users":')
      try {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .limit(1)
        
        if (!usersError) {
          logs.push('✅ Tabla "users" existe')
          if (usersData && usersData.length > 0) {
            logs.push(`📄 Campos disponibles en "users": ${Object.keys(usersData[0]).join(', ')}`)
          } else {
            logs.push('📄 Tabla "users" está vacía')
          }
        } else {
          logs.push(`❌ Tabla "users" NO existe: ${usersError.message}`)
        }
      } catch (e: any) {
        logs.push(`❌ Error consultando "users": ${e.message}`)
      }

      logs.push('')
      logs.push('📋 Probando tabla "profiles":')
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
        
        if (!profilesError) {
          logs.push('✅ Tabla "profiles" existe')
          if (profilesData && profilesData.length > 0) {
            logs.push(`📄 Campos disponibles en "profiles": ${Object.keys(profilesData[0]).join(', ')}`)
          } else {
            logs.push('📄 Tabla "profiles" está vacía')
          }
        } else {
          logs.push(`❌ Tabla "profiles" NO existe: ${profilesError.message}`)
        }
      } catch (e: any) {
        logs.push(`❌ Error consultando "profiles": ${e.message}`)
      }

      // Probar consulta de usuario autenticado
      logs.push('')
      logs.push('🔐 Verificando usuario autenticado:')
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) {
          logs.push(`❌ No hay usuario autenticado: ${authError.message}`)
        } else if (user) {
          logs.push(`✅ Usuario autenticado encontrado: ${user.email} ID: ${user.id}`)
        } else {
          logs.push('❌ No hay usuario autenticado')
        }
      } catch (e: any) {
        logs.push(`❌ Error verificando auth: ${e.message}`)
      }

      logs.push('')
      logs.push('✨ VERIFICACIÓN COMPLETADA')
      setResults(logs)
    }

    checkDatabase()
  }, [])

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Debug Base de Datos</h1>
      <div className="bg-slate-800 p-4 rounded-lg">
        <pre className="whitespace-pre-wrap text-sm">
          {results.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </pre>
      </div>
    </div>
  )
}