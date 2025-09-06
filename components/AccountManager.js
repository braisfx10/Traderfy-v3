'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  User, 
  Wallet,
  Tag,
  AlertTriangle
} from 'lucide-react'
import LabelSelector from './LabelSelector'
import LabelsManager from './LabelsManager'
import { 
  getAccountsWithLabels,
  assignLabelToAccount,
  removeLabelFromAccount
} from '../lib/labelsService'
import { supabase } from '../lib/supabase'

const AccountManager = ({ user, onAccountsChange }) => {
  const [accounts, setAccounts] = useState([])
  const [labels, setLabels] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [showLabelsManager, setShowLabelsManager] = useState(false)
  const [error, setError] = useState('')
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tag: 'Demo', // Valor predeterminado
    selectedLabels: [],
    rules: {
      maxTradesPerDay: '',
      maxDailyLoss: '',
      maxRiskPerTrade: '',
      tradingHours: { start: '', end: '' }
    }
  })

  useEffect(() => {
    if (user?.id) {
      loadAccounts()
    }
  }, [user?.id])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      let accountsData = []
      
      if (supabase && user?.id !== 'demo') {
        // Modo Supabase
        accountsData = await getAccountsWithLabels(user.id)
      } else {
        // Modo demo - usar localStorage
        accountsData = JSON.parse(localStorage.getItem('demo_accounts') || '[]')
      }
      
      setAccounts(accountsData)
      onAccountsChange?.(accountsData)
    } catch (error) {
      console.error('Error loading accounts:', error)
      setError('Error al cargar las cuentas: ' + (error.message || 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      tag: 'Demo',
      selectedLabels: [],
      rules: {
        maxTradesPerDay: '',
        maxDailyLoss: '',
        maxRiskPerTrade: '',
        tradingHours: { start: '', end: '' }
      }
    })
    setError('')
  }

  const handleCreateAccount = async () => {
    if (!formData.name.trim()) {
      setError('El nombre de la cuenta es requerido')
      return
    }

    try {
      if (supabase && user?.id !== 'demo') {
        // Modo Supabase
        const { data: newAccount, error: accountError } = await supabase
          .from('accounts')
          .insert({
            user_id: user.id,
            name: formData.name.trim(),
            description: formData.description.trim(),
            tag: formData.tag
          })
          .select()
          .single()

        if (accountError) throw accountError

        // Asignar etiquetas a la cuenta
        if (formData.selectedLabels.length > 0) {
          for (const label of formData.selectedLabels) {
            await assignLabelToAccount(newAccount.id, label.id)
          }
        }
      } else {
        // Modo demo - usar localStorage
        const existingAccounts = JSON.parse(localStorage.getItem('demo_accounts') || '[]')
        const newAccount = {
          id: Date.now().toString(),
          user_id: 'demo',
          name: formData.name.trim(),
          description: formData.description.trim(),
          tag: formData.tag,
          labels: formData.selectedLabels,
          rules: formData.rules,
          created_at: new Date().toISOString()
        }
        
        existingAccounts.push(newAccount)
        localStorage.setItem('demo_accounts', JSON.stringify(existingAccounts))
      }

      // Recargar cuentas
      await loadAccounts()
      
      setCreating(false)
      resetForm()
    } catch (error) {
      console.error('Error creating account:', error)
      setError('Error al crear la cuenta: ' + (error.message || 'Error desconocido'))
    }
  }

  const handleUpdateAccount = async (accountId) => {
    if (!formData.name.trim()) {
      setError('El nombre de la cuenta es requerido')
      return
    }

    try {
      if (supabase && user?.id !== 'demo') {
        // Modo Supabase
        const { error: updateError } = await supabase
          .from('accounts')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim(),
            tag: formData.tag
          })
          .eq('id', accountId)

        if (updateError) throw updateError

        // Actualizar etiquetas
        const currentAccount = accounts.find(acc => acc.id === accountId)
        const currentLabelIds = currentAccount.labels?.map(l => l.id) || []
        const newLabelIds = formData.selectedLabels.map(l => l.id)

        // Remover etiquetas que ya no están
        for (const labelId of currentLabelIds) {
          if (!newLabelIds.includes(labelId)) {
            await removeLabelFromAccount(accountId, labelId)
          }
        }

        // Agregar nuevas etiquetas
        for (const labelId of newLabelIds) {
          if (!currentLabelIds.includes(labelId)) {
            await assignLabelToAccount(accountId, labelId)
          }
        }
      } else {
        // Modo demo - actualizar en localStorage
        const storedAccounts = JSON.parse(localStorage.getItem('demo_accounts') || '[]')
        const accountIndex = storedAccounts.findIndex(acc => acc.id === accountId)
        
        if (accountIndex !== -1) {
          storedAccounts[accountIndex] = {
            ...storedAccounts[accountIndex],
            name: formData.name.trim(),
            description: formData.description.trim(),
            tag: formData.tag,
            labels: formData.selectedLabels,
            rules: formData.rules,
            updated_at: new Date().toISOString()
          }
          localStorage.setItem('demo_accounts', JSON.stringify(storedAccounts))
        }
      }

      await loadAccounts()
      setEditing(null)
      resetForm()
    } catch (error) {
      console.error('Error updating account:', error)
      setError('Error al actualizar la cuenta: ' + (error.message || 'Error desconocido'))
    }
  }

  const handleDeleteAccount = async (accountId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cuenta? Todos los datos asociados se perderán.')) {
      return
    }

    try {
      if (supabase && user?.id !== 'demo') {
        // Modo Supabase
        const { error } = await supabase
          .from('accounts')
          .delete()
          .eq('id', accountId)

        if (error) throw error
      } else {
        // Modo demo - eliminar de localStorage
        const storedAccounts = JSON.parse(localStorage.getItem('demo_accounts') || '[]')
        const filteredAccounts = storedAccounts.filter(acc => acc.id !== accountId)
        localStorage.setItem('demo_accounts', JSON.stringify(filteredAccounts))
      }
      
      await loadAccounts()
    } catch (error) {
      console.error('Error deleting account:', error)
      setError('Error al eliminar la cuenta: ' + (error.message || 'Error desconocido'))
    }
  }

  const startEditing = (account) => {
    setFormData({
      name: account.name,
      description: account.description || '',
      tag: account.tag,
      selectedLabels: account.labels || [],
      rules: account.rules || {
        maxTradesPerDay: '',
        maxDailyLoss: '',
        maxRiskPerTrade: '',
        tradingHours: { start: '', end: '' }
      }
    })
    setEditing(account.id)
  }

  const cancelEditing = () => {
    setEditing(null)
    setCreating(false)
    resetForm()
  }

  const getTagColor = (tag) => {
    switch (tag) {
      case 'Funded': return '#A020F0'
      case 'Live': return '#00FFFF'
      case 'Demo': return '#6B7280'
      default: return '#8B5CF6'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-purple-200/70">Cargando cuentas...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-gradient-to-r from-red-900/50 to-red-800/40 border border-red-500/50 rounded text-red-200">
          {error}
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={() => setCreating(true)}
          disabled={creating || editing}
          className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cuenta
        </Button>
        <Button 
          onClick={() => setShowLabelsManager(true)}
          variant="outline"
          className="border-purple-500/30 text-purple-200 hover:bg-purple-500/10"
        >
          <Tag className="w-4 h-4 mr-2" />
          Gestionar Etiquetas
        </Button>
      </div>

      {/* Formulario de crear/editar cuenta */}
      {(creating || editing) && (
        <Card className="bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-cyan-900/20 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              {creating ? 'Crear Nueva Cuenta' : 'Editar Cuenta'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-purple-300">Nombre de la Cuenta</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: FTMO Challenge 100K"
                  className="bg-gradient-to-r from-slate-800 to-slate-700 border-purple-500/50 text-white"
                />
              </div>
              <div>
                <Label className="text-cyan-300">Tipo de Cuenta</Label>
                <select
                  value={formData.tag}
                  onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value }))}
                  className="w-full p-2 bg-gradient-to-r from-slate-800 to-slate-700 border border-cyan-500/50 rounded text-white"
                >
                  <option value="Demo">Demo</option>
                  <option value="Live">Live</option>
                  <option value="Funded">Funded</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-indigo-300">Descripción (Opcional)</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción adicional de la cuenta"
                className="bg-gradient-to-r from-slate-800 to-slate-700 border-indigo-500/50 text-white"
              />
            </div>

            <LabelSelector
              userId={user.id}
              selectedLabels={formData.selectedLabels}
              onLabelsChange={(labels) => setFormData(prev => ({ ...prev, selectedLabels: labels }))}
              maxLabels={3}
            />

            {/* Sección de Normas/Reglas */}
            <div className="space-y-4 p-4 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Normas de Trading</h3>
              </div>
              <p className="text-sm text-gray-300">Define las reglas que deben cumplirse para esta cuenta. Se mostrarán alertas si se incumplen.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-yellow-300">Máximo Trades por Día</Label>
                  <Input
                    type="number"
                    value={formData.rules.maxTradesPerDay}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      rules: { ...prev.rules, maxTradesPerDay: e.target.value }
                    }))}
                    placeholder="Ej: 5"
                    className="bg-gradient-to-r from-slate-800 to-slate-700 border-yellow-500/50 text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-red-300">Pérdida Máxima Diaria ($)</Label>
                  <Input
                    type="number"
                    value={formData.rules.maxDailyLoss}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      rules: { ...prev.rules, maxDailyLoss: e.target.value }
                    }))}
                    placeholder="Ej: 500"
                    className="bg-gradient-to-r from-slate-800 to-slate-700 border-red-500/50 text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-orange-300">Riesgo Máximo por Operación (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.rules.maxRiskPerTrade}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      rules: { ...prev.rules, maxRiskPerTrade: e.target.value }
                    }))}
                    placeholder="Ej: 2.5"
                    className="bg-gradient-to-r from-slate-800 to-slate-700 border-orange-500/50 text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-cyan-300">Horario Operativo</Label>
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={formData.rules.tradingHours.start}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        rules: { 
                          ...prev.rules, 
                          tradingHours: { ...prev.rules.tradingHours, start: e.target.value }
                        }
                      }))}
                      className="bg-gradient-to-r from-slate-800 to-slate-700 border-cyan-500/50 text-white"
                    />
                    <span className="text-cyan-300 self-center">-</span>
                    <Input
                      type="time"
                      value={formData.rules.tradingHours.end}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        rules: { 
                          ...prev.rules, 
                          tradingHours: { ...prev.rules.tradingHours, end: e.target.value }
                        }
                      }))}
                      className="bg-gradient-to-r from-slate-800 to-slate-700 border-cyan-500/50 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={creating ? handleCreateAccount : () => handleUpdateAccount(editing)}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {creating ? 'Crear Cuenta' : 'Guardar Cambios'}
              </Button>
              <Button 
                onClick={cancelEditing}
                variant="outline"
                className="border-gray-600 text-gray-400 hover:bg-gray-800"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de cuentas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(account => (
          <Card key={account.id} className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 border-purple-500/30 hover:from-slate-700/70 hover:to-slate-600/50 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-white text-lg">{account.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: getTagColor(account.tag) }}
                    >
                      {account.tag}
                    </span>
                    {account.labels?.map(label => (
                      <span
                        key={label.id}
                        className="px-2 py-1 rounded text-xs text-white border"
                        style={{ 
                          backgroundColor: `${label.color}20`,
                          borderColor: `${label.color}50`,
                          color: label.color
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditing(account)}
                    disabled={editing || creating}
                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteAccount(account.id)}
                    disabled={editing || creating}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {(account.description || account.rules) && (
              <CardContent className="pt-0 space-y-2">
                {account.description && (
                  <p className="text-sm text-gray-300">{account.description}</p>
                )}
                {account.rules && (
                  <div className="space-y-1">
                    <div className="text-xs text-purple-300 font-medium">Normas configuradas:</div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-400">
                      {account.rules.maxTradesPerDay && (
                        <div>• Max trades/día: {account.rules.maxTradesPerDay}</div>
                      )}
                      {account.rules.maxDailyLoss && (
                        <div>• Max pérdida: ${account.rules.maxDailyLoss}</div>
                      )}
                      {account.rules.maxRiskPerTrade && (
                        <div>• Max riesgo: {account.rules.maxRiskPerTrade}%</div>
                      )}
                      {account.rules.tradingHours?.start && account.rules.tradingHours?.end && (
                        <div>• Horario: {account.rules.tradingHours.start}-{account.rules.tradingHours.end}</div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {accounts.length === 0 && (
        <Card className="bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-cyan-900/20 border-purple-500/30">
          <CardContent className="text-center py-8">
            <Wallet className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <div className="text-white font-medium mb-2">No tienes cuentas registradas</div>
            <div className="text-purple-200/70 mb-4">Crea tu primera cuenta para comenzar a gestionar tus trades</div>
            <Button 
              onClick={() => setCreating(true)}
              className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Cuenta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de gestión de etiquetas */}
      {showLabelsManager && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <LabelsManager 
              userId={user.id} 
              onLabelsChange={(updatedLabels) => {
                setLabels(updatedLabels)
                // Recargar cuentas para actualizar las etiquetas
                loadAccounts()
              }}
            />
            <div className="mt-4 text-center">
              <Button 
                onClick={() => setShowLabelsManager(false)}
                variant="outline"
                className="border-gray-600 text-gray-400 hover:bg-gray-800"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountManager