import { NextResponse } from 'next/server';

function notFound() {
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}

export const GET = notFound;
export const POST = notFound;
export const DELETE = notFound;
