'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Palette 
} from 'lucide-react'
import {
  getUserLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  validateLabelName,
  generateLabelColor,
  SUGGESTED_LABELS
} from '../lib/labelsService'

const LabelsManager = ({ userId, onLabelsChange }) => {
  const [labels, setLabels] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('')
  const [error, setError] = useState('')

  // Cargar etiquetas al montar
  useEffect(() => {
    if (userId) {
      loadLabels()
    }
  }, [userId])

  const loadLabels = async () => {
    try {
      setLoading(true)
      const userLabels = await getUserLabels(userId)
      setLabels(userLabels)
      onLabelsChange?.(userLabels)
    } catch (error) {
      console.error('Error loading labels:', error)
      setError('Error al cargar las etiquetas')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLabel = async () => {
    setError('')
    
    const validation = validateLabelName(newLabelName, labels)
    if (validation) {
      setError(validation)
      return
    }

    try {
      const color = newLabelColor || generateLabelColor()
      const newLabel = await createLabel(userId, newLabelName, color)
      
      setLabels(prev => [...prev, newLabel])
      setNewLabelName('')
      setNewLabelColor('')
      setCreating(false)
      onLabelsChange?.([...labels, newLabel])
    } catch (error) {
      console.error('Error creating label:', error)
      setError('Error al crear la etiqueta')
    }
  }

  const handleUpdateLabel = async (labelId, name, color) => {
    setError('')
    
    const validation = validateLabelName(name, labels.filter(l => l.id !== labelId))
    if (validation) {
      setError(validation)
      return
    }

    try {
      const updatedLabel = await updateLabel(labelId, { name, color })
      
      setLabels(prev => prev.map(label => 
        label.id === labelId ? updatedLabel : label
      ))
      setEditing(null)
      onLabelsChange?.(labels.map(label => 
        label.id === labelId ? updatedLabel : label
      ))
    } catch (error) {
      console.error('Error updating label:', error)
      setError('Error al actualizar la etiqueta')
    }
  }

  const handleDeleteLabel = async (labelId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta etiqueta? Se removerá de todas las cuentas asociadas.')) {
      return
    }

    try {
      await deleteLabel(labelId)
      const updatedLabels = labels.filter(label => label.id !== labelId)
      setLabels(updatedLabels)
      onLabelsChange?.(updatedLabels)
    } catch (error) {
      console.error('Error deleting label:', error)
      setError('Error al eliminar la etiqueta')
    }
  }

  const handleSuggestedLabel = (suggested) => {
    setNewLabelName(suggested.name)
    setNewLabelColor(suggested.color)
    setCreating(true)
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-cyan-900/20 border-purple-500/30">
        <CardContent className="p-6 text-center">
          <div className="text-purple-200/70">Cargando etiquetas...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-cyan-900/20 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Tag className="w-5 h-5 text-purple-400" />
          Gestión de Etiquetas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-gradient-to-r from-red-900/50 to-red-800/40 border border-red-500/50 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Lista de etiquetas existentes */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-purple-300">Etiquetas Actuales</h4>
          {labels.length === 0 ? (
            <div className="text-center py-4 text-purple-200/70">
              No tienes etiquetas personalizadas aún
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {labels.map(label => (
                <LabelItem 
                  key={label.id} 
                  label={label}
                  editing={editing === label.id}
                  onEdit={() => setEditing(label.id)}
                  onCancel={() => setEditing(null)}
                  onSave={(name, color) => handleUpdateLabel(label.id, name, color)}
                  onDelete={() => handleDeleteLabel(label.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Crear nueva etiqueta */}
        <div className="border-t border-purple-500/20 pt-4">
          {!creating ? (
            <Button 
              onClick={() => setCreating(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Nueva Etiqueta
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-purple-300">Nombre</Label>
                  <Input
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Ej: FTMO, Scalping, etc."
                    className="bg-gradient-to-r from-slate-800 to-slate-700 border-purple-500/50 text-white"
                  />
                </div>
                <div>
                  <Label className="text-cyan-300">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={newLabelColor || generateLabelColor()}
                      onChange={(e) => setNewLabelColor(e.target.value)}
                      className="w-16 h-10 bg-gradient-to-r from-slate-800 to-slate-700 border-cyan-500/50"
                    />
                    <Input
                      value={newLabelColor || generateLabelColor()}
                      onChange={(e) => setNewLabelColor(e.target.value)}
                      placeholder="#A020F0"
                      className="flex-1 bg-gradient-to-r from-slate-800 to-slate-700 border-cyan-500/50 text-white"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateLabel}
                  disabled={!newLabelName.trim()}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Crear
                </Button>
                <Button 
                  onClick={() => {
                    setCreating(false)
                    setNewLabelName('')
                    setNewLabelColor('')
                    setError('')
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-400 hover:bg-gray-800"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Etiquetas sugeridas */}
        {!creating && labels.length < 5 && (
          <div className="border-t border-purple-500/20 pt-4">
            <h4 className="text-sm font-medium text-cyan-300 mb-2">Etiquetas Sugeridas</h4>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_LABELS
                .filter(suggested => !labels.some(label => 
                  label.name.toLowerCase() === suggested.name.toLowerCase()
                ))
                .slice(0, 6)
                .map(suggested => (
                  <Button
                    key={suggested.name}
                    onClick={() => handleSuggestedLabel(suggested)}
                    size="sm"
                    variant="outline"
                    className="border-purple-500/30 text-purple-200 hover:bg-purple-500/20"
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: suggested.color }}
                    />
                    {suggested.name}
                  </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Componente para cada etiqueta individual
const LabelItem = ({ label, editing, onEdit, onCancel, onSave, onDelete }) => {
  const [editName, setEditName] = useState(label.name)
  const [editColor, setEditColor] = useState(label.color)

  useEffect(() => {
    if (editing) {
      setEditName(label.name)
      setEditColor(label.color)
    }
  }, [editing, label])

  const handleSave = () => {
    onSave(editName, editColor)
  }

  if (editing) {
    return (
      <div className="p-3 bg-gradient-to-r from-slate-700/60 to-slate-600/40 rounded-lg border border-purple-500/20">
        <div className="space-y-2">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="bg-slate-800 border-purple-500/50 text-white text-sm"
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
              className="w-8 h-8 rounded border-purple-500/50"
            />
            <Input
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
              className="flex-1 bg-slate-800 border-purple-500/50 text-white text-sm"
            />
          </div>
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700">
              <Check className="w-3 h-3" />
            </Button>
            <Button size="sm" onClick={onCancel} variant="outline" className="border-gray-600">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 bg-gradient-to-r from-slate-700/60 to-slate-600/40 rounded-lg border border-purple-500/20 hover:from-slate-600/70 hover:to-slate-500/50 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: label.color }}
          />
          <span className="text-white font-medium">{label.name}</span>
        </div>
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onEdit}
            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onDelete}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LabelsManager