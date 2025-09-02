'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { parseHTMLReport } from '../lib/htmlParser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { 
  Calendar, 
  TrendingUp, 
  FileText, 
  Upload, 
  BarChart3, 
  Settings, 
  PieChart, 
  Target,
  AlertTriangle,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  LogOut,
  Wallet,
  Activity,
  DollarSign,
  Filter,
  Download,
  Edit,
  Trash2
} from 'lucide-react'

// Estado global de la aplicación
const useAppState = () => {
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentView, setCurrentView] = useState('accounts-summary')
  
  return {
    selectedAccount,
    setSelectedAccount,
    accounts,
    setAccounts,
    trades,
    setTrades,
    loading,
    setLoading,
    currentView,
    setCurrentView
  }
}

// Componente de notificación
const Toast = ({ message, type = 'info', onClose }) => (
  <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
  } text-white`}>
    <div className="flex items-center justify-between">
      <span>{message}</span>
      <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
        <X className="w-4 h-4" />
      </Button>
    </div>
  </div>
)

const TradingCalendar = ({ trades = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Agrupar trades por día
  const tradesByDay = trades.reduce((acc, trade) => {
    const date = new Date(trade.closeTime).toDateString()
    if (!acc[date]) {
      acc[date] = { trades: [], totalPnl: 0 }
    }
    acc[date].trades.push(trade)
    acc[date].totalPnl += trade.pnl
    return acc
  }, {})

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek }
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }

  const renderCalendarDay = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const dateKey = date.toDateString()
    const dayData = tradesByDay[dateKey]
    
    let bgColor = 'bg-gray-800 hover:bg-gray-700'
    let textColor = 'text-gray-300'
    
    if (dayData) {
      if (dayData.totalPnl > 0) {
        bgColor = 'bg-green-900 hover:bg-green-800 border border-green-500'
        textColor = 'text-green-100'
      } else if (dayData.totalPnl < 0) {
        bgColor = 'bg-red-900 hover:bg-red-800 border border-red-500'
        textColor = 'text-red-100'
      }
    }

    return (
      <div
        key={day}
        className={`min-h-[60px] p-2 rounded-lg ${bgColor} cursor-pointer transition-colors ${textColor}`}
      >
        <div className="font-medium text-sm">{day}</div>
        {dayData && (
          <div className="text-xs mt-1">
            <div>{dayData.trades.length} trades</div>
            <div className={dayData.totalPnl > 0 ? 'text-green-400' : 'text-red-400'}>
              ${dayData.totalPnl.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            Calendario de Trading
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
              ←
            </Button>
            <span className="text-white font-medium px-4">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
              →
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="text-center text-gray-400 font-medium py-2 text-sm">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {/* Días vacíos al inicio del mes */}
          {Array.from({ length: startingDayOfWeek }, (_, i) => (
            <div key={`empty-${i}`} className="min-h-[60px]" />
          ))}
          {/* Días del mes */}
          {Array.from({ length: daysInMonth }, (_, i) => renderCalendarDay(i + 1))}
        </div>
      </CardContent>
    </Card>
  )
}

const TradingStats = ({ trades = [] }) => {
  const stats = {
    totalTrades: trades.length,
    winningTrades: trades.filter(t => t.pnl > 0).length,
    losingTrades: trades.filter(t => t.pnl < 0).length,
    totalPnl: trades.reduce((sum, t) => sum + t.pnl, 0),
    winRate: trades.length > 0 ? ((trades.filter(t => t.pnl > 0).length / trades.length) * 100).toFixed(1) : 0
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-400">Total Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.totalTrades}</div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-400">Win Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-400">{stats.winRate}%</div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-400">Total P&L</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${stats.totalPnl.toFixed(2)}
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-400">Trades Ganadores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-400">{stats.winningTrades}</div>
          <div className="text-sm text-gray-400">vs {stats.losingTrades} perdedores</div>
        </CardContent>
      </Card>
    </div>
  )
}

const HTMLUploader = ({ onParsedData, showToast }) => {
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setIsUploading(true)
    try {
      const text = await file.text()
      const parsedData = parseHTMLReport(text)
      
      showToast(`Reporte procesado: ${parsedData.trades.length} operaciones encontradas`, 'success')
      onParsedData(parsedData)
      
    } catch (error) {
      console.error('Error al procesar archivo:', error)
      showToast('Error al procesar el archivo HTML', 'error')
    }
    setIsUploading(false)
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-cyan-400" />
          Subir Reporte HTML
        </CardTitle>
        <CardDescription className="text-gray-400">
          Sube tu reporte de MetaTrader 4/5 o cTrader para procesarlo automáticamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="html-file" className="text-white">
              Seleccionar archivo HTML
            </Label>
            <Input
              id="html-file"
              type="file"
              accept=".html,.htm"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="bg-gray-700 border-gray-600 text-white file:bg-purple-500 file:text-white file:border-0 file:rounded"
            />
          </div>
          {isUploading && (
            <div className="text-cyan-400 text-sm">Procesando archivo...</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const ConfigurationAlert = ({ showToast }) => {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <Card className="bg-yellow-900/20 border-yellow-600">
      <CardHeader>
        <CardTitle className="text-yellow-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Configuración de Supabase Requerida
        </CardTitle>
        <CardDescription className="text-yellow-200">
          Para usar todas las funcionalidades, necesitas configurar Supabase.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            variant="outline" 
            onClick={() => setShowDetails(!showDetails)}
            className="text-yellow-400 border-yellow-600 hover:bg-yellow-900/30"
          >
            {showDetails ? 'Ocultar' : 'Ver'} Instrucciones
          </Button>
          
          {showDetails && (
            <div className="bg-gray-800 p-4 rounded-lg text-sm text-gray-300 space-y-2">
              <h4 className="text-white font-medium">Pasos para configurar Supabase:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Ve a <a href="https://supabase.com" target="_blank" className="text-cyan-400 hover:underline">supabase.com</a> y crea un proyecto</li>
                <li>Ve a Settings → API en tu panel de Supabase</li>
                <li>Copia la Project URL y Anon Key</li>
                <li>Agrega estas URLs a Authentication → URL Configuration:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>https://tradestats-5.preview.emergentagent.com/**</li>
                    <li>https://tradestats-5.preview.emergentagent.com/auth/callback</li>
                  </ul>
                </li>
                <li>Actualiza el archivo .env con tus credenciales</li>
                <li>Reinicia la aplicación</li>
              </ol>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function TraderfyApp() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [trades, setTrades] = useState([])
  const [parsedData, setParsedData] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  useEffect(() => {
    // Verificar si Supabase está configurado
    if (!supabase) {
      setLoading(false)
      return
    }

    // Verificar autenticación
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)
      } catch (error) {
        console.error('Error checking auth:', error)
      }
      setLoading(false)
    }

    checkAuth()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleParsedData = (data) => {
    setParsedData(data)
    setTrades(data.trades)
  }

  const Sidebar = () => (
    <div className="w-64 bg-gray-900 border-r border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-8">
        <TrendingUp className="w-8 h-8 text-purple-400" />
        <h1 className="text-xl font-bold text-white">Traderfy</h1>
      </div>
      
      <nav className="space-y-2">
        {[
          { icon: BarChart3, label: 'Panel', active: true },
          { icon: Calendar, label: 'Calendario' },
          { icon: FileText, label: 'Operaciones' },
          { icon: PieChart, label: 'Análisis' },
          { icon: Target, label: 'Reglas' },
          { icon: Settings, label: 'Configuración' },
        ].map(({ icon: Icon, label, active }) => (
          <Button
            key={label}
            variant={active ? "secondary" : "ghost"}
            className={`w-full justify-start gap-2 ${
              active 
                ? 'bg-purple-500 text-white hover:bg-purple-600' 
                : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </nav>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-900 flex">
        <Sidebar />
        
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Dashboard de Trading</h1>
                <p className="text-gray-400">Analiza tu rendimiento y métricas de trading</p>
              </div>
              {user && (
                <div className="text-sm text-gray-400">
                  Bienvenido, {user.email}
                </div>
              )}
            </div>

            {/* Configuration Alert */}
            {!supabase && (
              <ConfigurationAlert showToast={showToast} />
            )}

            {/* Stats Cards */}
            <TradingStats trades={trades} />

            {/* Main Content */}
            <Tabs defaultValue="calendar" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                <TabsTrigger value="calendar" className="text-white data-[state=active]:bg-purple-500">
                  Calendario
                </TabsTrigger>
                <TabsTrigger value="upload" className="text-white data-[state=active]:bg-purple-500">
                  Subir Reporte
                </TabsTrigger>
                <TabsTrigger value="analysis" className="text-white data-[state=active]:bg-purple-500">
                  Análisis
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="calendar" className="mt-6">
                <TradingCalendar trades={trades} />
              </TabsContent>
              
              <TabsContent value="upload" className="mt-6">
                <HTMLUploader onParsedData={handleParsedData} showToast={showToast} />
                
                {parsedData && (
                  <Card className="bg-gray-800 border-gray-700 mt-6">
                    <CardHeader>
                      <CardTitle className="text-white">Resumen del Reporte</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-400">Cuenta</div>
                          <div className="text-white font-medium">
                            {parsedData.accountInfo.accountNumber || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Total Operaciones</div>
                          <div className="text-white font-medium">
                            {parsedData.totalTrades}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">P&L Total</div>
                          <div className={`font-medium ${
                            parsedData.summary.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            ${parsedData.summary.totalPnl?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="analysis" className="mt-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Análisis de Rendimiento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-gray-400">
                      Aquí se mostrarán gráficos y análisis detallados una vez que tengas datos de trading.
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </>
  )
}