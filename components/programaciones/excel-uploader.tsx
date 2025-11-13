"use client"

import { useState } from 'react'
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'

interface ExcelUploaderProps {
  onUploadSuccess?: () => void
}

export function ExcelUploader({ onUploadSuccess }: ExcelUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
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

    try {
      const supabase = createClient()

      // Subir archivo a Supabase Storage
      const fileName = `excel-uploads/${Date.now()}-${file.name}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('programaciones')
        .upload(fileName, file)

      if (uploadError) {
        throw uploadError
      }

      console.log('✅ Archivo subido:', uploadData)

      // Aquí puedes agregar lógica adicional para procesar el Excel
      // Por ejemplo, leer el contenido y crear bookings automáticamente

      toast({
        title: '✅ Archivo subido exitosamente',
        description: `${file.name} se ha guardado correctamente`,
      })

      setFile(null)
      onUploadSuccess?.()
    } catch (error) {
      console.error('❌ Error subiendo archivo:', error)
      toast({
        title: 'Error al subir archivo',
        description: error instanceof Error ? error.message : 'No se pudo subir el archivo',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
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
