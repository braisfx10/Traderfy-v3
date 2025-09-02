'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { 
  UserCheck, 
  Search, 
  Check, 
  X, 
  User,
  AlertCircle
} from 'lucide-react'
import {
  getAvailableMentors,
  getStudentMentor,
  assignMentorToStudent,
  isStudent
} from '../lib/mentorshipService'

const MentorSelector = ({ user, onMentorAssigned }) => {
  const [mentors, setMentors] = useState([])
  const [currentMentor, setCurrentMentor] = useState(null)
  const [selectedMentor, setSelectedMentor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user?.id && isStudent(user)) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar mentores disponibles y mentor actual en paralelo
      const [availableMentors, studentMentor] = await Promise.all([
        getAvailableMentors(),
        getStudentMentor(user.id)
      ])
      
      setMentors(availableMentors)
      setCurrentMentor(studentMentor)
      
    } catch (error) {
      console.error('Error loading mentor data:', error)
      setError('Error al cargar los datos de mentores')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignMentor = async () => {
    if (!selectedMentor) return

    const confirmMessage = currentMentor 
      ? `¿Estás seguro de que deseas cambiar tu mentor de ${currentMentor.mentor.full_name || currentMentor.mentor.email} a ${selectedMentor.full_name || selectedMentor.email}?`
      : `¿Estás seguro de que deseas seleccionar a ${selectedMentor.full_name || selectedMentor.email} como tu mentor?`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setAssigning(true)
      setError('')
      
      await assignMentorToStudent(user.id, selectedMentor.id)
      
      setSuccess(`¡Mentor asignado exitosamente! ${selectedMentor.full_name || selectedMentor.email} es ahora tu mentor.`)
      setSelectedMentor(null)
      
      // Recargar datos
      await loadData()
      onMentorAssigned?.(selectedMentor)
      
    } catch (error) {
      console.error('Error assigning mentor:', error)
      setError(error.message || 'Error al asignar el mentor')
    } finally {
      setAssigning(false)
    }
  }

  if (!isStudent(user)) {
    return (
      <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-800/10 border-yellow-500/30">
        <CardContent className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <div className="text-white font-medium mb-2">Funcionalidad no disponible</div>
          <div className="text-yellow-200/70">Solo los usuarios con rol "Alumno" pueden seleccionar un mentor</div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-cyan-900/20 border-purple-500/30">
        <CardContent className="text-center py-8">
          <div className="text-purple-200/70">Cargando mentores...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-gradient-to-r from-red-900/50 to-red-800/40 border border-red-500/50 rounded text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-gradient-to-r from-green-900/50 to-green-800/40 border border-green-500/50 rounded text-green-200">
          {success}
        </div>
      )}

      {/* Mentor actual */}
      {currentMentor && (
        <Card className="bg-gradient-to-br from-green-900/20 to-emerald-800/10 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-400" />
              Tu Mentor Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">
                  {currentMentor.mentor.full_name || currentMentor.mentor.email}
                </div>
                <div className="text-green-200/70 text-sm">{currentMentor.mentor.email}</div>
                <div className="text-green-300/50 text-xs">
                  Mentoría desde: {new Date(currentMentor.created_at).toLocaleDateString('es-ES')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selección de mentor */}
      <Card className="bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-cyan-900/20 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-400" />
            {currentMentor ? 'Cambiar Mentor' : 'Seleccionar Mentor'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mentors.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
              <div className="text-white font-medium mb-2">No hay mentores disponibles</div>
              <div className="text-purple-200/70">No se encontraron mentores registrados en el sistema</div>
            </div>
          ) : (
            <>
              <Label className="text-purple-300">Mentores Disponibles</Label>
              <div className="space-y-3">
                {mentors.map(mentor => {
                  const isSelected = selectedMentor?.id === mentor.id
                  const isCurrent = currentMentor?.mentor.id === mentor.id
                  
                  return (
                    <div
                      key={mentor.id}
                      className={`
                        p-4 rounded-lg border cursor-pointer transition-all duration-300
                        ${isSelected 
                          ? 'bg-gradient-to-r from-purple-600/30 to-cyan-500/30 border-purple-400 scale-105' 
                          : isCurrent
                            ? 'bg-gradient-to-r from-green-600/20 to-emerald-500/20 border-green-500/50'
                            : 'bg-gradient-to-r from-slate-700/60 to-slate-600/40 border-purple-500/20 hover:from-slate-600/70 hover:to-slate-500/50'
                        }
                      `}
                      onClick={() => {
                        if (!isCurrent) {
                          setSelectedMentor(isSelected ? null : mentor)
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center
                            ${isCurrent 
                              ? 'bg-gradient-to-r from-green-600 to-emerald-500' 
                              : 'bg-gradient-to-r from-purple-600 to-cyan-500'
                            }
                          `}>
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-white font-medium">
                              {mentor.full_name || mentor.email}
                            </div>
                            <div className="text-purple-200/70 text-sm">{mentor.email}</div>
                            {isCurrent && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-green-600/50 text-green-200 text-xs rounded">
                                Mentor Actual
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <Check className="w-5 h-5 text-purple-400" />
                          )}
                          {isCurrent && (
                            <UserCheck className="w-5 h-5 text-green-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Botones de acción */}
              {selectedMentor && (
                <div className="flex gap-3 pt-4 border-t border-purple-500/20">
                  <Button 
                    onClick={handleAssignMentor}
                    disabled={assigning}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {assigning ? 'Asignando...' : currentMentor ? 'Cambiar Mentor' : 'Confirmar Selección'}
                  </Button>
                  <Button 
                    onClick={() => setSelectedMentor(null)}
                    variant="outline"
                    disabled={assigning}
                    className="border-gray-600 text-gray-400 hover:bg-gray-800"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Información adicional */}
          <div className="bg-gradient-to-r from-slate-700/60 to-slate-600/40 p-3 rounded-lg border border-purple-500/20 mt-4">
            <div className="text-sm text-purple-300 font-medium mb-1">ℹ️ Información importante:</div>
            <ul className="text-xs text-purple-200/70 space-y-1">
              <li>• Tu mentor podrá ver todas tus cuentas y trades</li>
              <li>• Solo puedes tener un mentor activo a la vez</li>
              <li>• El cambio de mentor es inmediato</li>
              {currentMentor && <li>• Cambiar de mentor notificará a tu mentor actual</li>}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MentorSelector