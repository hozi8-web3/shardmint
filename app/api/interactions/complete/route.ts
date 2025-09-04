import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { Interaction } from '@/lib/models/Interaction'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()
    const {
      walletAddress,
      sessionId,
      hasMinted,
      contractAddress,
      transactionHash,
      tokenName,
      tokenSymbol,
      totalSupply,
      metadata
    } = body || {}

    if (!walletAddress || !sessionId) {
      return NextResponse.json({ error: 'walletAddress and sessionId are required' }, { status: 400 })
    }

    const doc = await Interaction.findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase(), sessionId },
      {
        completedAt: new Date(),
        hasMinted: Boolean(hasMinted),
        contractAddress,
        transactionHash,
        tokenName,
        tokenSymbol,
        totalSupply,
        metadata
      },
      { new: true }
    )

    if (!doc) {
      return NextResponse.json({ error: 'Interaction not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}


