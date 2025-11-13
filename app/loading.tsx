export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-text-primary"></div>
        <p className="mt-4 text-text-secondary">Carregando...</p>
      </div>
    </div>
  )
}
