"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export function RegisterForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [steamConnected, setSteamConnected] = useState(false)
  const [steamData, setSteamData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register } = useAuth()

  // Verificar si viene de Steam
  useEffect(() => {
    const steamParam = searchParams.get('steam')
    if (steamParam === 'success') {
      const steamAuthData = sessionStorage.getItem('steam_auth_data')
      if (steamAuthData) {
        const data = JSON.parse(steamAuthData)
        setSteamData(data)
        setSteamConnected(true)
        // Limpiar sessionStorage
        sessionStorage.removeItem('steam_auth_data')
      }
    }
  }, [searchParams])

  const handleSteamLogin = async () => {
    setError("")
    setIsLoading(true)

    try {
      // Obtener URL de Steam OpenID del backend
      const response = await fetch('/api/auth/steam/login')
      const data = await response.json()

      if (data.success) {
        // Redirigir a Steam para autenticación
        window.location.href = data.steamLoginUrl
      } else {
        const errorMessage = data.message || "Error obteniendo URL de Steam"
        setError(errorMessage)
      }
    } catch (err) {
      const errorMessage = "Error de conexión. Inténtalo de nuevo."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validation
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setIsLoading(false)
      return
    }

    try {
      const success = await register(
        email, 
        password, 
        steamConnected ? steamData?.steamId : undefined,
        steamConnected ? steamData?.steamUsername : undefined
      )
      
      if (success) {
        router.push("/")
      } else {
        setError("Error al crear la cuenta. Inténtalo de nuevo.")
      }
    } catch (error) {
      setError("Error al crear la cuenta. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image 
            src="/tacticore-logo.png" 
            alt="TACTICORE" 
            width={200} 
            height={60} 
            className="h-12 w-auto"
          />
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
            <CardDescription>
              Únete a TACTICORE y comienza a analizar tus partidas de Counter-Strike
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Steam Account Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">1</span>
                </div>
                <h3 className="text-lg font-semibold">Steam Account</h3>
              </div>
              
              <div className="space-y-3">
                {steamConnected ? (
                  <div className="w-full h-12 border-2 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-md flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-600 font-medium">
                      STEAM CONNECTED - {steamData?.steamUsername}
                    </span>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-2 border-border hover:border-primary/50"
                    onClick={handleSteamLogin}
                    disabled={isLoading}
                  >
                    <Image 
                      src="/steam-logo.svg" 
                      alt="Steam" 
                      width={20} 
                      height={20} 
                      className="mr-3"
                    />
                    CONNECT STEAM
                  </Button>
                )}
                
                <p className="text-sm text-muted-foreground">
                  We use your steam account to get your profile information and match you against other players. 
                  {steamConnected 
                    ? "Your Steam account is connected. Now complete your registration below."
                    : "Please click \"Connect Steam\" to connect your account to your Steam account."
                  }
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  O continúa con email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">2</span>
                  </div>
                  <h3 className="text-lg font-semibold">Email</h3>
                </div>
                
                <div className="space-y-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12"
                  />
                  <p className="text-sm text-muted-foreground">
                    Your e-mail is required to sign in to your account.
                  </p>
                </div>
              </div>

              {/* Password Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">3</span>
                  </div>
                  <h3 className="text-lg font-semibold">Password</h3>
                </div>
                
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Provide a password that is at least 6 characters long.
                  </p>
                </div>
              </div>

              {/* Confirm Password Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">4</span>
                  </div>
                  <h3 className="text-lg font-semibold">Confirm Password</h3>
                </div>
                
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Please confirm your password.
                  </p>
                </div>
              </div>


              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    CREATING ACCOUNT...
                  </>
                ) : (
                  "SIGN UP"
                )}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
              <Link 
                href="/login" 
                className="text-primary hover:underline font-medium"
              >
                Inicia sesión aquí
              </Link>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Al crear una cuenta, aceptas nuestros{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Términos de Servicio
              </Link>{" "}
              y{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Política de Privacidad
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
