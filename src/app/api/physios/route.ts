import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const physios = await prisma.physio.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        license: true,
        specialization: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { firstName: 'asc' },
    });

    return NextResponse.json({ physios });
  } catch (error) {
    console.error('Error fetching physios:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
