# Script de prueba para Edge Functions locales (PowerShell)
# Uso: .\test-functions.ps1

Write-Host "🧪 Probando Edge Functions localmente..." -ForegroundColor Green

# Verificar que Supabase esté ejecutándose localmente
try {
    $response = Invoke-WebRequest -Uri "http://localhost:54321/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Supabase local detectado" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase no está ejecutándose localmente" -ForegroundColor Red
    Write-Host "Ejecuta: supabase start" -ForegroundColor Yellow
    exit 1
}

# Variables de prueba (reemplaza con IDs reales de tu DB)
$TECHNICIAN_ID = "123e4567-e89b-12d3-a456-426614174000"
$FROM_DATE = "2025-09-25T00:00:00-03:00"
$TO_DATE = "2025-09-25T23:59:59-03:00"

# Obtener token de acceso
try {
    $ACCESS_TOKEN = (supabase auth get-access-token | Out-String).Trim()
} catch {
    Write-Host "❌ Error obteniendo token de acceso" -ForegroundColor Red
    Write-Host "Asegúrate de estar autenticado: supabase auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔍 Probando función availability..." -ForegroundColor Blue
try {
    $availabilityUrl = "http://localhost:54321/functions/v1/availability?technicianId=$TECHNICIAN_ID&from=$FROM_DATE&to=$TO_DATE&slotMinutes=30"
    $headers = @{ "Authorization" = "Bearer $ACCESS_TOKEN" }
    $response = Invoke-RestMethod -Uri $availabilityUrl -Headers $headers -Method GET
    Write-Host "✅ Availability OK" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Error en availability: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 Probando función suggest..." -ForegroundColor Blue
try {
    $suggestUrl = "http://localhost:54321/functions/v1/suggest?technicianId=$TECHNICIAN_ID&durationMin=60&from=$FROM_DATE&to=$TO_DATE"
    $headers = @{ "Authorization" = "Bearer $ACCESS_TOKEN" }
    $response = Invoke-RestMethod -Uri $suggestUrl -Headers $headers -Method GET
    Write-Host "✅ Suggest OK" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Error en suggest: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Pruebas completadas" -ForegroundColor Green