import { NextRequest, NextResponse } from 'next/server';
import { getMaintenanceInfo } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const maintenanceInfo = await getMaintenanceInfo();
    
    return NextResponse.json({
      success: true,
      maintenance: maintenanceInfo
    });
  } catch (error) {
    console.error('Erro ao verificar status de manutenção:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao verificar status de manutenção',
        maintenance: {
          isActive: false,
          message: '',
          estimatedTime: ''
        }
      },
      { status: 500 }
    );
  }
} 