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
    <div className={`${isCollapsed ? 'w-16' : 'w-80'} gradient-sidebar border-r border-gray-700 transition-all duration-300 flex flex-col relative`}>
      {/* Header con gradiente del logo */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <TrendingUp className="w-8 h-8 gradient-traderfy-text" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-2xl font-bold gradient-traderfy-text">Traderfy</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-cyan-400/20 transition-all duration-300"
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
                className={`w-full justify-start gap-2 sidebar-item transition-all duration-300 ${
                  currentView === 'accounts-summary' 
                    ? 'bg-gradient-to-r from-purple-500/20 to-cyan-400/20 text-white border-l-2 border-purple-500 glow-purple' 
                    : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-cyan-400/10'
                }`}
                onClick={() => handleViewChange('accounts-summary')}
              >
                Resumen Total
              </Button>
              
              {accounts.map((account) => (
                <Button
                  key={account.id}
                  variant="ghost"
                  className={`w-full justify-start gap-2 sidebar-item transition-all duration-300 ${
                    selectedAccount?.id === account.id 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border-l-2 border-cyan-400 glow-cyan' 
                      : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-purple-500/10'
                  }`}
                  onClick={() => handleAccountSelect(account)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{account.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      account.tag === 'Live' ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-500/30' :
                      account.tag === 'Demo' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' : 
                      'bg-purple-500/20 text-purple-400 border border-purple-500/30'
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
              className="w-full justify-between text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-cyan-400/10 transition-all duration-300"
              onClick={() => setPanelExpanded(!panelExpanded)}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
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
                    className={`w-full justify-start gap-2 sidebar-item transition-all duration-300 ${
                      currentView === key 
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border-l-2 border-cyan-400 glow-cyan' 
                        : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-purple-500/10'
                    }`}
                    onClick={() => handleViewChange(key)}
                  >
                    <Icon className="w-4 h-4" />
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
          className={`w-full justify-start gap-2 sidebar-item transition-all duration-300 ${
            currentView === 'settings' 
              ? 'bg-gradient-to-r from-purple-500/20 to-cyan-400/20 text-white border-l-2 border-purple-500 glow-purple' 
              : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-cyan-400/10'
          }`}
          onClick={() => handleViewChange('settings')}
        >
          <Settings className="w-4 h-4" />
          {!isCollapsed && <span>Configuración</span>}
        </Button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-red-400 hover:text-red-300 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-400/10 transition-all duration-300"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </Button>
      </div>
    </div>
  )
}

// Componente del Calendario con modal emergente
const TradingCalendar = ({ trades = [], selectedAccount }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  
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
    acc[date].totalPnl += parseFloat(trade.pnl) || 0
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
        className={`min-h-[80px] p-2 rounded-lg trading-calendar-day cursor-pointer transition-all duration-300 ${bgColor} ${textColor} hover:scale-105`}
        onClick={() => dayData && setSelectedDay({ date: dateKey, ...dayData })}
      >
        <div className="font-medium text-sm relative z-10">{day}</div>
        {dayData && (
          <div className="text-xs mt-1 relative z-10">
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              <span>{dayData.trades.length} trades</span>
            </div>
            <div className={`font-bold ${dayData.totalPnl > 0 ? 'text-green-400 glow-text-cyan' : 'text-red-400 glow-text-purple'}`}>
              ${dayData.totalPnl.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
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

      {/* Modal emergente de detalles del día */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedDay(null)}>
          <Card className="bg-gray-800 border-gray-700 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  Detalles del {new Date(selectedDay.date).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDay(null)} className="text-white hover:bg-gray-700">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {/* Resumen del día */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-white">{selectedDay.trades.length}</div>
                    <div className="text-sm text-gray-400">Total Trades</div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className={`text-2xl font-bold ${selectedDay.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${selectedDay.totalPnl.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-400">P&L Total</div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">
                      {selectedDay.trades.length > 0 ? ((selectedDay.trades.filter(t => t.pnl > 0).length / selectedDay.trades.length) * 100).toFixed(1) : 0}%
                    </div>
                    <div className="text-sm text-gray-400">Win Rate</div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-cyan-400">
                      {selectedDay.trades.reduce((sum, t) => sum + (t.lots || 0), 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-400">Total Lotes</div>
                  </div>
                </div>

                {/* Lista detallada de trades */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Operaciones del Día</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {selectedDay.trades.map((trade, index) => (
                      <div key={trade.id || index} className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-lg">{trade.symbol}</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                trade.direction === 'Buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                              }`}>
                                {trade.direction}
                              </span>
                            </div>
                            <div className="text-gray-300">
                              <div className="text-sm">
                                <span className="text-gray-400">Entrada:</span> {trade.entry_price || 'N/A'}
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-400">Cierre:</span> {trade.close_price || 'N/A'}
                              </div>
                            </div>
                            <div className="text-gray-300">
                              <div className="text-sm">
                                <span className="text-gray-400">Lotes:</span> {trade.lots || 'N/A'}
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-400">Hora:</span> {new Date(trade.close_time).toLocaleTimeString('es-ES')}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xl font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              ${parseFloat(trade.pnl).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {trade.pnl >= 0 ? 'Ganancia' : 'Pérdida'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Componente de métricas expandidas
const MetricsCards = ({ trades = [], title = "Métricas Generales" }) => {
  const winningTrades = trades.filter(t => t.pnl > 0)
  const losingTrades = trades.filter(t => t.pnl < 0)
  
  const stats = {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    totalPnl: trades.reduce((sum, t) => sum + t.pnl, 0),
    winRate: trades.length > 0 ? ((winningTrades.length / trades.length) * 100).toFixed(1) : 0,
    avgWin: winningTrades.length > 0 ? (winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length).toFixed(2) : 0,
    avgLoss: losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length).toFixed(2) : 0,
    largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)).toFixed(2) : 0,
    largestLoss: losingTrades.length > 0 ? Math.abs(Math.min(...losingTrades.map(t => t.pnl))).toFixed(2) : 0,
    profitFactor: losingTrades.length > 0 && winningTrades.length > 0 ? 
      (winningTrades.reduce((sum, t) => sum + t.pnl, 0) / Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0))).toFixed(2) : 
      winningTrades.length > 0 ? 'Infinito' : 0,
    riskRewardRatio: winningTrades.length > 0 && losingTrades.length > 0 ?
      ((winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length) / 
       Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)).toFixed(2) : 0,
    totalLots: trades.reduce((sum, t) => sum + (t.lots || 0), 0).toFixed(2),
    avgTradeSize: trades.length > 0 ? (trades.reduce((sum, t) => sum + (t.lots || 0), 0) / trades.length).toFixed(2) : 0
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-500/30 metric-card transition-all duration-300 hover:scale-105 hover:from-purple-800/40 hover:to-purple-700/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Total Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-traderfy-text">{stats.totalTrades}</div>
            <div className="text-xs text-purple-200/70">Total de operaciones</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 border-cyan-500/30 metric-card transition-all duration-300 hover:scale-105 hover:from-cyan-800/40 hover:to-cyan-700/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-cyan-300 flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-traderfy-text">{stats.winRate}%</div>
            <div className="text-xs text-cyan-200/70">{stats.winningTrades}W / {stats.losingTrades}L</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-cyan-900/30 border-gradient-to-r border-purple-500/30 metric-card transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-indigo-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-400" />
              Total P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalPnl >= 0 ? 'text-green-400 glow-text-cyan' : 'text-red-400 glow-text-purple'}`}>
              ${stats.totalPnl.toFixed(2)}
            </div>
            <div className="text-xs text-indigo-200/70">Beneficio neto total</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-cyan-900/30 to-purple-900/30 border-cyan-500/30 metric-card transition-all duration-300 hover:scale-105 hover:from-cyan-800/40 hover:to-purple-800/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-cyan-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Profit Factor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-traderfy-text">{stats.profitFactor}</div>
            <div className="text-xs text-cyan-200/70">Beneficios / Pérdidas</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Segunda fila de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-800/20 border-green-500/30 metric-card transition-all duration-300 hover:scale-105 hover:from-green-800/40 hover:to-emerald-700/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-300">Ganancia Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-400 glow-text-cyan">${stats.avgWin}</div>
            <div className="text-xs text-green-200/70">Por trade ganador</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-900/30 to-pink-800/20 border-red-500/30 metric-card transition-all duration-300 hover:scale-105 hover:from-red-800/40 hover:to-pink-700/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-300">Pérdida Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-400 glow-text-purple">${stats.avgLoss}</div>
            <div className="text-xs text-red-200/70">Por trade perdedor</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-900/30 to-green-800/20 border-emerald-500/30 metric-card transition-all duration-300 hover:scale-105 hover:from-emerald-800/40 hover:to-green-700/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-300">Mejor Trade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-400 glow-text-cyan">${stats.largestWin}</div>
            <div className="text-xs text-emerald-200/70">Mayor ganancia</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-rose-900/30 to-red-800/20 border-rose-500/30 metric-card transition-all duration-300 hover:scale-105 hover:from-rose-800/40 hover:to-red-700/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-rose-300">Peor Trade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-rose-400 glow-text-purple">${stats.largestLoss}</div>
            <div className="text-xs text-rose-200/70">Mayor pérdida</div>
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
      
      // Intentar usar el API endpoint primero
      try {
        const response = await fetch('/api/parse-html', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            htmlContent: text,
            accountId: selectedAccount.id
          })
        })

        if (response.ok) {
          const apiResult = await response.json()
          if (apiResult.trades && apiResult.trades.length > 0) {
            // Asignar account_id si no está presente
            const tradesWithAccountId = apiResult.trades.map(trade => ({
              ...trade,
              account_id: selectedAccount.id,
              user_id: 'demo'
            }))

            const processedData = {
              ...apiResult,
              trades: tradesWithAccountId
            }

            showToast(`Reporte procesado vía API: ${apiResult.trades.length} operaciones encontradas`, 'success')
            onSuccess(processedData)
            return
          }
        }
      } catch (apiError) {
        console.log('API no disponible, procesando localmente:', apiError.message)
      }

      // Fallback: procesar localmente
      const parsedData = parseHTMLReport(text)
      
      if (parsedData.trades.length === 0) {
        showToast('No se encontraron operaciones en el archivo', 'error')
        return
      }

      // Asignar account_id a todos los trades Y agregar el resumen
      const tradesWithAccountId = parsedData.trades.map(trade => ({
        ...trade,
        account_id: selectedAccount.id,
        user_id: 'demo', // Para modo demo
        summary: parsedData.summary // Agregar datos de resumen a cada trade para fácil acceso
      }))

      // Crear el objeto de datos procesados
      const processedData = {
        ...parsedData,
        trades: tradesWithAccountId
      }

      showToast(`Reporte procesado localmente: ${parsedData.trades.length} operaciones encontradas`, 'success')
      onSuccess(processedData)
      
    } catch (error) {
      console.error('Error al procesar archivo:', error)
      showToast('Error al procesar el archivo HTML: ' + error.message, 'error')
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
            
            {/* Mostrar datos de resumen de cuenta si están disponibles */}
            {(() => {
              const accountTrades = trades.filter(t => t.account_id === selectedAccount.id);
              if (accountTrades.length > 0 && accountTrades[0].summary) {
                const summary = accountTrades[0].summary;
                return (
                  <Card className="bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-cyan-900/20 border-purple-500/30">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-400" />
                        Resumen de Cuenta - MetaTrader
                      </CardTitle>
                      <CardDescription className="text-purple-200/70">
                        Datos extraídos del reporte oficial
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {summary.deposit && (
                          <div className="bg-gradient-to-br from-blue-900/40 to-indigo-800/30 p-4 rounded-lg border border-blue-500/30 hover:from-blue-800/50 hover:to-indigo-700/40 transition-all duration-300">
                            <div className="text-sm text-blue-300">Depósito Inicial</div>
                            <div className="text-xl font-bold text-blue-400 glow-text-cyan">
                              ${summary.deposit.toLocaleString()}
                            </div>
                          </div>
                        )}
                        
                        {summary.realizedPnl && (
                          <div className="bg-gradient-to-br from-purple-900/40 to-pink-800/30 p-4 rounded-lg border border-purple-500/30 hover:from-purple-800/50 hover:to-pink-700/40 transition-all duration-300">
                            <div className="text-sm text-purple-300">P&L Devengadas</div>
                            <div className={`text-xl font-bold ${summary.realizedPnl >= 0 ? 'text-green-400 glow-text-cyan' : 'text-red-400 glow-text-purple'}`}>
                              ${summary.realizedPnl.toLocaleString()}
                            </div>
                          </div>
                        )}
                        
                        {summary.withdrawal && (
                          <div className="bg-gradient-to-br from-red-900/40 to-rose-800/30 p-4 rounded-lg border border-red-500/30 hover:from-red-800/50 hover:to-rose-700/40 transition-all duration-300">
                            <div className="text-sm text-red-300">Retirada</div>
                            <div className="text-xl font-bold text-red-400 glow-text-purple">
                              -${summary.withdrawal.toLocaleString()}
                            </div>
                          </div>
                        )}
                        
                        {summary.netTotal && (
                          <div className="bg-gradient-to-br from-cyan-900/40 to-teal-800/30 p-4 rounded-lg border border-cyan-500/30 hover:from-cyan-800/50 hover:to-teal-700/40 transition-all duration-300">
                            <div className="text-sm text-cyan-300">Total Neto</div>
                            <div className={`text-xl font-bold ${summary.netTotal >= 0 ? 'text-green-400 glow-text-cyan' : 'text-red-400 glow-text-purple'}`}>
                              ${summary.netTotal.toLocaleString()}
                            </div>
                          </div>
                        )}
                        
                        {summary.balance && (
                          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-800/30 p-4 rounded-lg border border-indigo-500/30 hover:from-indigo-800/50 hover:to-purple-700/40 transition-all duration-300">
                            <div className="text-sm text-indigo-300">Saldo Final</div>
                            <div className="text-xl font-bold text-indigo-400 glow-text-cyan">
                              ${summary.balance.toLocaleString()}
                            </div>
                          </div>
                        )}
                        
                        {summary.capital && (
                          <div className="bg-gradient-to-br from-violet-900/40 to-purple-800/30 p-4 rounded-lg border border-violet-500/30 hover:from-violet-800/50 hover:to-purple-700/40 transition-all duration-300">
                            <div className="text-sm text-violet-300">Capital</div>
                            <div className="text-xl font-bold text-violet-400 glow-text-purple">
                              ${summary.capital.toLocaleString()}
                            </div>
                          </div>
                        )}
                        
                        {summary.freeMargin && (
                          <div className="bg-gradient-to-br from-teal-900/40 to-cyan-800/30 p-4 rounded-lg border border-teal-500/30 hover:from-teal-800/50 hover:to-cyan-700/40 transition-all duration-300">
                            <div className="text-sm text-teal-300">Margen Libre</div>
                            <div className="text-xl font-bold text-teal-400 glow-text-cyan">
                              ${summary.freeMargin.toLocaleString()}
                            </div>
                          </div>
                        )}
                        
                        {summary.profitFactor && (
                          <div className="bg-gradient-to-br from-purple-900/40 to-cyan-800/30 p-4 rounded-lg border border-purple-500/30 hover:from-purple-800/50 hover:to-cyan-700/40 transition-all duration-300">
                            <div className="text-sm text-purple-300">Profit Factor</div>
                            <div className="text-xl font-bold gradient-traderfy-text glow-text-cyan">
                              {summary.profitFactor}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              return null;
            })()}
            
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Historial de Operaciones
                {selectedAccount && (
                  <span className="text-sm font-normal text-gray-400 ml-2">- {selectedAccount.name}</span>
                )}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  <Activity className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-white">Símbolo</Label>
                    <Input
                      placeholder="Ej: EURUSD"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Dirección</Label>
                    <select className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white">
                      <option value="">Todas</option>
                      <option value="Buy">Buy</option>
                      <option value="Sell">Sell</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-white">Fecha Desde</Label>
                    <Input
                      type="date"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Fecha Hasta</Label>
                    <Input
                      type="date"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de operaciones */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-0">
                {(() => {
                  const accountTrades = selectedAccount 
                    ? trades.filter(t => t.account_id === selectedAccount.id)
                    : trades
                  
                  console.log('Trades para tabla:', accountTrades.length)
                  
                  if (accountTrades.length === 0) {
                    return (
                      <div className="p-8 text-center text-gray-400">
                        {selectedAccount 
                          ? `No hay operaciones registradas para ${selectedAccount.name}`
                          : "No hay operaciones registradas. Sube un reporte HTML para comenzar."
                        }
                      </div>
                    )
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-700">
                          <tr>
                            <th className="text-left p-4 text-white">Fecha</th>
                            <th className="text-left p-4 text-white">Símbolo</th>
                            <th className="text-left p-4 text-white">Tipo</th>
                            <th className="text-right p-4 text-white">Entrada</th>
                            <th className="text-right p-4 text-white">Cierre</th>
                            <th className="text-right p-4 text-white">Lotes</th>
                            <th className="text-right p-4 text-white">P&L</th>
                            <th className="text-right p-4 text-white">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accountTrades.map((trade, index) => (
                            <tr key={trade.id || index} className="border-b border-gray-700 hover:bg-gray-700/50">
                              <td className="p-4 text-gray-300">
                                {new Date(trade.close_time).toLocaleDateString('es-ES')}
                                <div className="text-xs text-gray-500">
                                  {new Date(trade.close_time).toLocaleTimeString('es-ES')}
                                </div>
                              </td>
                              <td className="p-4 text-white font-medium">{trade.symbol}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  trade.direction === 'Buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                                }`}>
                                  {trade.direction}
                                </span>
                              </td>
                              <td className="p-4 text-right text-gray-300">{trade.entry_price || 'N/A'}</td>
                              <td className="p-4 text-right text-gray-300">{trade.close_price || 'N/A'}</td>
                              <td className="p-4 text-right text-gray-300">{trade.lots || 'N/A'}</td>
                              <td className={`p-4 text-right font-bold ${
                                parseFloat(trade.pnl) >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                ${parseFloat(trade.pnl).toFixed(2)}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        )
      
      case 'panel-analysis':
        return (
          <div className="space-y-6">
            <MetricsCards 
              trades={trades.filter(t => selectedAccount ? t.account_id === selectedAccount.id : true)} 
              title={selectedAccount ? `Análisis Completo de ${selectedAccount.name}` : "Análisis General"} 
            />
            
            {/* Análisis por símbolo */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Rendimiento por Símbolo</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const accountTrades = selectedAccount 
                    ? trades.filter(t => t.account_id === selectedAccount.id)
                    : trades
                  
                  if (accountTrades.length === 0) {
                    return <div className="text-gray-400">No hay datos disponibles para análisis</div>
                  }

                  // Agrupar por símbolo
                  const symbolStats = accountTrades.reduce((acc, trade) => {
                    if (!acc[trade.symbol]) {
                      acc[trade.symbol] = {
                        symbol: trade.symbol,
                        trades: []
                      }
                    }
                    acc[trade.symbol].trades.push(trade)
                    return acc
                  }, {})

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.values(symbolStats).map(({ symbol, trades: symbolTrades }) => {
                        const winningTrades = symbolTrades.filter(t => t.pnl > 0)
                        const totalPnl = symbolTrades.reduce((sum, t) => sum + parseFloat(t.pnl), 0)
                        const winRate = symbolTrades.length > 0 ? ((winningTrades.length / symbolTrades.length) * 100).toFixed(1) : 0
                        const avgTrade = symbolTrades.length > 0 ? (totalPnl / symbolTrades.length).toFixed(2) : 0

                        return (
                          <Card key={symbol} className="bg-gray-700 border-gray-600">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-white text-lg">{symbol}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Trades:</span>
                                <span className="text-white">{symbolTrades.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Win Rate:</span>
                                <span className="text-purple-400">{winRate}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">P&L Total:</span>
                                <span className={totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                  ${totalPnl.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">P&L Promedio:</span>
                                <span className={avgTrade >= 0 ? 'text-green-400' : 'text-red-400'}>
                                  ${avgTrade}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Total Lotes:</span>
                                <span className="text-cyan-400">
                                  {symbolTrades.reduce((sum, t) => sum + (parseFloat(t.lots) || 0), 0).toFixed(2)}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Análisis temporal */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Análisis Temporal</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const accountTrades = selectedAccount 
                    ? trades.filter(t => t.account_id === selectedAccount.id)
                    : trades
                  
                  if (accountTrades.length === 0) {
                    return <div className="text-gray-400">No hay datos disponibles</div>
                  }

                  // Análisis por hora
                  const hourlyStats = accountTrades.reduce((acc, trade) => {
                    const hour = new Date(trade.close_time).getHours()
                    if (!acc[hour]) {
                      acc[hour] = { trades: [], totalPnl: 0 }
                    }
                    acc[hour].trades.push(trade)
                    acc[hour].totalPnl += parseFloat(trade.pnl)
                    return acc
                  }, {})

                  // Análisis por día de la semana
                  const weekdayStats = accountTrades.reduce((acc, trade) => {
                    const weekday = new Date(trade.close_time).getDay()
                    const weekdayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
                    const dayName = weekdayNames[weekday]
                    if (!acc[dayName]) {
                      acc[dayName] = { trades: [], totalPnl: 0 }
                    }
                    acc[dayName].trades.push(trade)
                    acc[dayName].totalPnl += parseFloat(trade.pnl)
                    return acc
                  }, {})

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Análisis por día de la semana */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Rendimiento por Día de la Semana</h3>
                        <div className="space-y-2">
                          {Object.entries(weekdayStats).map(([day, stats]) => (
                            <div key={day} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                              <div>
                                <span className="text-white font-medium">{day}</span>
                                <div className="text-xs text-gray-400">{stats.trades.length} trades</div>
                              </div>
                              <div className="text-right">
                                <div className={`font-bold ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  ${stats.totalPnl.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {stats.trades.length > 0 ? 
                                    `${((stats.trades.filter(t => t.pnl > 0).length / stats.trades.length) * 100).toFixed(1)}% WR` : 
                                    '0% WR'
                                  }
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mejores horas de trading */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Mejores Horas de Trading</h3>
                        <div className="space-y-2">
                          {Object.entries(hourlyStats)
                            .sort(([,a], [,b]) => b.totalPnl - a.totalPnl)
                            .slice(0, 8)
                            .map(([hour, stats]) => (
                              <div key={hour} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                                <div>
                                  <span className="text-white font-medium">{hour}:00 - {parseInt(hour) + 1}:00</span>
                                  <div className="text-xs text-gray-400">{stats.trades.length} trades</div>
                                </div>
                                <div className="text-right">
                                  <div className={`font-bold ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ${stats.totalPnl.toFixed(2)}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {stats.trades.length > 0 ? 
                                      `${((stats.trades.filter(t => t.pnl > 0).length / stats.trades.length) * 100).toFixed(1)}% WR` : 
                                      '0% WR'
                                    }
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Métricas de riesgo */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Análisis de Riesgo</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const accountTrades = selectedAccount 
                    ? trades.filter(t => t.account_id === selectedAccount.id)
                    : trades
                  
                  if (accountTrades.length === 0) {
                    return <div className="text-gray-400">No hay datos disponibles</div>
                  }

                  const sortedPnl = accountTrades.map(t => parseFloat(t.pnl)).sort((a, b) => a - b)
                  const winningTrades = accountTrades.filter(t => t.pnl > 0)
                  const losingTrades = accountTrades.filter(t => t.pnl < 0)

                  // Calcular métricas de riesgo
                  const maxDrawdown = Math.min(...sortedPnl)
                  const maxProfit = Math.max(...sortedPnl)
                  const consecutiveWins = calculateConsecutiveStreaks(accountTrades, true)
                  const consecutiveLosses = calculateConsecutiveStreaks(accountTrades, false)

                  function calculateConsecutiveStreaks(trades, forWins) {
                    let maxStreak = 0
                    let currentStreak = 0
                    
                    trades.forEach(trade => {
                      if ((forWins && trade.pnl > 0) || (!forWins && trade.pnl < 0)) {
                        currentStreak++
                        maxStreak = Math.max(maxStreak, currentStreak)
                      } else {
                        currentStreak = 0
                      }
                    })
                    
                    return maxStreak
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gray-700 border-gray-600">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-400">Máximo Drawdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold text-red-400">${maxDrawdown.toFixed(2)}</div>
                          <div className="text-xs text-gray-400">Mayor pérdida individual</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-700 border-gray-600">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-400">Máximo Beneficio</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold text-green-400">${maxProfit.toFixed(2)}</div>
                          <div className="text-xs text-gray-400">Mayor ganancia individual</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-700 border-gray-600">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-400">Risk-Reward Ratio</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold text-purple-400">
                            {winningTrades.length > 0 && losingTrades.length > 0 ? 
                              ((winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length) / 
                               Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)).toFixed(2) : 
                              'N/A'
                            }
                          </div>
                          <div className="text-xs text-gray-400">Relación beneficio/riesgo</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-700 border-gray-600">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-400">Rachas Ganadoras</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold text-green-400">{consecutiveWins}</div>
                          <div className="text-xs text-gray-400">Máxima racha de victorias</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-700 border-gray-600">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-400">Rachas Perdedoras</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold text-red-400">{consecutiveLosses}</div>
                          <div className="text-xs text-gray-400">Máxima racha de pérdidas</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-700 border-gray-600">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-400">Expectativa</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold text-cyan-400">
                            ${accountTrades.length > 0 ? 
                              (accountTrades.reduce((sum, t) => sum + parseFloat(t.pnl), 0) / accountTrades.length).toFixed(2) : 
                              '0.00'
                            }
                          </div>
                          <div className="text-xs text-gray-400">P&L esperado por trade</div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}
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
        
        <div className="flex-1 gradient-sidebar overflow-auto">
          <div className="max-w-7xl mx-auto p-6 animate-fade-in-up">
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