import { NextResponse } from 'next/server';
import { getPatientQueue } from '@/lib/triage-store';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      facilityType: searchParams.get('facilityType') || 'ALL',
      triageLevel: searchParams.get('triageLevel') || 'ALL',
      status: searchParams.get('status') || 'ALL',
      search: searchParams.get('search') || ''
    };

    const queue = getPatientQueue(filters);

    return NextResponse.json({
      success: true,
      count: queue.length,
      filters,
      data: queue
    });
  } catch (err) {
    console.error('Error fetching triage queue:', err);
    return NextResponse.json({ error: 'Internal Server Error fetching triage queue.' }, { status: 500 });
  }
}
