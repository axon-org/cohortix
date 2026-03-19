import { runOpenClaw } from './command'

export function parseGatewayJsonOutput(raw: string): unknown | null {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return null

  const objectStart = trimmed.indexOf('{')
  const arrayStart = trimmed.indexOf('[')
  const hasObject = objectStart >= 0
  const hasArray = arrayStart >= 0

  let start = -1
  let end = -1

  if (hasObject && hasArray) {
    if (objectStart < arrayStart) {
      start = objectStart
      end = trimmed.lastIndexOf('}')
    } else {
      start = arrayStart
      end = trimmed.lastIndexOf(']')
    }
  } else if (hasObject) {
    start = objectStart
    end = trimmed.lastIndexOf('}')
  } else if (hasArray) {
    start = arrayStart
    end = trimmed.lastIndexOf(']')
  }

  if (start < 0 || end < start) return null

  try {
    return JSON.parse(trimmed.slice(start, end + 1))
  } catch {
    return null
  }
}

export async function callOpenClawGateway<T = unknown>(
  method: string,
  params: unknown,
  timeoutMs = 10000,
): Promise<T> {
  let stdout: string

  try {
    const result = await runOpenClaw(
      [
        'gateway',
        'call',
        method,
        '--timeout',
        String(Math.max(1000, Math.floor(timeoutMs))),
        '--params',
        JSON.stringify(params ?? {}),
        '--json',
      ],
      { timeoutMs: timeoutMs + 2000 },
    )
    stdout = result.stdout
  } catch (err: unknown) {
    // The CLI may exit non-zero due to stderr warnings (e.g. plugins.allow)
    // even when stdout contains a valid JSON response. Recover in that case.
    const errStdout = String((err as Record<string, unknown>)?.stdout || '')
    const recovered = parseGatewayJsonOutput(errStdout)
    if (recovered != null) {
      return recovered as T
    }
    throw err
  }

  const payload = parseGatewayJsonOutput(stdout)
  if (payload == null) {
    throw new Error(`Invalid JSON response from gateway method ${method}`)
  }

  return payload as T
}
