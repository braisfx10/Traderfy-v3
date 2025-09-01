import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// Crear cliente Supabase del servidor
function createSupabaseServer() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle cookie setting errors
          }
        },
      },
    }
  )
}

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Middleware para autenticación
async function requireAuth(supabase) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized - Please log in')
  }
  return user
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const supabase = createSupabaseServer()

    // Root endpoint - GET /api/
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ 
        message: "Traderfy API activa",
        version: "1.0.0",
        endpoints: [
          "/auth/signup",
          "/auth/signin", 
          "/auth/signout",
          "/auth/user",
          "/trades",
          "/accounts",
          "/users"
        ]
      }))
    }

    // AUTHENTICATION ENDPOINTS
    
    // POST /api/auth/signup
    if (route === '/auth/signup' && method === 'POST') {
      const body = await request.json()
      const { email, password, role = 'Trader' } = body

      if (!email || !password) {
        return handleCORS(NextResponse.json(
          { error: "Email y contraseña son requeridos" },
          { status: 400 }
        ))
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role
          }
        }
      })

      if (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 400 }
        ))
      }

      // Si el usuario se creó exitosamente, guardarlo en la tabla users
      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            role,
            created_at: new Date().toISOString()
          }])

        if (insertError) {
          console.error('Error inserting user:', insertError)
        }
      }

      return handleCORS(NextResponse.json({ 
        message: "Usuario registrado exitosamente",
        user: data.user 
      }))
    }

    // POST /api/auth/signin
    if (route === '/auth/signin' && method === 'POST') {
      const body = await request.json()
      const { email, password } = body

      if (!email || !password) {
        return handleCORS(NextResponse.json(
          { error: "Email y contraseña son requeridos" },
          { status: 400 }
        ))
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 400 }
        ))
      }

      return handleCORS(NextResponse.json({ 
        message: "Inicio de sesión exitoso",
        user: data.user,
        session: data.session
      }))
    }

    // POST /api/auth/signout
    if (route === '/auth/signout' && method === 'POST') {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 400 }
        ))
      }

      return handleCORS(NextResponse.json({ 
        message: "Sesión cerrada exitosamente" 
      }))
    }

    // GET /api/auth/user
    if (route === '/auth/user' && method === 'GET') {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        return handleCORS(NextResponse.json(
          { error: "No authenticated user" },
          { status: 401 }
        ))
      }

      // Obtener información adicional del usuario desde la tabla users
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      return handleCORS(NextResponse.json({ 
        user: {
          ...user,
          profile: userProfile
        }
      }))
    }

    // TRADES ENDPOINTS (requieren autenticación)

    // GET /api/trades
    if (route === '/trades' && method === 'GET') {
      const user = await requireAuth(supabase)

      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('close_time', { ascending: false })

      if (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 500 }
        ))
      }

      return handleCORS(NextResponse.json(trades || []))
    }

    // POST /api/trades
    if (route === '/trades' && method === 'POST') {
      const user = await requireAuth(supabase)
      const body = await request.json()

      const trade = {
        id: uuidv4(),
        user_id: user.id,
        symbol: body.symbol,
        direction: body.direction,
        entry_price: body.entryPrice,
        close_price: body.closePrice,
        lots: body.lots,
        pnl: body.pnl,
        close_time: body.closeTime || new Date().toISOString(),
        strategy: body.strategy || null,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('trades')
        .insert([trade])
        .select()
        .single()

      if (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 500 }
        ))
      }

      return handleCORS(NextResponse.json(data))
    }

    // ACCOUNTS ENDPOINTS

    // GET /api/accounts
    if (route === '/accounts' && method === 'GET') {
      const user = await requireAuth(supabase)

      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 500 }
        ))
      }

      return handleCORS(NextResponse.json(accounts || []))
    }

    // POST /api/accounts
    if (route === '/accounts' && method === 'POST') {
      const user = await requireAuth(supabase)
      const body = await request.json()

      const account = {
        id: uuidv4(),
        user_id: user.id,
        name: body.name,
        category: body.category || 'Broker',
        tag: body.tag || 'Demo',
        initial_balance: body.initialBalance || 0,
        current_balance: body.currentBalance || body.initialBalance || 0,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('accounts')
        .insert([account])
        .select()
        .single()

      if (error) {
        return handleCORS(NextResponse.json(
          { error: error.message },
          { status: 500 }
        ))
      }

      return handleCORS(NextResponse.json(data))
    }

    // POST /api/parse-html - Endpoint para procesar reportes HTML
    if (route === '/parse-html' && method === 'POST') {
      const user = await requireAuth(supabase)
      const body = await request.json()
      const { htmlContent, accountId } = body

      if (!htmlContent) {
        return handleCORS(NextResponse.json(
          { error: "Contenido HTML requerido" },
          { status: 400 }
        ))
      }

      try {
        // Importar y usar el parser HTML
        const { parseHTMLReport } = await import('../../../lib/htmlParser')
        const parsedData = parseHTMLReport(htmlContent)

        // Guardar las operaciones en la base de datos
        const tradesWithUserId = parsedData.trades.map(trade => ({
          ...trade,
          user_id: user.id,
          account_id: accountId || null
        }))

        const { data: insertedTrades, error: insertError } = await supabase
          .from('trades')
          .insert(tradesWithUserId)
          .select()

        if (insertError) {
          console.error('Error inserting trades:', insertError)
          return handleCORS(NextResponse.json(
            { error: "Error guardando operaciones" },
            { status: 500 }
          ))
        }

        return handleCORS(NextResponse.json({
          ...parsedData,
          insertedTrades: insertedTrades.length
        }))

      } catch (error) {
        console.error('Error parsing HTML:', error)
        return handleCORS(NextResponse.json(
          { error: "Error procesando el reporte HTML" },
          { status: 500 }
        ))
      }
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Ruta ${route} no encontrada` },
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    
    if (error.message === 'Unauthorized - Please log in') {
      return handleCORS(NextResponse.json(
        { error: "No autorizado - Inicia sesión" },
        { status: 401 }
      ))
    }

    return handleCORS(NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute