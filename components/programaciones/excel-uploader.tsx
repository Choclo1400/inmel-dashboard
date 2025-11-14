"use client"

import { useState } from 'react'
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import * as XLSX from 'xlsx'
import { createBooking } from '@/lib/services/scheduling-lite'

interface ExcelUploaderProps {
  onUploadSuccess?: () => void
}

interface ProcessResult {
  total: number
  successful: number
  failed: number
  errors: string[]
}

export function ExcelUploader({ onUploadSuccess }: ExcelUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const { toast } = useToast()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      validateAndSetFile(droppedFile)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (file: File) => {
    // Validar que sea Excel
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ]

    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      toast({
        title: 'Archivo no válido',
        description: 'Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV',
        variant: 'destructive'
      })
      return
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Archivo muy grande',
        description: 'El archivo no debe superar los 10MB',
        variant: 'destructive'
      })
      return
    }

    setFile(file)
    toast({
      title: 'Archivo seleccionado',
      description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
    })
  }

  const processExcelFile = async (file: File): Promise<ProcessResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          console.log('📊 Datos del Excel:', jsonData)

          const result: ProcessResult = {
            total: jsonData.length,
            successful: 0,
            failed: 0,
            errors: []
          }

          setProgress({ current: 0, total: jsonData.length })

          // Procesar cada fila
          for (let i = 0; i < jsonData.length; i++) {
            const row: any = jsonData[i]

            try {
              // Mapear columnas del Excel
              const bookingData = {
                technician_id: row['ID Técnico'] || row['technician_id'] || row['Tecnico'],
                title: row['Título'] || row['title'] || row['Titulo'] || 'Trabajo Técnico',
                start_datetime: row['Fecha Inicio'] || row['start_datetime'] || row['FechaInicio'],
                end_datetime: row['Fecha Fin'] || row['end_datetime'] || row['FechaFin'],
                status: (row['Estado'] || row['status'] || 'pending') as 'pending' | 'confirmed' | 'done' | 'canceled',
                notes: row['Notas'] || row['notes'] || undefined
              }

              console.log(`📝 [${i + 1}/${jsonData.length}] Procesando:`, bookingData)

              // Validar datos requeridos
              if (!bookingData.technician_id || !bookingData.start_datetime || !bookingData.end_datetime) {
                throw new Error('Faltan datos requeridos: ID Técnico, Fecha Inicio o Fecha Fin')
              }

              // Crear programación
              await createBooking(bookingData)
              result.successful++

              console.log(`✅ [${i + 1}/${jsonData.length}] Creada exitosamente`)
            } catch (error) {
              result.failed++
              const errorMsg = `Fila ${i + 2}: ${error instanceof Error ? error.message : 'Error desconocido'}`
              result.errors.push(errorMsg)
              console.error(`❌ [${i + 1}/${jsonData.length}] Error:`, error)
            }

            setProgress({ current: i + 1, total: jsonData.length })
          }

          resolve(result)
        } catch (error) {
          resolve({
            total: 0,
            successful: 0,
            failed: 0,
            errors: [`Error leyendo Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`]
          })
        }
      }

      reader.readAsBinaryString(file)
    })
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No hay archivo',
        description: 'Por favor selecciona un archivo primero',
        variant: 'destructive'
      })
      return
    }

    setUploading(true)
    setProcessing(true)

    try {
      const supabase = createClient()

      // 1. Subir archivo a Supabase Storage (respaldo)
      const fileName = `excel-uploads/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('programaciones')
        .upload(fileName, file)

      if (uploadError) {
        console.warn('⚠️ No se pudo guardar en storage:', uploadError)
        // Continuar de todos modos
      }

      // 2. Procesar Excel y crear programaciones
      const result = await processExcelFile(file)

      // 3. Mostrar resultados
      if (result.successful > 0) {
        toast({
          title: `✅ Importación completada`,
          description: `${result.successful} de ${result.total} programaciones creadas exitosamente`,
          duration: 6000
        })
      }

      if (result.failed > 0) {
        toast({
          title: `⚠️ Algunas programaciones fallaron`,
          description: `${result.failed} errores. Revisa la consola para más detalles.`,
          variant: 'destructive',
          duration: 8000
        })
        console.error('Errores durante importación:', result.errors)
      }

      setFile(null)
      onUploadSuccess?.()
    } catch (error) {
      console.error('❌ Error general:', error)
      toast({
        title: 'Error al procesar archivo',
        description: error instanceof Error ? error.message : 'No se pudo procesar el archivo',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
      setProcessing(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  const removeFile = () => {
    setFile(null)
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <FileSpreadsheet className="h-5 w-5" />
          Importar desde Excel
        </CardTitle>
        <CardDescription className="text-slate-400">
          Sube un archivo Excel con programaciones masivas (solo Admin)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!file ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-600 hover:border-slate-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-300 mb-2">
              Arrastra y suelta tu archivo Excel aquí
            </p>
            <p className="text-slate-500 text-sm mb-4">o</p>
            <label>
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>
                  Seleccionar archivo
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                  />
                </span>
              </Button>
            </label>
            <p className="text-xs text-slate-500 mt-4">
              Formatos permitidos: .xlsx, .xls, .csv (máx. 10MB)
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/50 rounded-lg p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="h-8 w-8 text-green-400 mt-1" />
                <div>
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-sm text-slate-400">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir archivo
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={removeFile}
                disabled={uploading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Información de formato esperado */}
        <div className="bg-blue-950/30 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-300">
                Formato esperado del Excel
              </p>
              <ul className="text-xs text-slate-400 mt-2 space-y-1 list-disc list-inside">
                <li>Columna A: ID Técnico</li>
                <li>Columna B: Título de la programación</li>
                <li>Columna C: Fecha y hora inicio (YYYY-MM-DD HH:MM)</li>
                <li>Columna D: Fecha y hora fin (YYYY-MM-DD HH:MM)</li>
                <li>Columna E: Estado (pending, confirmed, done, canceled)</li>
                <li>Columna F: Notas (opcional)</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
