'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/admin/ui/button'
import { ToggleSwitch } from '@/components/admin/ui/toggle-switch'
import { DEFAULT_HOMEPAGE_SETTINGS } from '@/lib/content'
import type { HomepageSettings } from '@/lib/types'

export default function ContentDashboardPage() {
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings>(DEFAULT_HOMEPAGE_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/content/settings')
      if (response.ok) {
        const payload = await response.json()
        setHomepageSettings({ ...DEFAULT_HOMEPAGE_SETTINGS, ...payload })
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/content/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          use_mock_data: homepageSettings.use_mock_data,
          use_new_homepage_sections: homepageSettings.use_new_homepage_sections,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar configuração')
      }
    } catch (error) {
      console.error('Erro ao salvar configurações da homepage:', error)
      alert('Não foi possível salvar as configurações. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const updateMockToggle = (enabled: boolean) => {
    setHomepageSettings((prev) => ({
      ...prev,
      use_mock_data: enabled,
      use_new_homepage_sections: enabled ? false : prev.use_new_homepage_sections,
    }))
  }

  const updateDynamicToggle = (enabled: boolean) => {
    setHomepageSettings((prev) => ({
      ...prev,
      use_new_homepage_sections: enabled,
      use_mock_data: enabled ? false : prev.use_mock_data,
    }))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-1/3 rounded-lg bg-[#E5E5EA] animate-pulse" />
        <div className="h-32 rounded-2xl bg-[#F5F5F5] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm text-[#6E6E73] mb-2">Homepage</p>
        <h1 className="text-3xl font-normal text-[#1D1D1F]">Gestão de Conteúdo da Página Inicial</h1>
        <p className="text-[#6E6E73] mt-2 max-w-3xl">
          Ative o modo mock data para testar o site com segurança e controle a flag que libera as novas
          seções dinâmicas. As áreas específicas (Hero e Banners) ficam disponíveis nas abas laterais.
        </p>
      </header>

      <section className="rounded-2xl border border-[#E5E5EA] bg-white p-6 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#6E6E73] mb-1">Plano de segurança</p>
            <h2 className="text-2xl font-normal text-[#1D1D1F]">Modo mock data da homepage</h2>
            <p className="text-sm text-[#6E6E73] max-w-2xl mt-2">
              Força a homepage pública a consumir apenas os dados fictícios. Ideal para validações rápidas
              sem impactar os visitantes.
            </p>
          </div>

          <ToggleSwitch
            checked={homepageSettings.use_mock_data}
            onClick={() => updateMockToggle(!homepageSettings.use_mock_data)}
            label={homepageSettings.use_mock_data ? 'Mocks ativados' : 'Mocks desativados'}
            description={
              homepageSettings.use_mock_data
                ? 'Homepage exibindo apenas dados fictícios.'
                : 'Homepage usando dados reais do painel.'
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[#E5E5EA] bg-white p-6 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#6E6E73] mb-1">Feature flag</p>
            <h2 className="text-2xl font-normal text-[#1D1D1F]">Seções dinâmicas (Supabase)</h2>
            <p className="text-sm text-[#6E6E73] max-w-2xl mt-2">
              Libera a homepage para ler os dados de `homepage_sections`. Ao desativar, o site volta para o
              fallback antigo/mocks sem precisar de deploy.
            </p>
          </div>

          <ToggleSwitch
            checked={homepageSettings.use_new_homepage_sections}
            onClick={() => updateDynamicToggle(!homepageSettings.use_new_homepage_sections)}
            label={
              homepageSettings.use_new_homepage_sections
                ? 'Seções dinâmicas ativas'
                : 'Seções em fallback'
            }
            description={
              homepageSettings.use_new_homepage_sections
                ? 'Homepage lendo Supabase (homepage_sections).'
                : 'Homepage usando apenas os dados antigos/mocks.'
            }
          />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={saveSettings} loading={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar configuração'}
        </Button>
        <p className="text-xs text-[#6E6E73]">
          As mudanças refletem no painel imediatamente. A homepage pode levar até 1 minuto devido ao cache
          (`revalidate`).
        </p>
      </div>
    </div>
  )
}
