import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { Interaction } from '@/lib/models/Interaction'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const wallet = (searchParams.get('wallet') || '').toLowerCase()
    if (!wallet) {
      return NextResponse.json({ error: 'wallet query param is required' }, { status: 400 })
    }

    const [totals, perToken] = await Promise.all([
      Interaction.aggregate([
        { $match: { walletAddress: wallet } },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            totalCompleted: { $sum: { $cond: [{ $ifNull: ['$completedAt', false] }, 1, 0] } },
            totalMinted: { $sum: { $cond: ['$hasMinted', 1, 0] } },
            firstSeen: { $min: '$createdAt' },
            lastSeen: { $max: '$updatedAt' }
          }
        }
      ]),
      Interaction.aggregate([
        { $match: { walletAddress: wallet, hasMinted: true } },
        {
          $group: {
            _id: '$contractAddress',
            tokenName: { $last: '$tokenName' },
            tokenSymbol: { $last: '$tokenSymbol' },
            totalSupply: { $last: '$totalSupply' },
            mints: { $sum: 1 },
            lastTx: { $last: '$transactionHash' },
            lastMintAt: { $max: '$completedAt' }
          }
        },
        { $sort: { lastMintAt: -1 } }
      ])
    ])

    const summary = {
      wallet,
      totalSessions: totals[0]?.totalSessions || 0,
      totalCompleted: totals[0]?.totalCompleted || 0,
      totalMinted: totals[0]?.totalMinted || 0,
      distinctMintedTokens: perToken.filter(t => t._id).length,
      firstSeen: totals[0]?.firstSeen || null,
      lastSeen: totals[0]?.lastSeen || null,
      tokens: perToken.map(t => ({
        contractAddress: t._id,
        tokenName: t.tokenName,
        tokenSymbol: t.tokenSymbol,
        totalSupply: t.totalSupply,
        mints: t.mints,
        lastTx: t.lastTx,
        lastMintAt: t.lastMintAt
      }))
    }

    return NextResponse.json(summary)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}


