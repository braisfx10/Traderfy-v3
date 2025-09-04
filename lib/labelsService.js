// Servicio para gestión de etiquetas personalizadas
import { supabase } from './supabase'

// Colores predeterminados del sistema lila-cian
const SYSTEM_COLORS = [
  '#A020F0', // Lila principal
  '#8A2BE2', // Azul violeta
  '#9932CC', // Orquídea oscura
  '#9400D3', // Violeta oscuro
  '#7B68EE', // Slate azul medio
  '#6A5ACD', // Slate azul
  '#00FFFF', // Cian principal
  '#00CED1', // Turquesa oscuro
  '#20B2AA', // Verde mar claro
  '#48D1CC', // Turquesa medio
  '#40E0D0', // Turquesa
  '#00BFFF'  // Azul cielo profundo
]

// Generar color automático para nueva etiqueta
export const generateLabelColor = () => {
  return SYSTEM_COLORS[Math.floor(Math.random() * SYSTEM_COLORS.length)]
}

// Obtener todas las etiquetas del usuario
export const getUserLabels = async (userId) => {
  if (!supabase || !userId) return []

  try {
    const { data, error } = await supabase
      .from('labels')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching user labels:', error)
    return []
  }
}

// Crear nueva etiqueta
export const createLabel = async (userId, name, color = null) => {
  if (!name) return null

  // Si no hay Supabase, funcionar en modo demo
  if (!supabase) {
    const labelColor = color || generateLabelColor()
    const newLabel = {
      id: `demo-label-${Date.now()}`,
      user_id: userId || 'demo',
      name: name.trim(),
      color: labelColor,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // En modo demo, almacenar en localStorage
    const existingLabels = JSON.parse(localStorage.getItem('demo_labels') || '[]')
    existingLabels.push(newLabel)
    localStorage.setItem('demo_labels', JSON.stringify(existingLabels))
    
    return newLabel
  }

  if (!userId) return null

  try {
    const labelColor = color || generateLabelColor()
    
    const { data, error } = await supabase
      .from('labels')
      .insert({
        user_id: userId,
        name: name.trim(),
        color: labelColor
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating label:', error)
    throw error
  }
}

// Actualizar etiqueta existente
export const updateLabel = async (labelId, updates) => {
  if (!supabase || !labelId) return null

  try {
    const { data, error } = await supabase
      .from('labels')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', labelId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating label:', error)
    throw error
  }
}

// Eliminar etiqueta
export const deleteLabel = async (labelId) => {
  if (!supabase || !labelId) return false

  try {
    // Primero eliminar todas las relaciones account_labels
    await supabase
      .from('account_labels')
      .delete()
      .eq('label_id', labelId)

    // Luego eliminar la etiqueta
    const { error } = await supabase
      .from('labels')
      .delete()
      .eq('id', labelId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting label:', error)
    throw error
  }
}

// Obtener etiquetas de una cuenta específica
export const getAccountLabels = async (accountId) => {
  if (!supabase || !accountId) return []

  try {
    const { data, error } = await supabase
      .from('account_labels')
      .select(`
        label_id,
        labels!inner (
          id,
          name,
          color
        )
      `)
      .eq('account_id', accountId)

    if (error) throw error
    return data?.map(item => item.labels) || []
  } catch (error) {
    console.error('Error fetching account labels:', error)
    return []
  }
}

// Asignar etiqueta a cuenta
export const assignLabelToAccount = async (accountId, labelId) => {
  if (!supabase || !accountId || !labelId) return false

  try {
    const { error } = await supabase
      .from('account_labels')
      .insert({
        account_id: accountId,
        label_id: labelId
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error assigning label to account:', error)
    // Si es error de duplicado, no es crítico
    if (error.code === '23505') return true
    throw error
  }
}

// Remover etiqueta de cuenta
export const removeLabelFromAccount = async (accountId, labelId) => {
  if (!supabase || !accountId || !labelId) return false

  try {
    const { error } = await supabase
      .from('account_labels')
      .delete()
      .eq('account_id', accountId)
      .eq('label_id', labelId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error removing label from account:', error)
    throw error
  }
}

// Obtener cuentas con sus etiquetas
export const getAccountsWithLabels = async (userId) => {
  if (!supabase || !userId) return []

  try {
    const { data, error } = await supabase
      .from('accounts')
      .select(`
        *,
        account_labels (
          labels (
            id,
            name,
            color
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Formatear los datos para que sean más fáciles de usar
    return data?.map(account => ({
      ...account,
      labels: account.account_labels?.map(al => al.labels) || []
    })) || []
  } catch (error) {
    console.error('Error fetching accounts with labels:', error)
    return []
  }
}

// Validar nombre de etiqueta
export const validateLabelName = (name, existingLabels = []) => {
  if (!name || name.trim().length === 0) {
    return 'El nombre de la etiqueta es requerido'
  }
  
  if (name.trim().length > 50) {
    return 'El nombre debe tener máximo 50 caracteres'
  }

  const normalizedName = name.trim().toLowerCase()
  const exists = existingLabels.some(label => 
    label.name.toLowerCase() === normalizedName
  )
  
  if (exists) {
    return 'Ya existe una etiqueta con este nombre'
  }

  return null
}

// Etiquetas predeterminadas del sistema
export const DEFAULT_LABELS = [
  { name: 'Funded', color: '#A020F0', system: true },
  { name: 'Demo', color: '#6B7280', system: true },
  { name: 'Live', color: '#00FFFF', system: true }
]

// Etiquetas sugeridas para nuevos usuarios
export const SUGGESTED_LABELS = [
  { name: 'FTMO', color: '#9932CC' },
  { name: 'Bullfy', color: '#8A2BE2' },
  { name: 'Neomaaa', color: '#7B68EE' },
  { name: 'Alto Riesgo', color: '#FF6B6B' },
  { name: 'Conservadora', color: '#4ECDC4' },
  { name: 'ICT', color: '#45B7D1' },
  { name: 'SMC', color: '#96CEB4' },
  { name: 'Scalp', color: '#FFEAA7' },
  { name: 'Swing', color: '#DDA0DD' },
  { name: 'Intraday', color: '#98D8C8' }
]