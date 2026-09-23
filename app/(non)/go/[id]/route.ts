import { NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import { parsePublicHttpDestination } from '@/lib/safe-url';

type Props = {
  params: Promise<{ id: string }>;
};

// A redirect that counts must never be cached, by the browser or by a CDN.
// Referrer-Policy makes dropping the referrer the server's guarantee rather than
// the markup's: the cards carry rel="noreferrer", but /go/[id] is a shareable URL
// and a visitor arriving any other way would otherwise hand their referrer to the
// destination. The policy set on a redirect governs the request it triggers.
const secureHeaders = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
};

const ID_PATTERN = /^[1-9][0-9]{0,9}$/;

function notFound() {
  return new NextResponse('Not Found', { status: 404, headers: secureHeaders });
}

export async function GET(request: Request, { params }: Props) {
  const { id: raw } = await params;

  if (!ID_PATTERN.test(raw)) {
    return notFound();
  }
  const id = Number(raw);
  if (!Number.isSafeInteger(id)) {
    return notFound();
  }

  try {
    // The destination is always read from the row; a query string can never
    // choose where a visitor lands. Counting and reading share one transaction
    // so a failed increment cannot produce a silently uncounted redirect.
    const destination = await prisma.$transaction(async (tx) => {
      const keep = await tx.keep.findUnique({
        where: { id },
        select: { url: true },
      });

      const url = parsePublicHttpDestination(keep?.url);
      if (!url) return null;

      await tx.keep.update({
        where: { id },
        data: { views: { increment: 1 } },
      });

      return url.toString();
    });

    if (!destination) {
      return notFound();
    }

    return NextResponse.redirect(destination, { status: 302, headers: secureHeaders });
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500, headers: secureHeaders });
  }
}

// Next derives HEAD from GET unless it is exported, which would let monitors and
// link previews inflate the count. Answer them without touching the row.
export async function HEAD() {
  return new NextResponse(null, { status: 204, headers: secureHeaders });
}
