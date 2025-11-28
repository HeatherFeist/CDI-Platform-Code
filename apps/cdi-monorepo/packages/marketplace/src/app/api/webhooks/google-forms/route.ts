import { NextRequest, NextResponse } from 'next/server';

// Google Forms webhook (integration disabled)
export async function POST(request: NextRequest) {
  console.log('Google Forms webhook received (integration disabled)');
  return NextResponse.json({ message: 'Webhook received but integration disabled' }, { status: 200 });
}