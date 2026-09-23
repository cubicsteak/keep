import { NextResponse } from 'next/server';
import { prisma } from '@/prisma';

type Props = {
  params: Promise<{ id: string }>;
};

const ID_PATTERN = /^[1-9][0-9]{0,9}$/;

// Counted from the click rather than a redirect hop, so a crawler that never
// clicks stays out of the tally. The trade is that a click which never reaches
// here — no JS, a blocked beacon — goes uncounted, which this number can afford.
export async function POST(request: Request, { params }: Props) {
  const { id: raw } = await params;

  if (!ID_PATTERN.test(raw)) {
    return new NextResponse(null, { status: 404 });
  }
  const id = Number(raw);
  if (!Number.isSafeInteger(id)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    await prisma.keep.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  } catch (error) {
    // P2025 is Prisma's "record not found": a deleted bookmark, not a fault.
    if ((error as { code?: string }).code === 'P2025') {
      return new NextResponse(null, { status: 404 });
    }
    console.error(error);
    return new NextResponse(null, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
