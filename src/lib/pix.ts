// Geração de códigos PIX usando configurações do sistema
// Suporte para múltiplos provedores de pagamento

import { v4 as uuidv4 } from 'uuid';
import { getPixConfig } from './config';

interface PixOptions {
  value?: number;
  description?: string;
  entityType: 'individual' | 'company';
  name: string;
  document: string; // CPF ou CNPJ
}

// Função para gerar um código PIX usando configurações do sistema
export async function generatePixCode(options: PixOptions): Promise<string> {
  const { value, description, name, document } = options;
  
  // Obter configurações do sistema
  const config = await getPixConfig();
  
  // Gerar um código PIX seguindo o padrão EMV
  const merchantAccountInfo = '0014br.gov.bcb.pix';
  const merchantCategoryCode = '0000';
  const transactionCurrency = '986'; // BRL
  const countryCode = 'BR';
  const merchantName = (name || config.merchantName).substring(0, 25).toUpperCase();
  const merchantCity = config.merchantCity.substring(0, 15).toUpperCase();
  const merchantDocument = document || config.merchantDocument;
  const txid = uuidv4().replace(/-/g, '').substring(0, 25);
  
  // Construir o código PIX seguindo o padrão EMV
  let pixCode = '00020101'; // Payload Format Indicator
  pixCode += '0102'; // Point of Initiation Method
  
  // Merchant Account Information (26)
  const merchantInfo = `0014br.gov.bcb.pix0136${merchantDocument}`;
  pixCode += `26${merchantInfo.length.toString().padStart(2, '0')}${merchantInfo}`;
  
  pixCode += `52${merchantCategoryCode.length.toString().padStart(2, '0')}${merchantCategoryCode}`;
  pixCode += `53${transactionCurrency.length.toString().padStart(2, '0')}${transactionCurrency}`;
  
  if (value && value > 0) {
    const valueStr = value.toFixed(2);
    pixCode += `54${valueStr.length.toString().padStart(2, '0')}${valueStr}`;
  }
  
  pixCode += `58${countryCode.length.toString().padStart(2, '0')}${countryCode}`;
  pixCode += `59${merchantName.length.toString().padStart(2, '0')}${merchantName}`;
  pixCode += `60${merchantCity.length.toString().padStart(2, '0')}${merchantCity}`;
  
  // Adicionar informações adicionais
  const additionalInfo = `05${txid.length.toString().padStart(2, '0')}${txid}`;
  pixCode += `62${additionalInfo.length.toString().padStart(2, '0')}${additionalInfo}`;
  
  // Calcular CRC16 (simplificado)
  const crc = calculateCRC16(pixCode + '6304');
  pixCode += `63${crc}`;
  
  return pixCode;
}

// Função para calcular CRC16 simplificado
function calculateCRC16(data: string): string {
  // Implementação simplificada do CRC16
  // Em produção, use uma biblioteca adequada
  let crc = 0xFFFF;
  
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }
  
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Função para gerar um QR code PIX usando uma API externa
export function generatePixQrCode(pixCode: string): string {
  // Usar API do QR Server para gerar QR Code real
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`;
  return qrApiUrl;
}

// Função para simular o status de um pagamento PIX
export function checkPixPaymentStatus(pixCode: string): 'pending' | 'completed' | 'failed' {
  // Esta é uma função simulada - em um sistema real, você verificaria com a API do seu provedor de pagamentos
  // Para este exemplo, simulamos aleatoriamente o status
  const random = Math.random();
  
  if (random < 0.7) {
    return 'pending';
  } else if (random < 0.95) {
    return 'completed';
  } else {
    return 'failed';
  }
} 