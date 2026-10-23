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

export function createOperationGuard() {
  let activeOperation = null

  return {
    tryStart(operation) {
      if (activeOperation !== null) return false
      activeOperation = operation
      return true
    },
    finish(operation) {
      if (activeOperation === operation) activeOperation = null
    },
    isActive() {
      return activeOperation !== null
    },
  }
}

export function summarizeDurations(values) {
  if (!Array.isArray(values) || values.length === 0 || values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new TypeError('Durations must be a non-empty array of non-negative finite numbers.')
  }

  const sorted = [...values].sort((left, right) => left - right)
  const percentile95Index = Math.ceil(sorted.length * 0.95) - 1
  const middle = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]

  return {
    n: sorted.length,
    mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
    median,
    p95: sorted[percentile95Index],
    min: sorted[0],
    max: sorted.at(-1),
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
