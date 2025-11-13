import { Settings } from 'lucide-react'

export default function ConfiguracoesPage() {
  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-[#6E6E73]">Administração</p>
          <h1 className="text-3xl font-normal text-[#1D1D1F]">Configurações</h1>
          <p className="text-[#6E6E73] mt-2 max-w-2xl">
            Gerencie as configurações gerais da plataforma.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#E5E5EA] rounded-2xl p-12">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#F5F5F7] flex items-center justify-center">
            <Settings className="w-8 h-8 text-[#6E6E73]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-normal text-[#1D1D1F]">Em desenvolvimento</h2>
            <p className="text-[#6E6E73] max-w-md">
              Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
