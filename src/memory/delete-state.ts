let canDelete = true

export function getCanDelete() {
  return canDelete
}

export function pauseDelete() {
  canDelete = false
}

export function resumeDelete() {
  canDelete = true
}
