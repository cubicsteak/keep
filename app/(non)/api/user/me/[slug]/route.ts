import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from '@/prisma';
import { z } from 'zod';

type Props = {
  params: Promise<{ slug: string }>;
};

const webUrl = z.string().trim().url().max(2048).refine((value) => {
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
});

const profileSchema = z.object({
  nick: z.string().trim().min(2).max(16),
  email: z.string().email().optional(),
  bio: z.string().max(1000).optional().default(''),
  url: z.union([webUrl, z.literal('')]).optional().default(''),
  photo: z.union([webUrl, z.literal('')]).optional().default(''),
}).strict();

const usernameSchema = z.object({
  username: z.union([
    z.string().trim().min(3).max(20).regex(/^[A-Za-z0-9][A-Za-z0-9-]{2,19}$/),
    z.literal(''),
  ]),
}).strict();

export async function GET(request: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
  }

  try {
    // const req = await request.json();
    // const qs = request?.nextUrl?.search?.slice(1) ?? '';
    const { slug } = await params;

    let fields = null;
    switch (slug) {
      case 'profile':
        fields = {
          nick: true,
          email: true,
          bio: true,
          url: true,
          photo: true,
        };
        break;
      case 'username':
        fields = {
          username: true,
        };
        break;
      case 'provider':
        fields = {
          id: true,
          email: true,
          accounts: {
            select: {
              type: true,
              provider: true,
              createdAt: true,
            },
          },
        };
        break;
    }

    if (!fields) {
      return NextResponse.json({ error: 'Unknown settings resource.' }, { status: 404 });
    }

    const data = await prisma.user.findUnique({
      select: fields,
      where: {
        id: session.user.id,
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    if (slug && data) {
      // empty string instead of null
      for (const [key, value] of Object.entries(data)) {
        data[key] = value === null ? '' : value;
      }
    }

    return NextResponse.json(
      data,
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Unable to load account settings.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
  }

  try {
    const req = await request.json();
    // const qs = request?.nextUrl?.search?.slice(1);
    const { slug } = await params;

    if (slug === 'profile') {
      const parsed = profileSchema.safeParse(req);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid profile data.' }, { status: 400 });
      }
      await prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          nick: parsed.data.nick,
          bio: parsed.data.bio || null,
          url: parsed.data.url || null,
          photo: parsed.data.photo || null,
        },
      });
      return NextResponse.json(
        { message: 'Updated profile successfully.' },
        { status: 200 }
      );
    }

    if (slug === 'username') {
      const parsed = usernameSchema.safeParse(req);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid username.' }, { status: 400 });
      }
      const username = parsed.data.username;
      if (username) {
        const avoid = [
          'admin', 'administrator', 
          'app', 'cms', 'auth', 'api', 'settings', 
          'profile', 'system', 'operator', 'manager', 
           'keep',
        ];
        if (avoid.includes(username.toLowerCase())) {
          return NextResponse.json(
            { error: 'Already in use.' },
            { status: 400 }
          );
        }
        const count = await prisma.user.count({
          where: {
            username: {
              equals: username,
              mode: 'insensitive',
            },
            NOT: {
              id: session.user.id,
            },
          },
        });
        if (count > 0) {
          return NextResponse.json(
            { error: 'Already in use.' },
            { status: 400 }
          );
        }
      }
      await prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          username: username || null,
        },
      });
      return NextResponse.json(
        { message: 'Updated username successfully.' },
        { status: 200 }
      );
    }

    if (slug === 'remove-username') {
      await prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          username: null,
        },
      });
      return NextResponse.json(
        { message: 'Removed username successfully.' },
        { status: 200 }
      );
    }

    if (slug === 'security') {
    }

    return NextResponse.json(
      { error: 'Failed update settings.' },
      { status: 500 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Unable to update account settings.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
  }
  try {
    await prisma.user.delete({
      where: {
        id: session.user.id,
      },
    });
    return NextResponse.json(
      { message: 'Deleted account successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Unable to delete the account.' },
      { status: 500 }
    );
  }
}
