import './globals.css'
      
export const metadata = {
  title: 'Traderfy - Plataforma de Trading',
  description: 'Plataforma completa para análisis de trading con historial, métricas y journaling',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-gray-900 text-white">
        {children}
      </body>
    </html>
  )
}