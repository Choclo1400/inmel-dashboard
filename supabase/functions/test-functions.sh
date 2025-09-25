#!/bin/bash

# Script de prueba para Edge Functions locales
# Uso: ./test-functions.sh

echo "🧪 Probando Edge Functions localmente..."

# Verificar que Supabase esté ejecutándose localmente
if ! curl -s http://localhost:54321/health > /dev/null; then
    echo "❌ Supabase no está ejecutándose localmente"
    echo "Ejecuta: supabase start"
    exit 1
fi

echo "✅ Supabase local detectado"

# Variables de prueba (reemplaza con IDs reales de tu DB)
TECHNICIAN_ID="123e4567-e89b-12d3-a456-426614174000"
FROM_DATE="2025-09-25T00:00:00-03:00"
TO_DATE="2025-09-25T23:59:59-03:00"

echo "🔍 Probando función availability..."
curl -s "http://localhost:54321/functions/v1/availability?technicianId=${TECHNICIAN_ID}&from=${FROM_DATE}&to=${TO_DATE}&slotMinutes=30" \
  -H "Authorization: Bearer $(supabase auth get-access-token)" \
  | jq '.' || echo "❌ Error en availability"

echo ""
echo "💡 Probando función suggest..."
curl -s "http://localhost:54321/functions/v1/suggest?technicianId=${TECHNICIAN_ID}&durationMin=60&from=${FROM_DATE}&to=${TO_DATE}" \
  -H "Authorization: Bearer $(supabase auth get-access-token)" \
  | jq '.' || echo "❌ Error en suggest"

echo ""
echo "✅ Pruebas completadas"