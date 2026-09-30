import { NextResponse } from 'next/server';
import { getFacilityStats } from '@/lib/triage-store';

export async function GET() {
  try {
    const stats = getFacilityStats();
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Error fetching facility triage stats:', err);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
