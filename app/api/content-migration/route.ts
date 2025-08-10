import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Content migration API endpoint' });
}

export async function POST() {
  return NextResponse.json({ message: 'Content migration not implemented yet' }, { status: 501 });
}