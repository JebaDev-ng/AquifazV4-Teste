import Link from 'next/link'
import Image from 'next/image'

export function Navbar() {
  return (
    <header className="fixed top-0 w-full bg-white/80 dark:bg-black/80 backdrop-blur-md z-50 border-b border-[#D2D2D7] dark:border-[#38383A]">
      <nav className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 sm:h-24">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.svg"
              alt="AquiFaz"
              width={120}
              height={40}
              className="h-8 sm:h-10 w-auto"
              priority
            />
          </Link>

          {/* Actions */}
          <div className="flex items-center">
            <Link
              href="https://wa.me/5563992731977"
              target="_blank"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#1D1D1F] hover:bg-black text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              Solicitar Orçamento
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
