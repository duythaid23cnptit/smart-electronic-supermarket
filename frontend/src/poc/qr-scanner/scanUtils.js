export function requireExactText(value) {
  if (typeof value !== 'string') {
    throw new TypeError('QR value must be handled as a string.')
  }

  return value
}

export function createDuplicateGuard() {
  let lastAcceptedValue = null

  return {
    accept(value) {
      const exactValue = requireExactText(value)

      if (exactValue === lastAcceptedValue) {
        return false
      }

      lastAcceptedValue = exactValue
      return true
    },
    reset() {
      lastAcceptedValue = null
    },
  }
}

export function isWebUrl(value) {
  try {
    const parsed = new URL(requireExactText(value))
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
