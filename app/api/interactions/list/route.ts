import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { Interaction } from '@/lib/models/Interaction'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20', 10), 1), 100)
    const mintedOnly = searchParams.get('mintedOnly') === 'true'
    const wallet = searchParams.get('wallet')?.toLowerCase()

    const filter: any = {}
    if (mintedOnly) filter.hasMinted = true
    if (wallet) filter.walletAddress = wallet

    const total = await Interaction.countDocuments(filter)
    const items = await Interaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()

    return NextResponse.json({ page, pageSize, total, items })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}


