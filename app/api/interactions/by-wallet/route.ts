import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { Interaction } from '@/lib/models/Interaction'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const wallet = (searchParams.get('wallet') || '').toLowerCase()
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20', 10), 1), 100)

    if (!wallet) {
      return NextResponse.json({ error: 'wallet query param is required' }, { status: 400 })
    }

    const filter: any = { walletAddress: wallet, hasMinted: true }
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


