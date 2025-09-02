'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { 
  TrendingUp, 
  Eye, 
  EyeOff, 
  Loader2,
  Mail,
  Lock,
  User
} from 'lucide-react'

export const AuthModal = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('Trader')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (!isLogin) {
        // Validaciones para registro
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden')
          return
        }
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres')
          return
        }

        const { data, error } = await signUp(email, password, role)
        if (error) {
          setError(error.message)
        } else {
          setMessage('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.')
          // Cambiar a modo login después de registro exitoso
          setTimeout(() => {
            setIsLogin(true)
            setMessage('')
          }, 3000)
        }
      } else {
        // Login
        const { data, error } = await signIn(email, password)
        if (error) {
          setError(error.message)
        } else {
          setMessage('¡Inicio de sesión exitoso!')
          // El AuthProvider manejará el cambio de estado del usuario
          setTimeout(() => {
            onClose && onClose()
          }, 1000)
        }
      }
    } catch (error) {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setMessage('')
    setRole('Trader')
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    resetForm()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-purple-500/30 shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <TrendingUp className="w-10 h-10 gradient-traderfy-text" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-3xl font-bold gradient-traderfy-text">Traderfy</h1>
          </div>
          <div>
            <CardTitle className="text-2xl text-white">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </CardTitle>
            <CardDescription className="text-purple-200/70 mt-2">
              {isLogin 
                ? 'Accede a tu plataforma de trading' 
                : 'Únete a la comunidad de traders profesionales'
              }
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label className="text-purple-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="bg-gradient-to-r from-purple-500/10 to-cyan-400/10 border-purple-500/30 text-white placeholder:text-purple-200/50 focus:border-purple-400 focus:ring-purple-400/20"
              />
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <Label className="text-cyan-300 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-gradient-to-r from-purple-500/10 to-cyan-400/10 border-cyan-500/30 text-white placeholder:text-cyan-200/50 focus:border-cyan-400 focus:ring-cyan-400/20 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Confirmar contraseña (solo en registro) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label className="text-indigo-300 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirmar Contraseña
                </Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-gradient-to-r from-purple-500/10 to-cyan-400/10 border-indigo-500/30 text-white placeholder:text-indigo-200/50 focus:border-indigo-400 focus:ring-indigo-400/20"
                />
              </div>
            )}

            {/* Rol (solo en registro) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label className="text-purple-300 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Rol
                </Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2 bg-gradient-to-r from-purple-500/10 to-cyan-400/10 border border-purple-500/30 rounded text-white focus:border-purple-400 focus:ring-purple-400/20"
                >
                  <option value="Trader">Trader</option>
                  <option value="Alumno">Alumno</option>
                  <option value="Mentor">Mentor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            )}

            {/* Mensajes de error y éxito */}
            {error && (
              <div className="p-3 bg-gradient-to-r from-red-900/50 to-red-800/40 border border-red-500/50 rounded text-red-200 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 bg-gradient-to-r from-green-900/50 to-green-800/40 border border-green-500/50 rounded text-green-200 text-sm">
                {message}
              </div>
            )}

            {/* Botón de envío */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white font-medium py-2.5 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/25"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isLogin ? 'Iniciando...' : 'Registrando...'}
                </div>
              ) : (
                isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
              )}
            </Button>
          </form>

          {/* Toggle entre login y registro */}
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-500/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-purple-300">O</span>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={toggleMode}
              className="w-full text-cyan-400 hover:text-cyan-300 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-purple-500/10 transition-all duration-300"
            >
              {isLogin 
                ? '¿No tienes cuenta? Regístrate' 
                : '¿Ya tienes cuenta? Inicia sesión'
              }
            </Button>

            {/* Botón para cerrar (modo demo) */}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full border-gray-600 text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-300"
            >
              Continuar sin autenticación (Demo)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}