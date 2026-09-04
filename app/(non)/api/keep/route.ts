import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from '@/prisma';
import { z } from 'zod';

const httpUrl = z.string().trim().url().max(2048).refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === 'http:' || protocol === 'https:';
}, 'Only HTTP and HTTPS URLs are allowed.');

const createKeepSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(5000).optional().default(''),
  url: httpUrl,
  image: z.union([httpUrl, z.literal('')]).optional().default(''),
}).strict();

const deleteKeepSchema = z.object({
  id: z.number().int().positive(),
}).strict();

export async function GET() {
  try {
    return NextResponse.json(
      { message: 'Hello, World!' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
  }
  try {
    const parsed = createKeepSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid bookmark data.' }, { status: 400 });
    }

    await prisma.keep.create({ data: { ...parsed.data, userId: session.user.id } });

    return NextResponse.json(
      { message: 'Keep created successfully.' },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Unable to create the bookmark.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
  }
  try {
    const parsed = deleteKeepSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid bookmark identifier.' }, { status: 400 });
    }
    const { id } = parsed.data;

    if (session?.user?.role === 'admin') {
      await prisma.keep.delete({
        where: {
          id,
        },
      });
    } else {
      await prisma.keep.delete({
        where: {
          id,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(
      { message: 'Keep deleted successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Unable to delete the bookmark.' },
      { status: 500 }
    );
  }
}
