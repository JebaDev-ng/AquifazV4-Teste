import { promises as fs } from 'fs'
import path from 'path'

import { DEFAULT_HOMEPAGE_SETTINGS } from './content'
import type { HomepageSettings } from './types'

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'homepage-settings.json')

export async function readLocalHomepageSettings(): Promise<HomepageSettings> {
  try {
    const file = await fs.readFile(SETTINGS_PATH, 'utf-8')
    const parsed = JSON.parse(file) as HomepageSettings
    return {
      ...DEFAULT_HOMEPAGE_SETTINGS,
      ...parsed,
    }
  } catch {
    return DEFAULT_HOMEPAGE_SETTINGS
  }
}

export async function writeLocalHomepageSettings(settings: HomepageSettings) {
  await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true })
  await fs.writeFile(
    SETTINGS_PATH,
    JSON.stringify(
      {
        ...DEFAULT_HOMEPAGE_SETTINGS,
        ...settings,
      },
      null,
      2,
    ),
    'utf-8',
  )
}
