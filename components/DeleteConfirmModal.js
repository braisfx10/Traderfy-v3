'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { AlertTriangle, X } from 'lucide-react'

const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  trade,
  isLoading = false
}) => {
  if (!isOpen || !trade) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-red-900/20 to-slate-800 border-red-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <CardTitle className="text-white">
                  Eliminar Operación
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Esta acción no se puede deshacer
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-slate-800/50 p-4 rounded-lg border border-red-500/20">
              <h4 className="text-white font-medium mb-2">Detalles de la operación:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Símbolo:</span>
                  <span className="text-white">{trade.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tipo:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    trade.direction === 'Buy' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                  }`}>
                    {trade.direction}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">P&L:</span>
                  <span className={parseFloat(trade.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}>
                    ${parseFloat(trade.pnl).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fecha:</span>
                  <span className="text-white">
                    {new Date(trade.close_time).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-500/30 hover:bg-gray-500/10"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={onConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DeleteConfirmModal