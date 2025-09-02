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

// Componente del Sidebar
const Sidebar = ({ 
  isCollapsed, 
  setIsCollapsed, 
  accounts, 
  selectedAccount, 
  setSelectedAccount,
  currentView,
  setCurrentView,
  onLogout 
}) => {
  const [accountsExpanded, setAccountsExpanded] = useState(true)
  const [panelExpanded, setPanelExpanded] = useState(false)

  useEffect(() => {
    if (selectedAccount) {
      setPanelExpanded(true)
      if (currentView.startsWith('accounts-')) {
        setCurrentView('panel-summary')
      }
    }
  }, [selectedAccount, setCurrentView])

  const handleAccountSelect = (account) => {
    setSelectedAccount(account)
    setCurrentView('panel-summary')
  }

  const handleViewChange = (view) => {
    setCurrentView(view)
    if (window.innerWidth < 768) {
      setIsCollapsed(true)
    }
  }

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-80'} bg-gray-900 border-r border-gray-700 transition-all duration-300 flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-purple-400" />
              <h1 className="text-xl font-bold text-white">Traderfy</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-white"
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2">
        {/* Cuentas Section */}
        <div>
          <Button
            variant="ghost"
            className="w-full justify-between text-gray-300 hover:text-white hover:bg-gray-800"
            onClick={() => setAccountsExpanded(!accountsExpanded)}
          >
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              {!isCollapsed && <span>Cuentas</span>}
            </div>
            {!isCollapsed && (
              accountsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            )}
          </Button>
          
          {accountsExpanded && !isCollapsed && (
            <div className="ml-6 space-y-1 mt-2">
              <Button
                variant="ghost"
                className={`w-full justify-start text-sm ${
                  currentView === 'accounts-summary' 
                    ? 'bg-purple-500 text-white hover:bg-purple-600' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
                onClick={() => handleViewChange('accounts-summary')}
              >
                Resumen Total
              </Button>
              
              {accounts.map((account) => (
                <Button
                  key={account.id}
                  variant="ghost"
                  className={`w-full justify-start text-sm ${
                    selectedAccount?.id === account.id 
                      ? 'bg-cyan-500 text-white hover:bg-cyan-600' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                  onClick={() => handleAccountSelect(account)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{account.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      account.tag === 'Live' ? 'bg-green-600' :
                      account.tag === 'Demo' ? 'bg-blue-600' : 'bg-orange-600'
                    }`}>
                      {account.tag}
                    </span>
                  </div>
                </Button>
              ))}
              
              <Button
                variant="ghost"
                className="w-full justify-start text-sm text-purple-400 hover:text-purple-300 hover:bg-gray-800"
                onClick={() => handleViewChange('accounts-add')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Cuenta
              </Button>
            </div>
          )}
        </div>

        {/* Panel de cuenta Section */}
        {selectedAccount && (
          <div>
            <Button
              variant="ghost"
              className="w-full justify-between text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={() => setPanelExpanded(!panelExpanded)}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                {!isCollapsed && <span>Panel de Cuenta</span>}
              </div>
              {!isCollapsed && (
                panelExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
              )}
            </Button>
            
            {panelExpanded && !isCollapsed && (
              <div className="ml-6 space-y-1 mt-2">
                {[
                  { key: 'panel-summary', label: 'Resumen', icon: Activity },
                  { key: 'panel-calendar', label: 'Calendario', icon: Calendar },
                  { key: 'panel-trades', label: 'Operaciones', icon: FileText },
                  { key: 'panel-analysis', label: 'Análisis', icon: PieChart }
                ].map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant="ghost"
                    className={`w-full justify-start text-sm ${
                      currentView === key 
                        ? 'bg-cyan-500 text-white hover:bg-cyan-600' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                    onClick={() => handleViewChange(key)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Configuración */}
        <Button
          variant="ghost"
          className={`w-full justify-start ${
            currentView === 'settings' 
              ? 'bg-purple-500 text-white hover:bg-purple-600' 
              : 'text-gray-300 hover:text-white hover:bg-gray-800'
          }`}
          onClick={() => handleViewChange('settings')}
        >
          <Settings className="w-4 h-4" />
          {!isCollapsed && <span className="ml-2">Configuración</span>}
        </Button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-gray-800"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span className="ml-2">Cerrar Sesión</span>}
        </Button>
      </div>
    </div>
  )
}

const TradingCalendar = ({ trades = [], selectedAccount }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Debug: Log para ver qué trades llegan
  console.log('TradingCalendar - trades received:', trades.length)
  console.log('TradingCalendar - selectedAccount:', selectedAccount?.id)
  
  // Filtrar trades por cuenta seleccionada
  const accountTrades = selectedAccount 
    ? trades.filter(t => t.account_id === selectedAccount.id)
    : trades
    
  console.log('TradingCalendar - accountTrades filtered:', accountTrades.length)
  
  // Agrupar trades por día
  const tradesByDay = accountTrades.reduce((acc, trade) => {
    const date = new Date(trade.close_time).toDateString()
    if (!acc[date]) {
      acc[date] = { trades: [], totalPnl: 0 }
    }
    acc[date].trades.push(trade)
    acc[date].totalPnl += trade.pnl
    return acc
  }, {})

  console.log('TradingCalendar - tradesByDay:', Object.keys(tradesByDay).length, 'days with trades')

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
        bgColor = 'bg-green-900/50 hover:bg-green-800/50 border border-green-500'
        textColor = 'text-green-100'
      } else if (dayData.totalPnl < 0) {
        bgColor = 'bg-red-900/50 hover:bg-red-800/50 border border-red-500'
        textColor = 'text-red-100'
      }
    }

    return (
      <div
        key={day}
        className={`min-h-[80px] p-2 rounded-lg ${bgColor} cursor-pointer transition-colors ${textColor}`}
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
            {selectedAccount && (
              <span className="text-sm font-normal text-gray-400">- {selectedAccount.name}</span>
            )}
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
          {Array.from({ length: startingDayOfWeek }, (_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px]" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => renderCalendarDay(i + 1))}
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de métricas
const MetricsCards = ({ trades = [], title = "Métricas Generales" }) => {
  const stats = {
    totalTrades: trades.length,
    winningTrades: trades.filter(t => t.pnl > 0).length,
    losingTrades: trades.filter(t => t.pnl < 0).length,
    totalPnl: trades.reduce((sum, t) => sum + t.pnl, 0),
    winRate: trades.length > 0 ? ((trades.filter(t => t.pnl > 0).length / trades.length) * 100).toFixed(1) : 0,
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Total Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalTrades}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{stats.winRate}%</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${stats.totalPnl.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trades Ganadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.winningTrades}</div>
            <div className="text-sm text-gray-400">vs {stats.losingTrades} perdedores</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Componente para subir archivos HTML
const HTMLUploader = ({ selectedAccount, onSuccess, showToast }) => {
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!selectedAccount) {
      showToast('Selecciona una cuenta antes de subir el reporte', 'error')
      return
    }

    setIsUploading(true)
    try {
      const text = await file.text()
      const parsedData = parseHTMLReport(text)
      
      if (parsedData.trades.length === 0) {
        showToast('No se encontraron operaciones en el archivo', 'error')
        return
      }

      // Asignar account_id a todos los trades
      const tradesWithAccountId = parsedData.trades.map(trade => ({
        ...trade,
        account_id: selectedAccount.id,
        user_id: 'demo' // Para modo demo
      }))

      // Crear el objeto de datos procesados
      const processedData = {
        ...parsedData,
        trades: tradesWithAccountId
      }

      showToast(`Reporte procesado: ${parsedData.trades.length} operaciones encontradas`, 'success')
      onSuccess(processedData)
      
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
          {selectedAccount && (
            <span className="text-sm font-normal text-gray-400">- {selectedAccount.name}</span>
          )}
        </CardTitle>
        <CardDescription className="text-gray-400">
          Sube tu reporte de MetaTrader 4/5 o cTrader para procesarlo automáticamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!selectedAccount ? (
            <div className="p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Selecciona una cuenta</span>
              </div>
              <p className="text-yellow-200 text-sm mt-1">
                Debes seleccionar una cuenta antes de subir un reporte
              </p>
            </div>
          ) : (
            <>
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
                <div className="text-cyan-400 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-spin" />
                  Procesando archivo...
                </div>
              )}
            </>
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

// Componente principal
export default function TraderfyApp() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  const {
    selectedAccount,
    setSelectedAccount,
    accounts,
    setAccounts,
    trades,
    setTrades,
    currentView,
    setCurrentView
  } = useAppState()

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  useEffect(() => {
    // Verificar si Supabase está configurado
    if (!supabase) {
      // Agregar cuentas de demo para testing sin Supabase
      setAccounts([
        { id: '1', name: 'FTT Funded 15K', tag: 'Funded', user_id: 'demo' },
        { id: '2', name: 'FTMO Challenge 100K', tag: 'Demo', user_id: 'demo' },
        { id: '3', name: 'Prop Firm Live', tag: 'Live', user_id: 'demo' }
      ])
      setLoading(false)
      return
    }

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null)
      }
    )

    return () => subscription.unsubscribe()
  }, [setAccounts])

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setSelectedAccount(null)
    setTrades([])
    setCurrentView('accounts-summary')
  }

  const handleUploadSuccess = (data) => {
    console.log('handleUploadSuccess called with:', data)
    console.log('Number of trades to add:', data.trades?.length)
    
    // Agregar los nuevos trades al estado global
    setTrades(prevTrades => {
      const newTrades = [...prevTrades, ...data.trades]
      console.log('Previous trades:', prevTrades.length)
      console.log('New trades total:', newTrades.length)
      console.log('Sample trade:', data.trades[0])
      return newTrades
    })
    
    // Navegar al calendario para ver los nuevos datos
    if (currentView !== 'panel-calendar') {
      setCurrentView('panel-calendar')
    }
  }

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5 animate-spin" />
          Cargando...
        </div>
      </div>
    )
  }

  // Renderizar contenido según la vista actual
  const renderContent = () => {
    switch (currentView) {
      case 'accounts-summary':
        return (
          <div className="space-y-6">
            <MetricsCards trades={trades} title="Resumen Total de Todas las Cuentas" />
            {!supabase && (
              <Card className="bg-yellow-900/20 border-yellow-600">
                <CardHeader>
                  <CardTitle className="text-yellow-400 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Configuración de Supabase Requerida
                  </CardTitle>
                  <CardDescription className="text-yellow-200">
                    Para usar todas las funcionalidades, sigue las instrucciones en CONFIGURACION_SUPABASE.md
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        )
      
      case 'accounts-add':
        return (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Agregar Nueva Cuenta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-400">
                Formulario para agregar cuenta (por implementar)
              </div>
            </CardContent>
          </Card>
        )
      
      case 'panel-summary':
        return selectedAccount ? (
          <div className="space-y-6">
            <MetricsCards 
              trades={trades.filter(t => t.account_id === selectedAccount.id)} 
              title={`Resumen de ${selectedAccount.name}`} 
            />
            <HTMLUploader 
              selectedAccount={selectedAccount}
              onSuccess={handleUploadSuccess}
              showToast={showToast}
            />
          </div>
        ) : null
      
      case 'panel-calendar':
        return (
          <TradingCalendar 
            trades={trades} 
            selectedAccount={selectedAccount} 
          />
        )
      
      case 'panel-trades':
        return (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Historial de Operaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-400">
                Tabla de operaciones (por implementar)
              </div>
            </CardContent>
          </Card>
        )
      
      case 'panel-analysis':
        return (
          <div className="space-y-6">
            <MetricsCards 
              trades={trades.filter(t => selectedAccount ? t.account_id === selectedAccount.id : true)} 
              title={selectedAccount ? `Análisis de ${selectedAccount.name}` : "Análisis General"} 
            />
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Gráficos y Análisis Avanzado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-400">
                  Gráficos de rendimiento (por implementar)
                </div>
              </CardContent>
            </Card>
          </div>
        )
      
      case 'settings':
        return (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Configuración</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-400">
                Configuración de perfil y preferencias (por implementar)
              </div>
            </CardContent>
          </Card>
        )
      
      default:
        return (
          <div className="text-gray-400">
            Vista no encontrada
          </div>
        )
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gray-900 flex">
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          accounts={accounts}
          selectedAccount={selectedAccount}
          setSelectedAccount={setSelectedAccount}
          currentView={currentView}
          setCurrentView={setCurrentView}
          onLogout={handleLogout}
        />
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
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