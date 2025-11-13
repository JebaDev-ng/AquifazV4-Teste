import { useCallback, useEffect, useMemo } from 'react'
import { useSyncExternalStore } from 'react'

// Shared store pattern que oferece efeito equivalente ao SWR sem dependências externas.

import type { HomepageSectionWithItems } from '@/lib/types'

type HomepageSectionsResponse = {
  sections?: HomepageSectionWithItems[]
  error?: string
}

type HomepageSectionsState = {
  sections: HomepageSectionWithItems[] | null
  isLoading: boolean
  error: Error | null
}

let state: HomepageSectionsState = {
  sections: null,
  isLoading: false,
  error: null,
}

const listeners = new Set<() => void>()

function emit(partial: Partial<HomepageSectionsState>) {
  state = { ...state, ...partial }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

async function fetchSections(force = false) {
  if (state.isLoading) {
    return
  }

  if (!force && state.sections !== null) {
    return
  }

  emit({ isLoading: true, error: null })

  try {
    const response = await fetch('/api/admin/content/homepage-sections', {
      credentials: 'include',
    })

    if (!response.ok) {
      const message = `Falha ao carregar seções (${response.status})`
      throw new Error(message)
    }

    const payload = (await response.json()) as HomepageSectionsResponse

    if (payload.error) {
      throw new Error(payload.error)
    }

    const sections = (payload.sections ?? [])
      .map((section) => ({
        ...section,
        title: section.title?.trim() || 'Seção sem título',
        sort_order: section.sort_order ?? 0,
        is_active: section.is_active ?? true,
        items: (section.items ?? []).map((item) => ({
          ...item,
          sort_order: item.sort_order ?? 0,
        })),
      }))
      .sort((a, b) => a.sort_order - b.sort_order)

    emit({ sections, isLoading: false, error: null })
  } catch (error) {
    emit({ error: error instanceof Error ? error : new Error('Erro ao carregar seções'), isLoading: false })
  }
}

function setSections(next: HomepageSectionWithItems[] | null) {
  emit({ sections: next })
}

function updateSections(
  updater: (sections: HomepageSectionWithItems[] | null) => HomepageSectionWithItems[] | null,
) {
  const next = updater(state.sections)
  setSections(next)
}

export function mutateHomepageSections(
  updater?:
    | HomepageSectionWithItems[]
    | null
    | ((sections: HomepageSectionWithItems[] | null) => HomepageSectionWithItems[] | null),
) {
  if (typeof updater === 'function') {
    updateSections(updater)
    return
  }

  if (Array.isArray(updater) || updater === null) {
    setSections(updater)
    return
  }

  void fetchSections(true)
}

export function refreshHomepageSections(force = false) {
  return fetchSections(force)
}

export function getHomepageSectionsSnapshot() {
  return state
}

export function resetHomepageSectionsCache() {
  state = {
    sections: null,
    isLoading: false,
    error: null,
  }
  emit({ ...state })
}

export function useHomepageSections() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  useEffect(() => {
    if (!snapshot.sections && !snapshot.isLoading && !snapshot.error) {
      void fetchSections()
    }
  }, [snapshot.sections, snapshot.isLoading, snapshot.error])

  const refresh = useCallback(() => fetchSections(true), [])

  const mutate = useCallback(
    (updater?: (sections: HomepageSectionWithItems[] | null) => HomepageSectionWithItems[] | null) =>
      mutateHomepageSections(updater),
    [],
  )

  return useMemo(
    () => ({
      sections: snapshot.sections ?? [],
      isLoading: snapshot.isLoading && !snapshot.sections,
      isFetching: snapshot.isLoading,
      error: snapshot.error,
      refresh,
      mutate,
    }),
    [snapshot.sections, snapshot.isLoading, snapshot.error, refresh, mutate],
  )
}

export type { HomepageSectionWithItems }

export const homepageSectionsStore = {
  subscribe,
  getSnapshot,
  fetch: fetchSections,
  mutate: mutateHomepageSections,
  refresh: refreshHomepageSections,
  reset: resetHomepageSectionsCache,
}
