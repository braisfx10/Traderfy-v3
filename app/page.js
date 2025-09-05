'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { useAuth } from '../components/AuthProvider'
import { AuthModal } from '../components/AuthModal'
import AccountManager from '../components/AccountManager'
import StudentsManager from '../components/StudentsManager'
import MentorSelector from '../components/MentorSelector'
import TradeJournalModal from '../components/TradeJournalModal'
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
  PieChart as PieChartIcon, 
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
  Trash2,
  Clock,
  TrendingDown,
  Trophy,
  XCircle,
  Users,
  BookOpen
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'

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

// Componente de operaciones con filtros funcionales
const OperationsPanel = ({ trades = [], selectedAccount, selectedTradeForJournal, setSelectedTradeForJournal }) => {
  const [symbolFilter, setSymbolFilter] = useState('')
  const [directionFilter, setDirectionFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const tradesPerPage = 10

  const accountTrades = selectedAccount 
    ? trades.filter(t => t.account_id === selectedAccount.id)
    : trades

  // Aplicar filtros
  let filteredTrades = accountTrades

  if (symbolFilter) {
    filteredTrades = filteredTrades.filter(t => 
      t.symbol && t.symbol.toLowerCase().includes(symbolFilter.toLowerCase())
    )
  }

  if (directionFilter) {
    filteredTrades = filteredTrades.filter(t => t.direction === directionFilter)
  }

  if (dateFromFilter) {
    filteredTrades = filteredTrades.filter(t => 
      new Date(t.close_time) >= new Date(dateFromFilter)
    )
  }

  if (dateToFilter) {
    filteredTrades = filteredTrades.filter(t => 
      new Date(t.close_time) <= new Date(dateToFilter)
    )
  }

  const paginatedTrades = filteredTrades.slice(
    currentPage * tradesPerPage,
    (currentPage + 1) * tradesPerPage
  )

  const totalPages = Math.ceil(filteredTrades.length / tradesPerPage)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0)
  }, [symbolFilter, directionFilter, dateFromFilter, dateToFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          Historial de Operaciones
          {selectedAccount && (
            <span className="text-sm font-normal text-purple-200/70 ml-2">- {selectedAccount.name}</span>
          )}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-purple-500/30 hover:bg-purple-500/10">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="border-cyan-500/30 hover:bg-cyan-500/10">
            <Activity className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros con diseño unificado */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-400/10 border-purple-500/30 hover:from-purple-500/15 hover:to-cyan-400/15 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-400" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-purple-300">Símbolo</Label>
              <Input
                placeholder="Ej: EURUSD"
                value={symbolFilter}
                onChange={(e) => setSymbolFilter(e.target.value)}
                className="bg-gradient-to-r from-slate-800 to-slate-700 border-purple-500/50 text-white placeholder:text-slate-400 focus:border-purple-400 focus:ring-purple-400/20 hover:border-purple-400/70"
              />
            </div>
            <div>
              <Label className="text-cyan-300">Dirección</Label>
              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value)}
                className="w-full p-2 bg-gradient-to-r from-slate-800 to-slate-700 border border-cyan-500/50 rounded text-white focus:border-cyan-400 focus:ring-cyan-400/20 hover:border-cyan-400/70"
              >
                <option value="" className="bg-slate-800 text-white">Todas</option>
                <option value="Buy" className="bg-slate-800 text-white">Buy</option>
                <option value="Sell" className="bg-slate-800 text-white">Sell</option>
              </select>
            </div>
            <div>
              <Label className="text-indigo-300">Fecha Desde</Label>
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="bg-gradient-to-r from-slate-800 to-slate-700 border-indigo-500/50 text-white focus:border-indigo-400 focus:ring-indigo-400/20 hover:border-indigo-400/70"
              />
            </div>
            <div>
              <Label className="text-purple-300">Fecha Hasta</Label>
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="bg-gradient-to-r from-slate-800 to-slate-700 border-purple-500/50 text-white focus:border-purple-400 focus:ring-purple-400/20 hover:border-purple-400/70"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de operaciones con diseño unificado */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-400/10 border-cyan-500/30 hover:from-purple-500/15 hover:to-cyan-400/15 transition-all duration-300">
        <CardContent className="p-0">
          {filteredTrades.length === 0 ? (
            <div className="p-8 text-center text-purple-200/70">
              {symbolFilter || directionFilter || dateFromFilter || dateToFilter ? 
                "No se encontraron operaciones con los filtros aplicados" :
                selectedAccount 
                  ? `No hay operaciones registradas para ${selectedAccount.name}`
                  : "No hay operaciones registradas. Sube un reporte HTML para comenzar."
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-500/20 to-cyan-400/20">
                  <tr>
                    <th className="text-left p-4 text-purple-200">Fecha</th>
                    <th className="text-left p-4 text-cyan-200">Símbolo</th>
                    <th className="text-left p-4 text-indigo-200">Tipo</th>
                    <th className="text-right p-4 text-purple-200">Entrada</th>
                    <th className="text-right p-4 text-cyan-200">Cierre</th>
                    <th className="text-right p-4 text-indigo-200">Lotes</th>
                    <th className="text-right p-4 text-purple-200">P&L</th>
                    <th className="text-right p-4 text-cyan-200">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTrades.map((trade, index) => (
                    <tr key={trade.id || index} className="border-b border-purple-500/20 hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-cyan-400/5 transition-all duration-200">
                      <td className="p-4 text-gray-300">
                        {new Date(trade.close_time).toLocaleDateString('es-ES')}
                        <div className="text-xs text-gray-500">
                          {new Date(trade.close_time).toLocaleTimeString('es-ES')}
                        </div>
                      </td>
                      <td className="p-4 text-white font-medium">{trade.symbol}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.direction === 'Buy' ? 'bg-green-600/80 text-white' : 'bg-red-600/80 text-white'
                        }`}>
                          {trade.direction}
                        </span>
                      </td>
                      <td className="p-4 text-right text-gray-300">{trade.entry_price || 'N/A'}</td>
                      <td className="p-4 text-right text-gray-300">{trade.close_price || 'N/A'}</td>
                      <td className="p-4 text-right text-gray-300">{trade.lots || 'N/A'}</td>
                      <td className={`p-4 text-right font-bold ${
                        parseFloat(trade.pnl) >= 0 ? 'text-green-400 glow-text-cyan' : 'text-red-400 glow-text-purple'
                      }`}>
                        ${parseFloat(trade.pnl).toFixed(2)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedTradeForJournal(trade)}
                            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                            title="Abrir Journal"
                          >
                            <BookOpen className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-purple-200/70">
            Mostrando {currentPage * tradesPerPage + 1} - {Math.min((currentPage + 1) * tradesPerPage, filteredTrades.length)} de {filteredTrades.length} operaciones
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="border-purple-500/30 hover:bg-purple-500/10 disabled:opacity-50"
            >
              Anterior
            </Button>
            <span className="flex items-center px-4 text-white">
              {currentPage + 1} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages - 1}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="border-cyan-500/30 hover:bg-cyan-500/10 disabled:opacity-50"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente del Sidebar
const Sidebar = ({ 
  isCollapsed, 
  setIsCollapsed, 
  accounts, 
  selectedAccount, 
  setSelectedAccount,
  currentView,
  setCurrentView,
  onLogout,
  user,
  demoMode
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
                  { key: 'panel-analysis', label: 'Análisis', icon: PieChartIcon }
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

        {/* Sección Alumnos - Solo para Mentores y Admins */}
        {(user?.role === 'Mentor' || user?.role === 'Admin' || (!user && demoMode)) && (
          <Button
            variant="ghost"
            className={`w-full justify-start gap-2 sidebar-item transition-all duration-300 ${
              currentView === 'students' 
                ? 'bg-gradient-to-r from-purple-500/20 to-cyan-400/20 text-white border-l-2 border-purple-500 glow-purple' 
                : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-cyan-400/10'
            }`}
            onClick={() => setCurrentView('students')}
          >
            <Users className="w-4 h-4" />
            {!isCollapsed && <span>Alumnos</span>}
          </Button>
        )}

        {/* Selector de Mentor - Solo para Alumnos */}
        {(user?.role === 'Alumno' || (!user && demoMode)) && (
          <Button
            variant="ghost"
            className={`w-full justify-start gap-2 sidebar-item transition-all duration-300 ${
              currentView === 'mentor-selection' 
                ? 'bg-gradient-to-r from-purple-500/20 to-cyan-400/20 text-white border-l-2 border-purple-500 glow-purple' 
                : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-cyan-400/10'
            }`}
            onClick={() => setCurrentView('mentor-selection')}
          >
            <Target className="w-4 h-4" />
            {!isCollapsed && <span>Mentor</span>}
          </Button>
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
const TradingCalendar = ({ trades = [], selectedAccount, setSelectedTradeForJournal }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [viewMode, setViewMode] = useState('month') // 'month' o 'year'
  
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

  // Calcular estadísticas mensuales
  const calculateMonthlyStats = () => {
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    // Filtrar trades del mes actual
    const monthlyTrades = accountTrades.filter(trade => {
      const tradeDate = new Date(trade.close_time)
      return tradeDate.getMonth() === currentMonth && tradeDate.getFullYear() === currentYear
    })
    
    const totalPnL = monthlyTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl), 0)
    const winningDays = Object.values(tradesByDay).filter(day => {
      const dayDate = new Date(Object.keys(tradesByDay).find(date => tradesByDay[date] === day))
      return dayDate.getMonth() === currentMonth && dayDate.getFullYear() === currentYear && day.totalPnl > 0
    }).length
    
    const losingDays = Object.values(tradesByDay).filter(day => {
      const dayDate = new Date(Object.keys(tradesByDay).find(date => tradesByDay[date] === day))
      return dayDate.getMonth() === currentMonth && dayDate.getFullYear() === currentYear && day.totalPnl < 0
    }).length
    
    return {
      totalTrades: monthlyTrades.length,
      totalPnL,
      winningDays,
      losingDays,
      monthlyTrades
    }
  }

  const monthlyStats = calculateMonthlyStats()

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
    
    let bgColor = 'bg-gradient-to-br from-slate-800/30 to-slate-700/20 border-slate-600/30 hover:from-slate-700/40 hover:to-slate-600/30'
    let textColor = 'text-slate-300'
    
    if (dayData) {
      if (dayData.totalPnl > 0) {
        bgColor = 'bg-gradient-to-br from-green-900/50 to-emerald-800/40 border border-green-500/50 hover:from-green-800/60 hover:to-emerald-700/50'
        textColor = 'text-green-100'
      } else if (dayData.totalPnl < 0) {
        bgColor = 'bg-gradient-to-br from-red-900/50 to-rose-800/40 border border-red-500/50 hover:from-red-800/60 hover:to-rose-700/50'
        textColor = 'text-red-100'
      }
    }

    return (
      <div
        key={day}
        className={`min-h-[80px] p-2 rounded-lg trading-calendar-day cursor-pointer transition-all duration-300 ${bgColor} ${textColor} hover:scale-105 border`}
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
      <Card className="bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-cyan-900/20 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Calendario de Trading
              {selectedAccount && (
                <span className="text-sm font-normal text-purple-200/70">- {selectedAccount.name}</span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)} className="border-purple-500/30 hover:bg-purple-500/10">
                ←
              </Button>
              <span className="text-white font-medium px-4">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateMonth(1)} className="border-purple-500/30 hover:bg-purple-500/10">
                →
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setViewMode(viewMode === 'month' ? 'year' : 'month')}
                className="border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-300 ml-2"
              >
                {viewMode === 'month' ? 'Vista Anual' : 'Vista Mensual'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tabla de estadísticas mensuales */}
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 rounded-lg border border-purple-500/30">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Resumen del Mes - {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gradient-to-br from-purple-500/20 to-indigo-600/10 rounded-lg border border-purple-500/20">
                <div className={`text-2xl font-bold ${monthlyStats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${monthlyStats.totalPnL.toFixed(2)}
                </div>
                <div className="text-sm text-purple-200/70">P&L Mensual</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/10 rounded-lg border border-cyan-500/20">
                <div className="text-2xl font-bold text-white">{monthlyStats.totalTrades}</div>
                <div className="text-sm text-cyan-200/70">Total Trades</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-green-500/20 to-emerald-600/10 rounded-lg border border-green-500/20">
                <div className="text-2xl font-bold text-green-400">{monthlyStats.winningDays}</div>
                <div className="text-sm text-green-200/70">Días Ganadores</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-red-500/20 to-rose-600/10 rounded-lg border border-red-500/20">
                <div className="text-2xl font-bold text-red-400">{monthlyStats.losingDays}</div>
                <div className="text-sm text-red-200/70">Días Perdedores</div>
              </div>
            </div>
          </div>
          
          {/* Vista Anual o Mensual */}
          {viewMode === 'year' ? (
            /* Vista Anual - Muestra los 12 meses del año */
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white text-center mb-4">Año {currentDate.getFullYear()}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }, (_, monthIndex) => {
                  const monthDate = new Date(currentDate.getFullYear(), monthIndex, 1)
                  const monthName = monthNames[monthIndex]
                  
                  // Calcular estadísticas del mes
                  const monthTrades = accountTrades.filter(trade => {
                    const tradeDate = new Date(trade.close_time)
                    return tradeDate.getMonth() === monthIndex && tradeDate.getFullYear() === currentDate.getFullYear()
                  })
                  
                  const monthPnL = monthTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl), 0)
                  const isCurrentMonth = monthIndex === currentDate.getMonth()
                  
                  return (
                    <Card 
                      key={monthIndex}
                      className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                        isCurrentMonth 
                          ? 'bg-gradient-to-br from-purple-500/30 to-cyan-500/20 border-purple-400/50' 
                          : 'bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/30 hover:border-purple-400/40'
                      }`}
                      onClick={() => {
                        setCurrentDate(monthDate)
                        setViewMode('month')
                      }}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="font-semibold text-white mb-2">{monthName}</div>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-300">{monthTrades.length} trades</div>
                          <div className={`text-lg font-bold ${
                            monthPnL > 0 ? 'text-green-400' : 
                            monthPnL < 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            ${monthPnL.toFixed(2)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Vista Mensual - Calendario tradicional con resúmenes semanales */
            <div className="space-y-4">
              <div className="grid grid-cols-8 gap-1 mb-4">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Semana'].map(day => (
                  <div key={day} className="text-center text-purple-300 font-medium py-2 text-sm">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-8 gap-1">
                {/* Calcular semanas del mes */}
                {(() => {
                  const weeks = []
                  let currentWeek = []
                  
                  // Añadir días vacíos del inicio
                  for (let i = 0; i < startingDayOfWeek; i++) {
                    currentWeek.push(null)
                  }
                  
                  // Añadir días del mes
                  for (let day = 1; day <= daysInMonth; day++) {
                    currentWeek.push(day)
                    
                    // Si completamos la semana o es el último día
                    if (currentWeek.length === 7 || day === daysInMonth) {
                      // Completar semana con nulls si es necesario
                      while (currentWeek.length < 7) {
                        currentWeek.push(null)
                      }
                      weeks.push([...currentWeek])
                      currentWeek = []
                    }
                  }
                  
                  return weeks.map((week, weekIndex) => {
                    // Calcular estadísticas de la semana
                    const weekTrades = week.filter(day => day !== null).flatMap(day => {
                      const dateKey = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
                      return tradesByDay[dateKey]?.trades || []
                    })
                    
                    const weekPnL = weekTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl), 0)
                    
                    return (
                      <React.Fragment key={weekIndex}>
                        {/* Días de la semana */}
                        {week.map((day, dayIndex) => (
                          <div key={`${weekIndex}-${dayIndex}`}>
                            {day ? renderCalendarDay(day) : <div className="min-h-[80px]" />}
                          </div>
                        ))}
                        
                        {/* Resumen semanal */}
                        <div className="min-h-[80px] p-2 bg-gradient-to-br from-indigo-900/30 to-purple-900/20 border border-indigo-500/30 rounded-lg flex flex-col justify-center items-center">
                          <div className="text-xs text-indigo-200/70 mb-1">Semana {weekIndex + 1}</div>
                          <div className="text-sm text-white font-medium">{weekTrades.length} trades</div>
                          <div className={`text-sm font-bold ${
                            weekPnL > 0 ? 'text-green-400' : 
                            weekPnL < 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            ${weekPnL.toFixed(2)}
                          </div>
                        </div>
                      </React.Fragment>
                    )
                  })
                })()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal emergente de detalles del día */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedDay(null)}>
          <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-purple-500/30 shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-cyan-400/10 border-b border-purple-500/20">
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
                <Button variant="ghost" size="sm" onClick={() => setSelectedDay(null)} className="text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-cyan-400/20">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {/* Resumen del día */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-gradient-to-br from-purple-500/20 to-indigo-600/10 p-4 rounded-lg border border-purple-500/30">
                    <div className="text-2xl font-bold text-white">{selectedDay.trades.length}</div>
                    <div className="text-sm text-purple-200/70">Total Trades</div>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/10 p-4 rounded-lg border border-cyan-500/30">
                    <div className={`text-2xl font-bold ${selectedDay.totalPnl >= 0 ? 'text-green-400 glow-text-cyan' : 'text-red-400 glow-text-purple'}`}>
                      ${selectedDay.totalPnl.toFixed(2)}
                    </div>
                    <div className="text-sm text-cyan-200/70">P&L Total</div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-500/20 to-purple-600/10 p-4 rounded-lg border border-indigo-500/30">
                    <div className="text-2xl font-bold text-purple-400">
                      {selectedDay.trades.length > 0 ? ((selectedDay.trades.filter(t => t.pnl > 0).length / selectedDay.trades.length) * 100).toFixed(1) : 0}%
                    </div>
                    <div className="text-sm text-indigo-200/70">Win Rate</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/10 p-4 rounded-lg border border-green-500/30">
                    <div className="text-2xl font-bold text-cyan-400">
                      {selectedDay.trades.reduce((sum, t) => sum + (t.lots || 0), 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-green-200/70">Total Lotes</div>
                  </div>
                </div>

                {/* Lista detallada de trades */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    Operaciones del Día
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {selectedDay.trades.map((trade, index) => (
                      <div key={trade.id || index} className="bg-gradient-to-r from-slate-700/50 to-slate-600/30 p-4 rounded-lg border border-purple-500/20 hover:from-slate-600/60 hover:to-slate-500/40 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-lg">{trade.symbol}</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                trade.direction === 'Buy' ? 'bg-gradient-to-r from-green-600 to-green-500 text-white' : 'bg-gradient-to-r from-red-600 to-red-500 text-white'
                              }`}>
                                {trade.direction}
                              </span>
                            </div>
                            <div className="text-purple-200/70">
                              <div className="text-sm">
                                <span className="text-purple-300">Entrada:</span> {trade.entry_price || 'N/A'}
                              </div>
                              <div className="text-sm">
                                <span className="text-purple-300">Cierre:</span> {trade.close_price || 'N/A'}
                              </div>
                            </div>
                            <div className="text-cyan-200/70">
                              <div className="text-sm">
                                <span className="text-cyan-300">Lotes:</span> {trade.lots || 'N/A'}
                              </div>
                              <div className="text-sm">
                                <span className="text-cyan-300">Hora:</span> {new Date(trade.close_time).toLocaleTimeString('es-ES')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-right">
                              <div className={`text-xl font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ${parseFloat(trade.pnl).toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-400">
                                {trade.pnl >= 0 ? 'Ganancia' : 'Pérdida'}
                              </div>
                            </div>
                            <div className="ml-4">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setSelectedTradeForJournal?.(trade)}
                                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400/50"
                                title="Abrir Journal"
                              >
                                <BookOpen className="w-4 h-4 mr-1" />
                                Journal
                              </Button>
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
const MetricsCards = ({ trades = [], title = "Métricas Generales", accounts = [], onAccountSelect }) => {
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

  // Agrupar cuentas por etiquetas
  const groupedAccounts = accounts.reduce((groups, account) => {
    const tag = account.tag || 'Sin Etiqueta'
    if (!groups[tag]) {
      groups[tag] = []
    }
    groups[tag].push(account)
    return groups
  }, {})

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      
      {/* Sección de etiquetas organizadoras */}
      {accounts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Organizar por Etiquetas
          </h3>
          <div className="space-y-2">
            {Object.entries(groupedAccounts).map(([tag, tagAccounts]) => (
              <Card key={tag} className="bg-gradient-to-r from-slate-800/50 to-slate-700/30 border-purple-500/20 hover:border-purple-400/40 transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        tag === 'Live' ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-500/30' :
                        tag === 'Demo' ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-500/30' :
                        tag === 'Funded' ? 'bg-purple-400/20 text-purple-400 border border-purple-500/30' :
                        'bg-gray-400/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {tag}
                      </span>
                      <span className="text-sm text-gray-300">{tagAccounts.length} cuenta{tagAccounts.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {tagAccounts.map((account) => (
                      <Button
                        key={account.id}
                        variant="ghost"
                        size="sm"
                        className="justify-start p-2 h-auto text-left hover:bg-purple-500/10 border border-transparent hover:border-purple-500/30 transition-all duration-200"
                        onClick={() => onAccountSelect && onAccountSelect(account)}
                      >
                        <div>
                          <div className="text-sm font-medium text-white">{account.name}</div>
                          <div className="text-xs text-gray-400">Haz clic para ver métricas</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-400/10 border-purple-500/30 hover:from-purple-500/20 hover:to-cyan-400/20 transition-all duration-300 hover:scale-105 hover:border-purple-400/50">
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
        
        <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-400/10 border-cyan-500/30 hover:from-purple-500/20 hover:to-cyan-400/20 transition-all duration-300 hover:scale-105 hover:border-cyan-400/50">
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
        
        <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-400/10 border-indigo-500/30 hover:from-purple-500/20 hover:to-cyan-400/20 transition-all duration-300 hover:scale-105 hover:border-indigo-400/50">
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
        
        <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-400/10 border-purple-500/30 hover:from-purple-500/20 hover:to-cyan-400/20 transition-all duration-300 hover:scale-105 hover:border-cyan-400/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Profit Factor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-traderfy-text">{stats.profitFactor}</div>
            <div className="text-xs text-purple-200/70">Beneficios / Pérdidas</div>
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
    <Card className="bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-cyan-900/20 border-purple-500/30 hover:from-purple-500/15 hover:to-cyan-400/15 transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-purple-400" />
          Subir Reporte HTML
          {selectedAccount && (
            <span className="text-sm font-normal text-purple-200/70">- {selectedAccount.name}</span>
          )}
        </CardTitle>
        <CardDescription className="text-purple-200/70">
          Sube tu reporte de MetaTrader 4/5 o cTrader para procesarlo automáticamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!selectedAccount ? (
            <div className="p-4 bg-gradient-to-r from-yellow-900/30 to-orange-800/20 border border-yellow-500/50 rounded-lg">
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
                <Label htmlFor="html-file" className="text-purple-300">
                  Seleccionar archivo HTML
                </Label>
                <Input
                  id="html-file"
                  type="file"
                  accept=".html,.htm"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="bg-gradient-to-r from-slate-800 to-slate-700 border-purple-500/50 text-white file:bg-gradient-to-r file:from-purple-600 file:to-cyan-500 file:text-white file:border-0 file:rounded-lg file:px-6 file:py-3 file:mr-4 file:font-medium file:shadow-lg file:hover:from-purple-700 file:hover:to-cyan-600 file:transition-all file:duration-300 hover:border-purple-400 focus:border-purple-400 focus:ring-purple-400/20 cursor-pointer"
                />
              </div>
              {isUploading && (
                <div className="text-purple-400 text-sm flex items-center gap-2">
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
                    <li>https://trading-metrics-4.preview.emergentagent.com/**</li>
                    <li>https://trading-metrics-4.preview.emergentagent.com/auth/callback</li>
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
  const { user, loading: authLoading, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedTradeForJournal, setSelectedTradeForJournal] = useState(null)
  
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

  const handleAccountSelect = (account) => {
    setSelectedAccount(account)
    setCurrentView('panel-summary')
  }

  // Solución simple y definitiva para evitar bucles infinitos
  useEffect(() => {
    // Solo ejecutar cuando authLoading haya terminado
    if (authLoading) return;
    
    // Configuración inicial solo una vez
    if (!supabase) {
      setAccounts([
        { id: '1', name: 'FTT Funded 15K', tag: 'Funded', user_id: 'demo' },
        { id: '2', name: 'FTMO Challenge 100K', tag: 'Demo', user_id: 'demo' },
        { id: '3', name: 'Prop Firm Live', tag: 'Live', user_id: 'demo' }
      ])
      
      // Añadir algunos trades de ejemplo con IDs únicos para poder probar el Journal
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      const dayBefore = new Date(today)
      dayBefore.setDate(today.getDate() - 2)
      
      setTrades([
        {
          id: 'trade_demo_1',
          symbol: 'EURUSD',
          direction: 'Buy',
          close_time: yesterday.toISOString(),
          entry_price: 1.0850,
          close_price: 1.0890,
          lots: 0.10,
          pnl: 40.00,
          account_id: '2',
          user_id: 'demo'
        },
        {
          id: 'trade_demo_2', 
          symbol: 'GBPUSD',
          direction: 'Sell',
          close_time: yesterday.toISOString(),
          entry_price: 1.2650,
          close_price: 1.2620,
          lots: 0.15,
          pnl: 45.00,
          account_id: '2',
          user_id: 'demo'
        },
        {
          id: 'trade_demo_3',
          symbol: 'AUDUSD', 
          direction: 'Buy',
          close_time: dayBefore.toISOString(),
          entry_price: 0.6580,
          close_price: 0.6555,
          lots: 0.20,
          pnl: -50.00,
          account_id: '2',
          user_id: 'demo'
        }
      ])
      
      setDemoMode(true)
    }
    
    // Establecer loading como false inmediatamente después de authLoading
    setLoading(false)
    
    // Mostrar modal de auth solo si es necesario
    setTimeout(() => {
      if (!user && !demoMode && supabase) {
        setShowAuthModal(true)
      }
    }, 500)
  }, [authLoading]) // Solo depender de authLoading

  const handleLogout = async () => {
    try {
      await signOut()
      setSelectedAccount(null)
      setTrades([])
      setCurrentView('accounts-summary')
      setDemoMode(false)  // Reset demo mode on logout
      showToast('Sesión cerrada exitosamente', 'success')
    } catch (error) {
      console.error('Error during logout:', error)
      showToast('Error al cerrar sesión', 'error')
    }
  }

  const handleUploadSuccess = (data) => {
    console.log('handleUploadSuccess called with:', data)
    console.log('Number of trades to add:', data.trades?.length)
    console.log('Summary data:', data.summary)
    
    // Agregar los nuevos trades al estado global
    setTrades(prevTrades => {
      const newTrades = [...prevTrades, ...data.trades]
      console.log('Previous trades:', prevTrades.length)
      console.log('New trades total:', newTrades.length)
      console.log('Sample trade:', data.trades[0])
      return newTrades
    })
    
    // Actualizar la cuenta seleccionada con la información del summary
    if (data.summary && selectedAccount) {
      setAccounts(prevAccounts => 
        prevAccounts.map(account => 
          account.id === selectedAccount.id 
            ? { ...account, summary: data.summary }
            : account
        )
      )
      
      // También actualizar selectedAccount directamente
      setSelectedAccount(prev => ({ ...prev, summary: data.summary }))
      
      console.log('Updated account with summary:', {
        accountId: selectedAccount.id,
        deposit: data.summary.deposit,
        balance: data.summary.balance,
        realizedPnl: data.summary.realizedPnl
      })
    }
    
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

  if (loading || authLoading) {
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
            <MetricsCards trades={trades} title="Resumen Total de Todas las Cuentas" accounts={accounts} onAccountSelect={handleAccountSelect} />
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
        return <AccountManager user={user || { id: 'demo' }} onAccountsChange={setAccounts} />
      
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
            
            {/* Gráficos de Panel de Cuenta - Resumen */}
            {(() => {
              const accountTrades = trades.filter(t => t.account_id === selectedAccount.id);
              if (accountTrades.length === 0) return null;
              
              // Obtener balance inicial de la cuenta correctamente
              // Prioridad: deposit > capital > valor por defecto
              const initialBalance = selectedAccount.summary?.deposit || 
                                   selectedAccount.summary?.capital ||
                                   selectedAccount.summary?.balance ||
                                   15000; // Default basado en logs del backend
              
              console.log('Balance inicial detectado:', initialBalance)
              console.log('Summary completo:', selectedAccount.summary)
              
              // Procesar trades para detectar withdraws y dividir tipos de movimientos
              const processedTrades = accountTrades.map(trade => {
                const pnl = parseFloat(trade.pnl);
                // Detectar withdraws (grandes cantidades negativas que no son pérdidas normales)
                // Asumimos que withdraws son cantidades superiores a $500 negativos
                const isWithdraw = pnl < -500; // Ajustar este valor según sea necesario
                
                return {
                  ...trade,
                  pnl: pnl,
                  isWithdraw: isWithdraw,
                  close_time: new Date(trade.close_time)
                };
              });

              // Preparar datos para gráfico de evolución de beneficio (empezar siempre desde 0%)
              const tradesByDate = {};
              
              // Agrupar trades por fecha
              processedTrades.forEach(trade => {
                const dateKey = trade.close_time.toDateString();
                if (!tradesByDate[dateKey]) {
                  tradesByDate[dateKey] = [];
                }
                tradesByDate[dateKey].push(trade);
              });
              
              // Crear datos ordenados por fecha
              const sortedDates = Object.keys(tradesByDate).sort((a, b) => new Date(a) - new Date(b));
              let cumulativePnL = 0;
              let cumulativeWithdraws = 0;
              let runningBalance = initialBalance;
              let peak = initialBalance;
              let maxDrawdownPercent = 0;
              
              // Agregar punto inicial en 0%
              const evolutionData = [{
                date: 'Inicio',
                profitPercent: 0,
                pnlDollars: 0,
                balance: initialBalance,
                peak: initialBalance,
                isStart: true
              }];
              
              sortedDates.forEach(dateKey => {
                const dayTrades = tradesByDate[dateKey];
                
                // Separar trades normales de withdraws
                const normalTrades = dayTrades.filter(t => !t.isWithdraw);
                const withdrawTrades = dayTrades.filter(t => t.isWithdraw);
                
                const dayPnL = normalTrades.reduce((sum, trade) => sum + trade.pnl, 0);
                const dayWithdraws = withdrawTrades.reduce((sum, trade) => sum + trade.pnl, 0);
                
                cumulativePnL += dayPnL;
                cumulativeWithdraws += dayWithdraws;
                runningBalance = initialBalance + cumulativePnL + cumulativeWithdraws;
                
                // Actualizar peak solo con trading normal (sin withdraws)
                const tradingBalance = initialBalance + cumulativePnL;
                if (tradingBalance > peak) peak = tradingBalance;
                
                // Calcular profit como porcentaje del balance inicial (sin incluir withdraws)
                const profitPercent = (cumulativePnL / initialBalance) * 100;
                
                evolutionData.push({
                  date: new Date(dateKey).toLocaleDateString('es-ES'),
                  profitPercent: profitPercent,
                  pnlDollars: cumulativePnL,
                  withdraws: cumulativeWithdraws,
                  balance: runningBalance,
                  tradingBalance: tradingBalance,
                  peak: peak,
                  dateKey: dateKey,
                  hasWithdraws: dayWithdraws !== 0
                });
              });
              
              // Calcular drawdown correctamente (solo basado en trading, sin withdraws)
              const drawdownData = [];
              let currentPeak = initialBalance;
              
              evolutionData.forEach(point => {
                const tradingBalance = point.tradingBalance || point.balance;
                
                // Actualizar peak solo con balance de trading
                if (tradingBalance > currentPeak) {
                  currentPeak = tradingBalance;
                }
                
                // Drawdown = (Peak - Current Trading Balance) / Peak * 100 (negativo)
                const drawdownPercent = currentPeak > 0 ? -((currentPeak - tradingBalance) / currentPeak) * 100 : 0;
                
                if (Math.abs(drawdownPercent) > maxDrawdownPercent) {
                  maxDrawdownPercent = Math.abs(drawdownPercent);
                }
                
                drawdownData.push({
                  date: point.date,
                  drawdownPercent: drawdownPercent,
                  balance: tradingBalance,
                  peak: currentPeak,
                  hasWithdraws: point.hasWithdraws || false
                });
              });
              
              // Datos para gráfico de activos operados (mostrar porcentajes en lugar de números)
              const symbolStats = accountTrades.reduce((acc, trade) => {
                if (!acc[trade.symbol]) {
                  acc[trade.symbol] = { symbol: trade.symbol, trades: 0, pnl: 0 };
                }
                acc[trade.symbol].trades += 1;
                acc[trade.symbol].pnl += parseFloat(trade.pnl);
                return acc;
              }, {});
              
              const totalTrades = accountTrades.length;
              const assetsData = Object.values(symbolStats).map(stat => ({
                name: stat.symbol,
                value: stat.trades,
                percentage: ((stat.trades / totalTrades) * 100).toFixed(1),
                pnl: stat.pnl
              }));
              
              // Colores para el gráfico circular
              const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5A2B'];
              
              // Valoración de trading con la nueva fórmula especificada
              const finalProfitPercent = evolutionData.length > 1 ? evolutionData[evolutionData.length - 1].profitPercent : 0;
              const winRate = accountTrades.length > 0 ? ((accountTrades.filter(t => t.pnl > 0).length / accountTrades.length) * 100) : 0;
              
              console.log('Datos para valoración:', {
                finalProfitPercent,
                maxDrawdownPercent,
                winRate
              });
              
              // Nueva fórmula de BeneficioScore según especificación
              const calculateBeneficioScore = (beneficio) => {
                if (beneficio < 4) return 0;
                if (beneficio >= 10) return 10;
                if (beneficio >= 4 && beneficio < 10) {
                  // Escalar linealmente entre 5 y 8
                  return 5 + ((beneficio - 4) / (10 - 4)) * (8 - 5);
                }
                return 0;
              };
              
              // Nueva fórmula de DrawdownScore según especificación
              const calculateDrawdownScore = (drawdown) => {
                if (drawdown >= 10) return 0;
                if (drawdown < 4) {
                  // Escalar linealmente entre 9 y 10
                  return 9 + ((4 - drawdown) / 4) * (10 - 9);
                }
                if (drawdown >= 4 && drawdown < 7) {
                  // Escalar linealmente entre 6 y 8
                  return 6 + ((7 - drawdown) / (7 - 4)) * (8 - 6);
                }
                if (drawdown >= 7 && drawdown < 10) {
                  // Escalar linealmente entre 3 y 5
                  return 3 + ((10 - drawdown) / (10 - 7)) * (5 - 3);
                }
                return 0;
              };
              
              // Nueva fórmula de WinRateScore según especificación
              const calculateWinRateScore = (winRate) => {
                if (winRate < 30) return 2;
                if (winRate >= 70) {
                  // Escalar linealmente entre 9 y 10
                  return 9 + ((winRate - 70) / 30) * (10 - 9);
                }
                if (winRate >= 50 && winRate < 70) {
                  // Escalar linealmente entre 7 y 8
                  return 7 + ((winRate - 50) / (70 - 50)) * (8 - 7);
                }
                if (winRate >= 30 && winRate < 50) {
                  // Escalar linealmente entre 5 y 7
                  return 5 + ((winRate - 30) / (50 - 30)) * (7 - 5);
                }
                return 2;
              };
              
              // Calcular puntuaciones individuales
              const beneficioScore = calculateBeneficioScore(Math.abs(finalProfitPercent));
              const drawdownScore = calculateDrawdownScore(maxDrawdownPercent);
              const winRateScore = calculateWinRateScore(winRate);
              
              // Valoración final con pesos específicos
              const tradingScore = (beneficioScore * 0.4) + (drawdownScore * 0.4) + (winRateScore * 0.2);
              
              console.log('Scores calculados:', {
                beneficioScore,
                drawdownScore,
                winRateScore,
                tradingScore
              });
              
              return (
                <div className="mt-6 space-y-6">
                  <div className="border-t border-purple-500/30 pt-6">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <BarChart3 className="w-6 h-6 text-purple-400" />
                      Análisis Avanzado de Rendimiento
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Evolución de Beneficio en Porcentaje */}
                    <Card className="bg-gradient-to-br from-green-900/20 via-emerald-900/10 to-cyan-900/20 border-green-500/30">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-400" />
                          Evolución de Beneficio
                        </CardTitle>
                        <CardDescription className="text-green-200/70">
                          Beneficio acumulado en % del balance inicial (${initialBalance.toLocaleString()})
                          <div className="mt-1 text-xs text-yellow-300">
                            🔶 Puntos amarillos indican días con Withdraws (no afectan el cálculo de beneficio)
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={evolutionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#9CA3AF" 
                              fontSize={10}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis 
                              stroke="#9CA3AF"
                              domain={['dataMin - 1', 'dataMax + 1']}
                              tickFormatter={(value) => `${value.toFixed(1)}%`}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #10B981', borderRadius: '8px' }}
                              labelStyle={{ color: '#F3F4F6' }}
                              formatter={(value, name) => {
                                if (name === 'profitPercent') {
                                  const point = evolutionData.find(p => p.profitPercent === value);
                                  return [
                                    <div key="profit-tooltip">
                                      <div>{`Profit: ${value.toFixed(2)}%`}</div>
                                      <div>{`P&L: $${point?.pnlDollars.toFixed(2)}`}</div>
                                      {point?.hasWithdraws && <div className="text-yellow-400">⚠️ Día con Withdraw</div>}
                                    </div>
                                  ];
                                }
                                return [value, name];
                              }}
                              labelFormatter={(label) => `Fecha: ${label}`}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="profitPercent" 
                              stroke="#10B981" 
                              strokeWidth={2}
                              dot={(props) => {
                                const { cx, cy, payload } = props;
                                return (
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={payload.hasWithdraws ? 5 : 3}
                                    fill={payload.hasWithdraws ? '#F59E0B' : '#10B981'}
                                    stroke={payload.hasWithdraws ? '#FCD34D' : '#10B981'}
                                    strokeWidth={payload.hasWithdraws ? 2 : 0}
                                  />
                                );
                              }}
                              name="profitPercent"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    
                    {/* Evolución de Drawdown en Porcentaje */}
                    <Card className="bg-gradient-to-br from-red-900/20 via-rose-900/10 to-orange-900/20 border-red-500/30">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <TrendingDown className="w-5 h-5 text-red-400" />
                          Evolución de Drawdown
                        </CardTitle>
                        <CardDescription className="text-red-200/70">
                          Drawdown en % del balance inicial (${initialBalance.toLocaleString()})
                          <div className="mt-1 text-xs text-yellow-300">
                            🔶 Puntos amarillos indican días con Withdraws (no se consideran como drawdown)
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={drawdownData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#9CA3AF" 
                              fontSize={10}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis 
                              stroke="#9CA3AF"
                              domain={['dataMin - 0.5', 0]}
                              tickFormatter={(value) => `${Math.abs(value).toFixed(1)}%`}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #EF4444', borderRadius: '8px' }}
                              labelStyle={{ color: '#F3F4F6' }}
                              formatter={(value, name) => {
                                if (name === 'drawdownPercent') {
                                  const point = drawdownData.find(p => p.drawdownPercent === value);
                                  return [
                                    <div key="drawdown-tooltip">
                                      <div>{`Drawdown: ${Math.abs(value).toFixed(2)}%`}</div>
                                      <div>{`Balance Trading: $${point?.balance.toFixed(2)}`}</div>
                                      <div>{`Peak: $${point?.peak.toFixed(2)}`}</div>
                                      {point?.hasWithdraws && <div className="text-yellow-400">⚠️ Día con Withdraw</div>}
                                    </div>
                                  ];
                                }
                                return [value, name];
                              }}
                              labelFormatter={(label) => `Fecha: ${label}`}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="drawdownPercent" 
                              stroke="#EF4444" 
                              strokeWidth={2}
                              dot={(props) => {
                                const { cx, cy, payload } = props;
                                return (
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={payload.hasWithdraws ? 5 : 3}
                                    fill={payload.hasWithdraws ? '#F59E0B' : '#EF4444'}
                                    stroke={payload.hasWithdraws ? '#FCD34D' : '#EF4444'}
                                    strokeWidth={payload.hasWithdraws ? 2 : 0}
                                  />
                                );
                              }}
                              name="drawdownPercent"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    
                    {/* Activos Operados */}
                    <Card className="bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-blue-900/20 border-purple-500/30">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Target className="w-5 h-5 text-purple-400" />
                          Activos Operados
                        </CardTitle>
                        <CardDescription className="text-purple-200/70">
                          Distribución por símbolo
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={assetsData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percentage }) => `${name}: ${percentage}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {assetsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #8B5CF6', borderRadius: '8px' }}
                              labelStyle={{ color: '#F3F4F6' }}
                              formatter={(value, name, props) => {
                                const entry = props.payload;
                                return [
                                  <div key="asset-tooltip">
                                    <div>{`Trades: ${value} (${entry.percentage}%)`}</div>
                                    <div className={entry.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                      {`P&L: $${entry.pnl.toFixed(2)}`}
                                    </div>
                                  </div>
                                ];
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    
                    {/* Valoración de Trading Basada en Porcentajes */}
                    <Card className="bg-gradient-to-br from-cyan-900/20 via-blue-900/10 to-indigo-900/20 border-cyan-500/30">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-cyan-400" />
                          Valoración de Trading
                        </CardTitle>
                        <CardDescription className="text-cyan-200/70">
                          Puntuación 0-10 basada en % del balance inicial (${initialBalance.toLocaleString()})
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-center">
                            <div className={`text-4xl font-bold ${tradingScore >= 7 ? 'text-green-400' : tradingScore >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {tradingScore.toFixed(1)}/10
                            </div>
                            <div className={`text-lg ${tradingScore >= 7 ? 'text-green-300' : tradingScore >= 4 ? 'text-yellow-300' : 'text-red-300'}`}>
                              {tradingScore >= 7 ? 'Excelente' : tradingScore >= 4 ? 'Bueno' : 'Necesita Mejorar'}
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Win Rate:</span>
                              <span className="text-white">{winRate.toFixed(1)}% ({winRateScore.toFixed(1)}/4 pts)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Beneficio Total:</span>
                              <span className={finalProfitPercent >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {finalProfitPercent.toFixed(2)}% ({beneficioScore.toFixed(1)}/3 pts)
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Drawdown Máximo:</span>
                              <span className={maxDrawdownPercent <= 5 ? 'text-green-400' : 'text-red-400'}>
                                {maxDrawdownPercent.toFixed(2)}% ({drawdownScore}/3 pts)
                              </span>
                            </div>
                            <div className="mt-4 pt-2 border-t border-cyan-500/30">
                              <div className="flex justify-between text-xs text-gray-300">
                                <span>Balance Inicial:</span>
                                <span>${initialBalance.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-300">
                                <span>Balance Actual:</span>
                                <span className={finalProfitPercent >= 0 ? 'text-green-300' : 'text-red-300'}>
                                  ${(initialBalance + (evolutionData.length > 0 ? evolutionData[evolutionData.length - 1].pnlDollars : 0)).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
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
            setSelectedTradeForJournal={setSelectedTradeForJournal}
          />
        )
      
      case 'panel-trades':
        return <OperationsPanel 
          trades={trades} 
          selectedAccount={selectedAccount}
          selectedTradeForJournal={selectedTradeForJournal}
          setSelectedTradeForJournal={setSelectedTradeForJournal}
        />
      
      case 'panel-analysis':
        return (
          <div className="space-y-6">
            <MetricsCards 
              trades={trades.filter(t => selectedAccount ? t.account_id === selectedAccount.id : true)} 
              title={selectedAccount ? `Análisis Completo de ${selectedAccount.name}` : "Análisis General"} 
            />
            
            {/* Análisis por símbolo */}
            <Card className="bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-cyan-900/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-purple-400" />
                  Rendimiento por Símbolo
                </CardTitle>
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
                          <Card key={symbol} className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 border-purple-500/30 hover:from-slate-700/70 hover:to-slate-600/50 transition-all duration-300 hover:scale-105">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-white text-lg flex items-center gap-2">
                                <Target className="w-4 h-4 text-cyan-400" />
                                {symbol}
                              </CardTitle>
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
            <Card className="bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-cyan-900/20 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  Análisis Temporal
                </CardTitle>
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
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-purple-400" />
                          Rendimiento por Día de la Semana
                        </h3>
                        <div className="space-y-2">
                          {Object.entries(weekdayStats)
                            .sort(([,a], [,b]) => b.totalPnl - a.totalPnl)
                            .map(([day, stats]) => (
                            <div key={day} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-700/60 to-slate-600/40 rounded-lg border border-purple-500/20 hover:from-slate-600/70 hover:to-slate-500/50 transition-all duration-300">
                              <div>
                                <span className="text-white font-medium">{day}</span>
                                <div className="text-xs text-purple-200/70">{stats.trades.length} trades</div>
                              </div>
                              <div className="text-right">
                                <div className={`font-bold ${stats.totalPnl >= 0 ? 'text-green-400 glow-text-cyan' : 'text-red-400 glow-text-purple'}`}>
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
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-cyan-400" />
                          Mejores Horas de Trading
                        </h3>
                        <div className="space-y-2">
                          {Object.entries(hourlyStats)
                            .sort(([,a], [,b]) => b.totalPnl - a.totalPnl)
                            .slice(0, 8)
                            .map(([hour, stats]) => (
                              <div key={hour} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-700/60 to-slate-600/40 rounded-lg border border-cyan-500/20 hover:from-slate-600/70 hover:to-slate-500/50 transition-all duration-300">
                                <div>
                                  <span className="text-white font-medium">{parseInt(hour) + 1}:00 - {parseInt(hour) + 2}:00 (España)</span>
                                  <div className="text-xs text-cyan-200/70">{stats.trades.length} trades</div>
                                </div>
                                <div className="text-right">
                                  <div className={`font-bold ${stats.totalPnl >= 0 ? 'text-green-400 glow-text-cyan' : 'text-red-400 glow-text-purple'}`}>
                                    ${stats.totalPnl.toFixed(2)}
                                  </div>
                                  <div className="text-xs text-cyan-200/70">
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
            <Card className="bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-cyan-900/20 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Análisis de Riesgo
                </CardTitle>
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
                      <Card className="bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-500/30 hover:from-red-800/40 hover:to-red-700/30 transition-all duration-300">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-red-300 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" />
                            Máximo Drawdown
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold text-red-400 glow-text-purple">${maxDrawdown.toFixed(2)}</div>
                          <div className="text-xs text-red-200/70">Mayor pérdida individual</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-green-900/30 to-emerald-800/20 border-green-500/30 hover:from-green-800/40 hover:to-emerald-700/30 transition-all duration-300">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-green-300 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Máximo Beneficio
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold text-green-400 glow-text-cyan">${maxProfit.toFixed(2)}</div>
                          <div className="text-xs text-green-200/70">Mayor ganancia individual</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-purple-900/30 to-indigo-800/20 border-purple-500/30 hover:from-purple-800/40 hover:to-indigo-700/30 transition-all duration-300">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-purple-300 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Risk-Reward Ratio
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold text-purple-400 glow-text-cyan">
                            {winningTrades.length > 0 && losingTrades.length > 0 ? 
                              ((winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length) / 
                               Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)).toFixed(2) : 
                              'N/A'
                            }
                          </div>
                          <div className="text-xs text-purple-200/70">Relación beneficio/riesgo</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-emerald-900/30 to-green-800/20 border-emerald-500/30 hover:from-emerald-800/40 hover:to-green-700/30 transition-all duration-300">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-emerald-300 flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            Rachas Ganadoras
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold text-green-400 glow-text-cyan">{consecutiveWins}</div>
                          <div className="text-xs text-emerald-200/70">Máxima racha de victorias</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-red-900/30 to-rose-800/20 border-red-500/30 hover:from-red-800/40 hover:to-rose-700/30 transition-all duration-300">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-red-300 flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            Rachas Perdedoras
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold text-red-400 glow-text-purple">{consecutiveLosses}</div>
                          <div className="text-xs text-red-200/70">Máxima racha de pérdidas</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-800/20 border-cyan-500/30 hover:from-cyan-800/40 hover:to-blue-700/30 transition-all duration-300">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-cyan-300 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Expectativa
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold text-cyan-400 glow-text-cyan">
                            ${accountTrades.length > 0 ? 
                              (accountTrades.reduce((sum, t) => sum + parseFloat(t.pnl), 0) / accountTrades.length).toFixed(2) : 
                              '0.00'
                            }
                          </div>
                          <div className="text-xs text-cyan-200/70">P&L esperado por trade</div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        )
      
      case 'students':
        return <StudentsManager user={user || { id: 'demo', role: 'Mentor' }} />
      
      case 'mentor-selection':
        return <MentorSelector user={user || { id: 'demo', role: 'Alumno' }} />
      
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
          user={user}
          demoMode={demoMode}
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

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => {
          setShowAuthModal(false)
          setDemoMode(true)
        }} />
      )}

      {/* Modal de Journal de Trade */}
      {selectedTradeForJournal && (
        <TradeJournalModal
          trade={selectedTradeForJournal}
          onClose={() => setSelectedTradeForJournal(null)}
          onSave={(updatedTrade) => {
            // Actualizar el trade en el estado de trades
            setTrades(prevTrades => 
              prevTrades.map(trade => 
                trade.id === updatedTrade.id ? updatedTrade : trade
              )
            )
            console.log('Trade journal saved:', updatedTrade)
          }}
        />
      )}
    </>
  )
}