import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { PrismaClient } from '@/prisma/client';

type Props = {
  params: Promise<{ slug: string }>;
};

const prisma = new PrismaClient({
  omit: {
    user: {
      password: true,
      passsalt: true,
    },
  },
});

export async function GET(request: NextRequest, { params }: Props) {
  const session = await auth();

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
      case 'security':
        fields = {
          id: true,
          password: true,
          passsalt: true,
        };
        break;
    }

    const data = await prisma.user.findUnique({
      select: fields,
      where: {
        id: session?.user?.id ?? '',
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
      { error: error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: Props) {
  const session = await auth();

  try {
    const req = await request.json();
    // const qs = request?.nextUrl?.search?.slice(1);
    const { slug } = await params;

    if (slug === 'profile') {
      if ( !req?.nick ) {
        return NextResponse.json(
          { error: 'Name is required.' },
          { status: 400 }
        );
      }
      await prisma.user.update({
        where: {
          id: session?.user?.id ?? '',
        },
        data: {
          nick: req?.nick || null,
          bio: req?.bio || null,
          url: req?.url || null,
          photo: req?.photo || null,
        },
      });
      return NextResponse.json(
        { message: 'Updated profile successfully.' },
        { status: 200 }
      );
    }

    if (slug === 'username') {
      if (req?.username) {
        const avoid = [
          'admin', 'administrator', 
          'app', 'cms', 'auth', 'api', 'settings', 
          'profile', 'system', 'operator', 'manager', 
           'keep',
        ];
        if (avoid.includes(req?.username)) {
          return NextResponse.json(
            { error: 'Already in use.' },
            { status: 400 }
          );
        }
        const count = await prisma.user.count({
          where: {
            username: req?.username,
            NOT: {
              id: session?.user?.id ?? '',
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
          id: session?.user?.id ?? '',
        },
        data: {
          username: req?.username || null,
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
          id: session?.user?.id ?? '',
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
      { error: error },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await auth();
  try {
    await prisma.user.delete({
      where: {
        id: session?.user?.id ?? '',
      },
    });
    return NextResponse.json(
      { message: 'Deleted account successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error },
      { status: 500 }
    );
  }
}
