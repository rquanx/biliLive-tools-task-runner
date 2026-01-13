import fs from 'fs/promises'
import path from 'path'
export async function findMatchingFile(dir: string, fileName: string): Promise<string[]> {
  const matches: string[] = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const nested = await findMatchingFile(fullPath, fileName)
      matches.push(...nested)
      continue
    }

    if (entry.isFile() && entry.name === fileName) {
      matches.push(fullPath)
    }
  }
  return matches
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function isFileLocked(filePath: string) {
  try {
    const handle = await fs.open(filePath, 'r+')
    await handle.close()
    return false
  } catch (err: any) {
    if (err?.code === 'EBUSY' || err?.code === 'EACCES' || err?.code === 'EPERM') {
      return true
    }
    return false
  }
}
