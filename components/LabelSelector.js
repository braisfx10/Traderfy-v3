'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { 
  Tag, 
  Plus, 
  X, 
  Check 
} from 'lucide-react'
import {
  getUserLabels,
  createLabel,
  generateLabelColor,
  validateLabelName
} from '../lib/labelsService'

const LabelSelector = ({ 
  userId, 
  selectedLabels = [], 
  onLabelsChange,
  maxLabels = 5,
  showCreateNew = true,
  className = ""
}) => {
  const [availableLabels, setAvailableLabels] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (userId) {
      loadLabels()
    }
  }, [userId])

  const loadLabels = async () => {
    try {
      setLoading(true)
      const labels = await getUserLabels(userId)
      setAvailableLabels(labels)
    } catch (error) {
      console.error('Error loading labels:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLabel = (label) => {
    const isSelected = selectedLabels.some(selected => selected.id === label.id)
    
    if (isSelected) {
      // Remover etiqueta
      onLabelsChange(selectedLabels.filter(selected => selected.id !== label.id))
    } else {
      // Agregar etiqueta (si no excede el máximo)
      if (selectedLabels.length < maxLabels) {
        onLabelsChange([...selectedLabels, label])
      }
    }
  }

  const handleCreateNewLabel = async () => {
    setError('')
    
    const validation = validateLabelName(newLabelName, availableLabels)
    if (validation) {
      setError(validation)
      return
    }

    try {
      const newLabel = await createLabel(userId, newLabelName, generateLabelColor())
      setAvailableLabels(prev => [...prev, newLabel])
      
      // Auto-seleccionar la nueva etiqueta
      if (selectedLabels.length < maxLabels) {
        onLabelsChange([...selectedLabels, newLabel])
      }
      
      setNewLabelName('')
      setCreating(false)
    } catch (error) {
      console.error('Error creating label:', error)
      setError('Error al crear la etiqueta')
    }
  }

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label className="text-purple-300">Etiquetas</Label>
        <div className="text-sm text-purple-200/70">Cargando etiquetas...</div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-purple-300 flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Etiquetas {selectedLabels.length > 0 && `(${selectedLabels.length}/${maxLabels})`}
        </Label>
        {showCreateNew && !creating && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setCreating(true)}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
          >
            <Plus className="w-3 h-3 mr-1" />
            Nueva
          </Button>
        )}
      </div>

      {error && (
        <div className="p-2 bg-red-900/50 border border-red-500/50 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Crear nueva etiqueta */}
      {creating && (
        <div className="p-3 bg-gradient-to-r from-slate-700/60 to-slate-600/40 rounded-lg border border-purple-500/20">
          <div className="space-y-2">
            <Input
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="Nombre de la nueva etiqueta"
              className="bg-slate-800 border-purple-500/50 text-white text-sm"
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleCreateNewLabel}
                disabled={!newLabelName.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="w-3 h-3 mr-1" />
                Crear
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setCreating(false)
                  setNewLabelName('')
                  setError('')
                }}
                className="border-gray-600 text-gray-400"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Etiquetas disponibles */}
      {availableLabels.length === 0 ? (
        <div className="text-center py-4 text-purple-200/70 text-sm">
          No tienes etiquetas disponibles.
          {showCreateNew && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setCreating(true)}
              className="ml-2 text-cyan-400 hover:text-cyan-300"
            >
              Crear la primera
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {availableLabels.map(label => {
            const isSelected = selectedLabels.some(selected => selected.id === label.id)
            const isDisabled = !isSelected && selectedLabels.length >= maxLabels
            
            return (
              <Button
                key={label.id}
                type="button"
                size="sm"
                variant={isSelected ? "default" : "outline"}
                disabled={isDisabled}
                onClick={() => handleToggleLabel(label)}
                className={`
                  transition-all duration-200
                  ${isSelected 
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white border-transparent' 
                    : 'border-purple-500/30 text-purple-200 hover:bg-purple-500/20'
                  }
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                style={isSelected ? {} : { borderColor: `${label.color}50` }}
              >
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: label.color }}
                />
                {label.name}
                {isSelected && (
                  <X className="w-3 h-3 ml-1" />
                )}
              </Button>
            )
          })}
        </div>
      )}

      {/* Etiquetas seleccionadas (vista alternativa para espacios pequeños) */}
      {selectedLabels.length > 0 && (
        <div className="pt-2 border-t border-purple-500/20">
          <div className="text-xs text-purple-300 mb-2">Seleccionadas:</div>
          <div className="flex flex-wrap gap-1">
            {selectedLabels.map(label => (
              <span
                key={label.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-600/20 to-cyan-500/20 border border-purple-500/30 rounded text-xs text-white"
              >
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: label.color }}
                />
                {label.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Información adicional */}
      {maxLabels > 1 && (
        <div className="text-xs text-purple-200/50">
          Puedes seleccionar hasta {maxLabels} etiquetas por cuenta
        </div>
      )}
    </div>
  )
}

export default LabelSelector