import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Roles de usuario
export const USER_ROLES = {
  ADMIN: 'Admin',
  MENTOR: 'Mentor', 
  TRADER: 'Trader',
  ALUMNO: 'Alumno'
}

// Inicialización de la base de datos
export const initializeDatabase = async () => {
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