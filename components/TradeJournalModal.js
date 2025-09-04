'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Save,
  Camera,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react'

const TradeJournalModal = ({ trade, onClose, onSave }) => {
  const [journalData, setJournalData] = useState({
    entry_screenshot: null,
    exit_screenshot: null,
    entry_analysis: '',
    trade_development: '',
    lessons_learned: '',
    rating: 5
  })
  
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState({ entry: false, exit: false })

  // Cargar datos existentes del journal si los hay
  useEffect(() => {
    const existingJournal = trade?.journal_data || {}
    setJournalData(prev => ({
      ...prev,
      ...existingJournal
    }))
  }, [trade])

  const handleImageUpload = (event, type) => {
    const file = event.target.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setJournalData(prev => ({
          ...prev,
          [`${type}_screenshot`]: e.target.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (event, type) => {
    event.preventDefault()
    setDragActive(prev => ({ ...prev, [type]: false }))
    
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setJournalData(prev => ({
          ...prev,
          [`${type}_screenshot`]: e.target.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (event, type) => {
    event.preventDefault()
    setDragActive(prev => ({ ...prev, [type]: true }))
  }

  const handleDragLeave = (event, type) => {
    event.preventDefault()
    setDragActive(prev => ({ ...prev, [type]: false }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Guardar en localStorage para modo demo, o en Supabase si está configurado
      const updatedTrade = {
        ...trade,
        journal_data: journalData,
        last_updated: new Date().toISOString()
      }
      
      // En modo demo, guardar en localStorage
      const existingJournals = JSON.parse(localStorage.getItem('trade_journals') || '{}')
      existingJournals[trade.id] = journalData
      localStorage.setItem('trade_journals', JSON.stringify(existingJournals))
      
      onSave?.(updatedTrade)
      onClose()
    } catch (error) {
      console.error('Error saving trade journal:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeImage = (type) => {
    setJournalData(prev => ({
      ...prev,
      [`${type}_screenshot`]: null
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-purple-500/30 shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-500/10 to-cyan-400/10 border-b border-purple-500/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Journal de Trade - {trade.symbol}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-cyan-400/20">
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Información del trade */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-gradient-to-r from-purple-500/20 to-indigo-600/10 p-3 rounded-lg border border-purple-500/30">
              <div className="text-purple-300">Símbolo</div>
              <div className="text-white font-bold">{trade.symbol}</div>
            </div>
            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/10 p-3 rounded-lg border border-cyan-500/30">
              <div className="text-cyan-300">Dirección</div>
              <div className={`font-bold ${trade.direction === 'Buy' ? 'text-green-400' : 'text-red-400'}`}>
                {trade.direction === 'Buy' ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
                {trade.direction}
              </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-600/10 p-3 rounded-lg border border-indigo-500/30">
              <div className="text-indigo-300">P&L</div>
              <div className={`font-bold ${parseFloat(trade.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${parseFloat(trade.pnl).toFixed(2)}
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/10 p-3 rounded-lg border border-green-500/30">
              <div className="text-green-300">Fecha</div>
              <div className="text-white font-bold flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(trade.close_time).toLocaleDateString('es-ES')}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[65vh] p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Capturas de pantalla */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-400" />
                Capturas de Pantalla
              </h3>

              {/* Captura de entrada */}
              <div>
                <Label className="text-purple-300 mb-2 block">Análisis de Entrada</Label>
                <div
                  className={`
                    border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300
                    ${dragActive.entry 
                      ? 'border-purple-400 bg-purple-500/20' 
                      : 'border-purple-500/30 hover:border-purple-400/50 bg-gradient-to-r from-purple-500/10 to-indigo-600/10'
                    }
                  `}
                  onDrop={(e) => handleDrop(e, 'entry')}
                  onDragOver={(e) => handleDragOver(e, 'entry')}
                  onDragLeave={(e) => handleDragLeave(e, 'entry')}
                >
                  {journalData.entry_screenshot ? (
                    <div className="relative">
                      <img 
                        src={journalData.entry_screenshot} 
                        alt="Análisis de entrada" 
                        className="max-w-full h-auto rounded border border-purple-500/30"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeImage('entry')}
                        className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-700 text-white"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                      <p className="text-purple-200 mb-2">Arrastra la imagen aquí o haz clic para seleccionar</p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'entry')}
                        className="hidden"
                        id="entry-upload"
                      />
                      <Label htmlFor="entry-upload" className="cursor-pointer">
                        <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                          <Upload className="w-4 h-4 mr-2" />
                          Seleccionar Imagen
                        </Button>
                      </Label>
                    </div>
                  )}
                </div>
              </div>

              {/* Captura de salida */}
              <div>
                <Label className="text-cyan-300 mb-2 block">Resultado del Trade</Label>
                <div
                  className={`
                    border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300
                    ${dragActive.exit 
                      ? 'border-cyan-400 bg-cyan-500/20' 
                      : 'border-cyan-500/30 hover:border-cyan-400/50 bg-gradient-to-r from-cyan-500/10 to-blue-600/10'
                    }
                  `}
                  onDrop={(e) => handleDrop(e, 'exit')}
                  onDragOver={(e) => handleDragOver(e, 'exit')}
                  onDragLeave={(e) => handleDragLeave(e, 'exit')}
                >
                  {journalData.exit_screenshot ? (
                    <div className="relative">
                      <img 
                        src={journalData.exit_screenshot} 
                        alt="Resultado del trade" 
                        className="max-w-full h-auto rounded border border-cyan-500/30"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeImage('exit')}
                        className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-700 text-white"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                      <p className="text-cyan-200 mb-2">Arrastra la imagen aquí o haz clic para seleccionar</p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'exit')}
                        className="hidden"
                        id="exit-upload"
                      />
                      <Label htmlFor="exit-upload" className="cursor-pointer">
                        <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10">
                          <Upload className="w-4 h-4 mr-2" />
                          Seleccionar Imagen
                        </Button>
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notas y análisis */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Análisis y Notas
              </h3>

              <div>
                <Label className="text-purple-300 mb-2 block">¿Por qué entraste a esta operación?</Label>
                <textarea
                  value={journalData.entry_analysis}
                  onChange={(e) => setJournalData(prev => ({ ...prev, entry_analysis: e.target.value }))}
                  placeholder="Describe tu análisis técnico/fundamental, señales que viste, confluencias..."
                  className="w-full p-3 bg-gradient-to-r from-slate-800 to-slate-700 border border-purple-500/50 rounded text-white placeholder:text-slate-400 focus:border-purple-400 focus:ring-purple-400/20 min-h-[100px] resize-vertical"
                />
              </div>

              <div>
                <Label className="text-cyan-300 mb-2 block">¿Cómo se desarrolló la operación?</Label>
                <textarea
                  value={journalData.trade_development}
                  onChange={(e) => setJournalData(prev => ({ ...prev, trade_development: e.target.value }))}
                  placeholder="Cuenta la historia del trade: cómo evolucionó el precio, emociones que sentiste, decisiones que tomaste..."
                  className="w-full p-3 bg-gradient-to-r from-slate-800 to-slate-700 border border-cyan-500/50 rounded text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-400/20 min-h-[100px] resize-vertical"
                />
              </div>

              <div>
                <Label className="text-indigo-300 mb-2 block">Lecciones aprendidas</Label>
                <textarea
                  value={journalData.lessons_learned}
                  onChange={(e) => setJournalData(prev => ({ ...prev, lessons_learned: e.target.value }))}
                  placeholder="¿Qué aprendiste de este trade? ¿Qué harías diferente la próxima vez?"
                  className="w-full p-3 bg-gradient-to-r from-slate-800 to-slate-700 border border-indigo-500/50 rounded text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20 min-h-[80px] resize-vertical"
                />
              </div>

              <div>
                <Label className="text-green-300 mb-2 block">Calificación del Trade (1-10)</Label>
                <select
                  value={journalData.rating}
                  onChange={(e) => setJournalData(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                  className="w-full p-2 bg-gradient-to-r from-slate-800 to-slate-700 border border-green-500/50 rounded text-white focus:border-green-400 focus:ring-green-400/20"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(rating => (
                    <option key={rating} value={rating} className="bg-slate-800">
                      {rating} - {rating <= 3 ? 'Malo' : rating <= 6 ? 'Regular' : rating <= 8 ? 'Bueno' : 'Excelente'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-purple-500/20">
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar Journal'}
            </Button>
            <Button 
              onClick={onClose}
              variant="outline"
              disabled={loading}
              className="border-gray-600 text-gray-400 hover:bg-gray-800"
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TradeJournalModal