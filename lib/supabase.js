import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Roles de usuario
export const USER_ROLES = {
  ADMIN: 'Admin',
  MENTOR: 'Mentor', 
  TRADER: 'Trader',
  ALUMNO: 'Alumno'
}

// Verificar si las variables de entorno están configuradas
let supabase = null

try {
  if (supabaseUrl && supabaseAnonKey && 
      supabaseUrl !== 'your_supabase_project_url_here' && 
      supabaseAnonKey !== 'your_supabase_anon_key_here') {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } else {
    console.warn('Supabase no configurado - variables de entorno faltantes')
  }
} catch (error) {
  console.error('Error creating Supabase client:', error)
}

export { supabase }

// Inicialización de la base de datos
export const initializeDatabase = async () => {
  if (!supabase) {
    console.warn('Supabase client not available')
    return
  }
  
  try {
    const { data: existingData } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
  }
}