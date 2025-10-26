import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Rutas que requieren autenticación
  const protectedRoutes = ['/dashboard', '/analytics', '/comparison']
  
  // Rutas de autenticación (redirigir si ya está autenticado)
  const authRoutes = ['/login', '/register']
  
  const pathname = request.nextUrl.pathname
  
  // Verificar si es una ruta protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Verificar si es una ruta de autenticación
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  // Obtener token del localStorage (esto se hace en el cliente)
  // Por ahora, permitimos el acceso y manejamos la autenticación en el cliente
  
  if (isProtectedRoute) {
    // En una implementación real, verificarías el token aquí
    // Por ahora, permitimos el acceso
    return NextResponse.next()
  }
  
  if (isAuthRoute) {
    // En una implementación real, verificarías si el usuario ya está autenticado
    // Por ahora, permitimos el acceso
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
