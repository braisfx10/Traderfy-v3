// Servicio para gestión de mentorías
import { supabase } from './supabase'

// Obtener usuarios con rol de Mentor para dropdown
export const getAvailableMentors = async () => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('role', 'Mentor')
      .order('full_name', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching mentors:', error)
    return []
  }
}

// Crear relación mentor-alumno
export const createMentorship = async (mentorId, alumnoId) => {
  if (!supabase || !mentorId || !alumnoId) return null

  try {
    // Verificar si ya existe una mentoría activa para este alumno
    const { data: existing } = await supabase
      .from('mentorships')
      .select('id')
      .eq('alumno_id', alumnoId)
      .eq('status', 'active')
      .single()

    if (existing) {
      throw new Error('Este alumno ya tiene un mentor asignado')
    }

    const { data, error } = await supabase
      .from('mentorships')
      .insert({
        mentor_id: mentorId,
        alumno_id: alumnoId,
        status: 'active'
      })
      .select(`
        *,
        mentor:users!mentor_id(id, email, full_name),
        alumno:users!alumno_id(id, email, full_name)
      `)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating mentorship:', error)
    throw error
  }
}

// Obtener alumnos de un mentor
export const getMentorStudents = async (mentorId) => {
  if (!supabase || !mentorId) return []

  try {
    const { data, error } = await supabase
      .from('mentorships')
      .select(`
        *,
        alumno:users!alumno_id(
          id, 
          email, 
          full_name,
          created_at
        )
      `)
      .eq('mentor_id', mentorId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching mentor students:', error)
    return []
  }
}

// Obtener el mentor de un alumno
export const getStudentMentor = async (alumnoId) => {
  if (!supabase || !alumnoId) return null

  try {
    const { data, error } = await supabase
      .from('mentorships')
      .select(`
        *,
        mentor:users!mentor_id(
          id, 
          email, 
          full_name
        )
      `)
      .eq('alumno_id', alumnoId)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No mentor found
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Error fetching student mentor:', error)
    return null
  }
}

// Terminar relación mentor-alumno
export const endMentorship = async (mentorshipId) => {
  if (!supabase || !mentorshipId) return false

  try {
    const { error } = await supabase
      .from('mentorships')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', mentorshipId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error ending mentorship:', error)
    throw error
  }
}

// Asignar mentor a alumno (actualizar usuario)
export const assignMentorToStudent = async (alumnoId, mentorId) => {
  if (!supabase || !alumnoId || !mentorId) return false

  try {
    const { error } = await supabase
      .from('users')
      .update({ mentor_id: mentorId })
      .eq('id', alumnoId)

    if (error) throw error
    
    // También crear la relación en mentorships
    await createMentorship(mentorId, alumnoId)
    return true
  } catch (error) {
    console.error('Error assigning mentor:', error)
    throw error
  }
}

// Obtener métricas agregadas de un alumno
export const getStudentMetrics = async (studentId) => {
  if (!supabase || !studentId) return null

  try {
    // Obtener cuentas del alumno
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, tag')
      .eq('user_id', studentId)

    if (accountsError) throw accountsError

    // Obtener trades del alumno
    const accountIds = accounts?.map(acc => acc.id) || []
    if (accountIds.length === 0) {
      return {
        accounts: [],
        trades: [],
        metrics: {
          totalAccounts: 0,
          totalTrades: 0,
          totalPnl: 0,
          winRate: 0,
          avgWin: 0,
          avgLoss: 0,
          profitFactor: 0
        }
      }
    }

    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .in('account_id', accountIds)

    if (tradesError) throw tradesError

    // Calcular métricas
    const winningTrades = trades?.filter(t => parseFloat(t.pnl) > 0) || []
    const losingTrades = trades?.filter(t => parseFloat(t.pnl) < 0) || []
    const totalTrades = trades?.length || 0
    const totalPnl = trades?.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0) || 0

    const metrics = {
      totalAccounts: accounts?.length || 0,
      totalTrades,
      totalPnl,
      winRate: totalTrades > 0 ? ((winningTrades.length / totalTrades) * 100).toFixed(2) : 0,
      avgWin: winningTrades.length > 0 ? 
        (winningTrades.reduce((sum, t) => sum + parseFloat(t.pnl), 0) / winningTrades.length).toFixed(2) : 0,
      avgLoss: losingTrades.length > 0 ? 
        Math.abs(losingTrades.reduce((sum, t) => sum + parseFloat(t.pnl), 0) / losingTrades.length).toFixed(2) : 0,
      profitFactor: winningTrades.length > 0 && losingTrades.length > 0 ?
        (winningTrades.reduce((sum, t) => sum + parseFloat(t.pnl), 0) / 
         Math.abs(losingTrades.reduce((sum, t) => sum + parseFloat(t.pnl), 0))).toFixed(2) : 
        winningTrades.length > 0 ? 'Infinito' : 0
    }

    return {
      accounts: accounts || [],
      trades: trades || [],
      metrics
    }
  } catch (error) {
    console.error('Error fetching student metrics:', error)
    return null
  }
}

// Verificar si un usuario puede actuar como mentor
export const canActAsMentor = (user) => {
  return user?.role === 'Mentor' || user?.role === 'Admin'
}

// Verificar si un usuario es alumno
export const isStudent = (user) => {
  return user?.role === 'Alumno'
}

// Verificar si un usuario es admin
export const isAdmin = (user) => {
  return user?.role === 'Admin'
}

// Obtener todas las mentorías (solo para admin)
export const getAllMentorships = async () => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('mentorships')
      .select(`
        *,
        mentor:users!mentor_id(id, email, full_name),
        alumno:users!alumno_id(id, email, full_name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching all mentorships:', error)
    return []
  }
}

// Cambiar rol de usuario (solo admin)
export const changeUserRole = async (userId, newRole) => {
  if (!supabase || !userId || !newRole) return false

  const validRoles = ['Admin', 'Mentor', 'Trader', 'Alumno']
  if (!validRoles.includes(newRole)) {
    throw new Error('Rol inválido')
  }

  try {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error changing user role:', error)
    throw error
  }
}

// Buscar usuarios por email (para asignación de mentor)
export const searchUsersByEmail = async (email, role = null) => {
  if (!supabase || !email) return []

  try {
    let query = supabase
      .from('users')
      .select('id, email, full_name, role')
      .ilike('email', `%${email}%`)
      .limit(10)

    if (role) {
      query = query.eq('role', role)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error searching users:', error)
    return []
  }
}