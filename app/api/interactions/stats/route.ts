import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { Interaction } from '@/lib/models/Interaction'

export async function GET(request: Request) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100)
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0)
    const mintedOnly = searchParams.get('mintedOnly') !== 'false'

    const [totalUsers, totalCompleted, totalMinted] = await Promise.all([
      Interaction.distinct('walletAddress').then(arr => arr.length),
      Interaction.countDocuments({ completedAt: { $ne: null } }),
      Interaction.countDocuments({ hasMinted: true })
    ])

    const recentRaw = await Interaction.find(mintedOnly ? { hasMinted: true } : {})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Return a concise recent list focused on useful fields
    const recent = recentRaw.map((d: any) => ({
      id: d._id,
      walletAddress: d.walletAddress,
      startedAt: d.startedAt || d.createdAt,
      completedAt: d.completedAt,
      hasMinted: d.hasMinted,
      contractAddress: d.contractAddress,
      transactionHash: d.transactionHash,
      tokenName: d.tokenName,
      tokenSymbol: d.tokenSymbol,
      totalSupply: d.totalSupply
    }))

    return NextResponse.json({ totalUsers, totalCompleted, totalMinted, recent, limit, skip, mintedOnly })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}


