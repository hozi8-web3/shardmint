import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { Interaction } from '@/lib/models/Interaction'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()
    const { walletAddress, sessionId, metadata } = body || {}

    if (!walletAddress || !sessionId) {
      return NextResponse.json({ error: 'walletAddress and sessionId are required' }, { status: 400 })
    }

    const userAgent = request.headers.get('user-agent') || undefined
    const ip = request.headers.get('x-forwarded-for') || request.ip || undefined

    const doc = await Interaction.findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase(), sessionId },
      {
        walletAddress: walletAddress.toLowerCase(),
        sessionId,
        startedAt: new Date(),
        metadata,
        userAgent,
        ip
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    return NextResponse.json({ ok: true, interactionId: doc._id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}


