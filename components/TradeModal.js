'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { X } from 'lucide-react'

const TradeModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  trade = null, 
  selectedAccount 
}) => {
  const [formData, setFormData] = useState({
    symbol: trade?.symbol || '',
    direction: trade?.direction || 'Buy',
    entry_price: trade?.entry_price || '',
    close_price: trade?.close_price || '',
    lots: trade?.lots || '',
    pnl: trade?.pnl || '',
    close_time: trade?.close_time ? new Date(trade.close_time).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    open_time: trade?.open_time ? new Date(trade.open_time).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const tradeData = {
        ...formData,
        id: trade?.id || `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        account_id: selectedAccount?.id || 'demo',
        entry_price: parseFloat(formData.entry_price) || 0,
        close_price: parseFloat(formData.close_price) || 0,
        lots: parseFloat(formData.lots) || 0,
        pnl: parseFloat(formData.pnl) || 0,
        close_time: new Date(formData.close_time).toISOString(),
        open_time: new Date(formData.open_time).toISOString(),
        commission: 0,
        swap: 0,
        isManual: true
      }

      await onSubmit(tradeData)
      onClose()
    } catch (error) {
      console.error('Error al guardar operación:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-gray-900 to-slate-800 border-purple-500/30 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">
                {trade ? 'Editar Operación' : 'Añadir Operación Manual'}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {selectedAccount ? `Cuenta: ${selectedAccount.name}` : 'Cuenta demo'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fila 1: Símbolo y Dirección */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  Símbolo
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                  className="w-full p-3 bg-slate-800 border border-purple-500/30 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Ej: EURUSD, GBPJPY, etc."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Dirección
                </label>
                <select
                  value={formData.direction}
                  onChange={(e) => setFormData(prev => ({ ...prev, direction: e.target.value }))}
                  className="w-full p-3 bg-slate-800 border border-cyan-500/30 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  style={{ color: '#ffffff', backgroundColor: '#1e293b' }}
                >
                  <option value="Buy" style={{ color: '#ffffff', backgroundColor: '#1e293b' }}>Buy</option>
                  <option value="Sell" style={{ color: '#ffffff', backgroundColor: '#1e293b' }}>Sell</option>
                </select>
              </div>
            </div>

            {/* Fila 2: Precios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-green-300 mb-2">
                  Precio de Entrada
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={formData.entry_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, entry_price: e.target.value }))}
                  className="w-full p-3 bg-slate-800 border border-green-500/30 rounded-lg text-white focus:border-green-500 focus:outline-none"
                  placeholder="1.23456"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-orange-300 mb-2">
                  Precio de Cierre
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={formData.close_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, close_price: e.target.value }))}
                  className="w-full p-3 bg-slate-800 border border-orange-500/30 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  placeholder="1.23456"
                  required
                />
              </div>
            </div>

            {/* Fila 3: Lotes y P&L */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-indigo-300 mb-2">
                  Lotes
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.lots}
                  onChange={(e) => setFormData(prev => ({ ...prev, lots: e.target.value }))}
                  className="w-full p-3 bg-slate-800 border border-indigo-500/30 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="0.10"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-yellow-300 mb-2">
                  P&L ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pnl}
                  onChange={(e) => setFormData(prev => ({ ...prev, pnl: e.target.value }))}
                  className="w-full p-3 bg-slate-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                  placeholder="123.45"
                  required
                />
              </div>
            </div>

            {/* Fila 4: Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-300 mb-2">
                  Fecha/Hora de Apertura
                </label>
                <input
                  type="datetime-local"
                  value={formData.open_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, open_time: e.target.value }))}
                  className="w-full p-3 bg-slate-800 border border-blue-500/30 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-pink-300 mb-2">
                  Fecha/Hora de Cierre
                </label>
                <input
                  type="datetime-local"
                  value={formData.close_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, close_time: e.target.value }))}
                  className="w-full p-3 bg-slate-800 border border-pink-500/30 rounded-lg text-white focus:border-pink-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-500/30 hover:bg-gray-500/10"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : (trade ? 'Actualizar' : 'Crear Operación')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default TradeModal