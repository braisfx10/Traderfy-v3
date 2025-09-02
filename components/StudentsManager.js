'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { 
  Users, 
  User, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Activity, 
  Calendar,
  BarChart3,
  Eye,
  RefreshCw,
  UserX
} from 'lucide-react'
import {
  getMentorStudents,
  getStudentMetrics,
  endMentorship,
  canActAsMentor
} from '../lib/mentorshipService'

const StudentsManager = ({ user, onStudentSelect }) => {
  const [students, setStudents] = useState([])
  const [studentsMetrics, setStudentsMetrics] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingMetrics, setLoadingMetrics] = useState({})
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.id && canActAsMentor(user)) {
      loadStudents()
    }
  }, [user])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const mentorStudents = await getMentorStudents(user.id)
      setStudents(mentorStudents)
      
      // Cargar métricas para cada estudiante
      for (const studentData of mentorStudents) {
        loadStudentMetrics(studentData.alumno.id)
      }
    } catch (error) {
      console.error('Error loading students:', error)
      setError('Error al cargar los alumnos')
    } finally {
      setLoading(false)
    }
  }

  const loadStudentMetrics = async (studentId) => {
    try {
      setLoadingMetrics(prev => ({ ...prev, [studentId]: true }))
      const metrics = await getStudentMetrics(studentId)
      
      setStudentsMetrics(prev => ({
        ...prev,
        [studentId]: metrics
      }))
    } catch (error) {
      console.error(`Error loading metrics for student ${studentId}:`, error)
    } finally {
      setLoadingMetrics(prev => ({ ...prev, [studentId]: false }))
    }
  }

  const handleEndMentorship = async (mentorshipId, studentName) => {
    if (!confirm(`¿Estás seguro de que deseas terminar la mentoría con ${studentName}?`)) {
      return
    }

    try {
      await endMentorship(mentorshipId)
      await loadStudents() // Recargar lista
    } catch (error) {
      console.error('Error ending mentorship:', error)
      setError('Error al terminar la mentoría')
    }
  }

  const handleViewStudent = (student) => {
    setSelectedStudent(student)
    onStudentSelect?.(student)
  }

  if (!canActAsMentor(user)) {
    return (
      <Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30">
        <CardContent className="text-center py-8">
          <UserX className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <div className="text-white font-medium mb-2">Acceso Denegado</div>
          <div className="text-red-200/70">No tienes permisos para acceder a la sección de alumnos</div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-cyan-900/20 border-purple-500/30">
        <CardContent className="text-center py-8">
          <div className="text-purple-200/70">Cargando alumnos...</div>
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Mis Alumnos</h1>
          <span className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white px-2 py-1 rounded text-sm">
            {students.length}
          </span>
        </div>
        <Button 
          onClick={loadStudents}
          variant="outline"
          size="sm"
          className="border-purple-500/30 text-purple-200 hover:bg-purple-500/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {students.length === 0 ? (
        <Card className="bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-cyan-900/20 border-purple-500/30">
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
            <div className="text-white font-medium mb-2">No tienes alumnos asignados</div>
            <div className="text-purple-200/70 mb-4">Los alumnos deben seleccionarte como mentor desde su perfil</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {students.map(studentData => {
            const student = studentData.alumno
            const metrics = studentsMetrics[student.id]
            const isLoadingMetrics = loadingMetrics[student.id]

            return (
              <Card 
                key={student.id} 
                className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 border-purple-500/30 hover:from-slate-700/70 hover:to-slate-600/50 transition-all duration-300"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">
                          {student.full_name || student.email}
                        </CardTitle>
                        <div className="text-sm text-purple-200/70">{student.email}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewStudent(student)}
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEndMentorship(studentData.id, student.full_name || student.email)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <UserX className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {isLoadingMetrics ? (
                    <div className="text-center py-4">
                      <div className="text-purple-200/70 text-sm">Cargando métricas...</div>
                    </div>
                  ) : metrics ? (
                    <div className="space-y-3">
                      {/* Métricas principales */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-r from-purple-500/20 to-indigo-600/10 p-3 rounded-lg border border-purple-500/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-purple-400" />
                            <span className="text-xs text-purple-300">Cuentas</span>
                          </div>
                          <div className="text-xl font-bold text-white">{metrics.metrics.totalAccounts}</div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/10 p-3 rounded-lg border border-cyan-500/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs text-cyan-300">Trades</span>
                          </div>
                          <div className="text-xl font-bold text-white">{metrics.metrics.totalTrades}</div>
                        </div>
                      </div>

                      {/* P&L y Win Rate */}
                      <div className="bg-gradient-to-r from-slate-700/60 to-slate-600/40 p-3 rounded-lg border border-purple-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {parseFloat(metrics.metrics.totalPnl) >= 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-400" />
                            )}
                            <span className="text-sm text-white">P&L Total</span>
                          </div>
                          <div className={`text-lg font-bold ${
                            parseFloat(metrics.metrics.totalPnl) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            ${parseFloat(metrics.metrics.totalPnl).toFixed(2)}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-purple-300">Win Rate</span>
                          <span className="text-sm font-medium text-purple-400">
                            {metrics.metrics.winRate}%
                          </span>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleViewStudent(student)}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600"
                        >
                          <BarChart3 className="w-3 h-3 mr-1" />
                          Ver Análisis
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-gray-400 text-sm">Sin datos disponibles</div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => loadStudentMetrics(student.id)}
                        className="mt-2 text-purple-400 hover:bg-purple-500/10"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Cargar Métricas
                      </Button>
                    </div>
                  )}

                  {/* Información adicional */}
                  <div className="border-t border-purple-500/20 pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-purple-200/70">Alumno desde:</span>
                      <span className="text-purple-300">
                        {new Date(studentData.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StudentsManager