export interface StartInteractionParams {
  walletAddress: string
  metadata?: Record<string, any>
}

export interface CompleteInteractionParams {
  walletAddress: string
  sessionId: string
  hasMinted: boolean
  contractAddress?: string
  transactionHash?: string
  tokenName?: string
  tokenSymbol?: string
  totalSupply?: string
  metadata?: Record<string, any>
}

export function generateSessionId(): string {
  try {
    // Prefer Web Crypto when available
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      // @ts-ignore - runtime check above
      return crypto.randomUUID()
    }
  } catch (_) {
    // noop, fallback to uuid library
  }
  // Fallback: generate RFC4122 v4 using random values
  const getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues
    ? (arr: Uint8Array) => crypto.getRandomValues(arr)
    : (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256)
        }
        return arr
      }
  const rnds = getRandomValues(new Uint8Array(16))
  rnds[6] = (rnds[6] & 0x0f) | 0x40
  rnds[8] = (rnds[8] & 0x3f) | 0x80
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return (
    toHex(rnds[0]) + toHex(rnds[1]) + toHex(rnds[2]) + toHex(rnds[3]) + '-' +
    toHex(rnds[4]) + toHex(rnds[5]) + '-' +
    toHex(rnds[6]) + toHex(rnds[7]) + '-' +
    toHex(rnds[8]) + toHex(rnds[9]) + '-' +
    toHex(rnds[10]) + toHex(rnds[11]) + toHex(rnds[12]) + toHex(rnds[13]) + toHex(rnds[14]) + toHex(rnds[15])
  )
}

export async function startInteraction(params: StartInteractionParams): Promise<{ interactionId?: string; sessionId: string; ok?: boolean }>
{
  const sessionId = generateSessionId()
  const res = await fetch('/api/interactions/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, sessionId })
  })

  if (!res.ok) {
    // still return sessionId for client-side correlation
    return { sessionId }
  }
  const data = await res.json()
  return { interactionId: data.interactionId, sessionId, ok: true }
}

export async function completeInteraction(params: CompleteInteractionParams): Promise<boolean> {
  const res = await fetch('/api/interactions/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  })
  return res.ok
}


