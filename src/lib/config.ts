import crypto from 'crypto';
import { connectToDatabase } from './db';
import { SystemConfig } from './models';

// Chave de criptografia para dados sensíveis (em produção, use uma variável de ambiente)
const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY || 'your-32-char-secret-key-here-123';
const ALGORITHM = 'aes-256-cbc';

// Função para criptografar dados sensíveis
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Função para descriptografar dados sensíveis
function decrypt(text: string): string {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = textParts.join(':');
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    return text; // Retorna o texto original se não conseguir descriptografar
  }
}

// Configurações padrão do sistema
export const DEFAULT_CONFIGS = {
  // Configurações de PIX
  'pix.provider': {
    value: 'local',
    description: 'Provedor de PIX (local, mercadopago, pagseguro, etc.)',
    isEncrypted: false
  },
  'pix.merchant_name': {
    value: 'T0P1 PAGAMENTOS',
    description: 'Nome do comerciante para PIX',
    isEncrypted: false
  },
  'pix.merchant_document': {
    value: '12345678901',
    description: 'CPF/CNPJ do comerciante',
    isEncrypted: false
  },
  'pix.merchant_city': {
    value: 'SAO PAULO',
    description: 'Cidade do comerciante',
    isEncrypted: false
  },
  
  // Configurações de API (Mercado Pago, PagSeguro, etc.)
  'api.mercadopago.client_id': {
    value: '',
    description: 'Client ID do Mercado Pago',
    isEncrypted: true
  },
  'api.mercadopago.client_secret': {
    value: '',
    description: 'Client Secret do Mercado Pago',
    isEncrypted: true
  },
  'api.mercadopago.access_token': {
    value: '',
    description: 'Access Token do Mercado Pago',
    isEncrypted: true
  },
  'api.pagseguro.email': {
    value: '',
    description: 'Email do PagSeguro',
    isEncrypted: true
  },
  'api.pagseguro.token': {
    value: '',
    description: 'Token do PagSeguro',
    isEncrypted: true
  },
  
  // Configurações gerais
  'system.commission_rate': {
    value: '0.20',
    description: 'Taxa de comissão da plataforma (0.20 = 20%)',
    isEncrypted: false
  },
  'system.max_pix_amount': {
    value: '1199.99',
    description: 'Valor máximo para PIX',
    isEncrypted: false
  },
  'system.min_pix_amount': {
    value: '1.00',
    description: 'Valor mínimo para PIX',
    isEncrypted: false
  }
};

// Função para obter uma configuração
export async function getConfig(key: string): Promise<string | null> {
  try {
    await connectToDatabase();
    
    const config = await SystemConfig.findOne({ key });
    
    if (!config) {
      // Se não existe, criar com valor padrão se disponível
      const defaultConfig = DEFAULT_CONFIGS[key as keyof typeof DEFAULT_CONFIGS];
      if (defaultConfig) {
        return defaultConfig.value;
      }
      return null;
    }
    
    // Descriptografar se necessário
    if (config.isEncrypted) {
      return decrypt(config.value);
    }
    
    return config.value;
  } catch (error) {
    console.error('Erro ao obter configuração:', error);
    return null;
  }
}

// Função para definir uma configuração
export async function setConfig(key: string, value: string, userId: string, description?: string): Promise<boolean> {
  try {
    await connectToDatabase();
    
    const defaultConfig = DEFAULT_CONFIGS[key as keyof typeof DEFAULT_CONFIGS];
    const isEncrypted = defaultConfig?.isEncrypted || false;
    
    // Criptografar se necessário
    const finalValue = isEncrypted ? encrypt(value) : value;
    const finalDescription = description || defaultConfig?.description || '';
    
    await SystemConfig.findOneAndUpdate(
      { key },
      {
        value: finalValue,
        description: finalDescription,
        isEncrypted,
        updatedBy: userId,
        updatedAt: new Date()
      },
      { 
        upsert: true,
        new: true
      }
    );
    
    return true;
  } catch (error) {
    console.error('Erro ao definir configuração:', error);
    return false;
  }
}

// Função para obter todas as configurações (para o painel admin)
export async function getAllConfigs(): Promise<Array<{
  key: string;
  value: string;
  description: string;
  isEncrypted: boolean;
  updatedAt: Date;
}>> {
  try {
    await connectToDatabase();
    
    const configs = await SystemConfig.find({}).sort({ key: 1 });
    
    return configs.map(config => ({
      key: config.key,
      value: config.isEncrypted ? '***ENCRYPTED***' : config.value,
      description: config.description || '',
      isEncrypted: config.isEncrypted,
      updatedAt: config.updatedAt
    }));
  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    return [];
  }
}

// Função para inicializar configurações padrão
export async function initializeDefaultConfigs(userId: string): Promise<void> {
  try {
    await connectToDatabase();
    
    for (const [key, config] of Object.entries(DEFAULT_CONFIGS)) {
      const existing = await SystemConfig.findOne({ key });
      
      if (!existing) {
        await setConfig(key, config.value, userId, config.description);
      }
    }
  } catch (error) {
    console.error('Erro ao inicializar configurações padrão:', error);
  }
}

// Função para obter configurações de PIX
export async function getPixConfig() {
  return {
    provider: await getConfig('pix.provider') || 'local',
    merchantName: await getConfig('pix.merchant_name') || 'T0P1 PAGAMENTOS',
    merchantDocument: await getConfig('pix.merchant_document') || '12345678901',
    merchantCity: await getConfig('pix.merchant_city') || 'SAO PAULO',
    commissionRate: parseFloat(await getConfig('system.commission_rate') || '0.20'),
    maxAmount: parseFloat(await getConfig('system.max_pix_amount') || '1199.99'),
    minAmount: parseFloat(await getConfig('system.min_pix_amount') || '1.00')
  };
}

// Função para obter configurações de API
export async function getApiConfig(provider: string) {
  switch (provider) {
    case 'mercadopago':
      return {
        clientId: await getConfig('api.mercadopago.client_id'),
        clientSecret: await getConfig('api.mercadopago.client_secret'),
        accessToken: await getConfig('api.mercadopago.access_token')
      };
    case 'pagseguro':
      return {
        email: await getConfig('api.pagseguro.email'),
        token: await getConfig('api.pagseguro.token')
      };
    default:
      return {};
  }
}

// Função para validar se as configurações de PIX estão completas
export async function validatePixConfig(): Promise<{ valid: boolean; missing: string[] }> {
  const config = await getPixConfig();
  const missing: string[] = [];

  if (!config.merchantName || config.merchantName.trim() === '') {
    missing.push('Nome do comerciante');
  }

  if (!config.merchantDocument || config.merchantDocument.trim() === '') {
    missing.push('CPF/CNPJ do comerciante');
  }

  if (!config.merchantCity || config.merchantCity.trim() === '') {
    missing.push('Cidade do comerciante');
  }

  // Se o provedor não for 'local', verificar se as API keys estão configuradas
  if (config.provider !== 'local') {
    const apiConfig = await getApiConfig(config.provider);
    
    switch (config.provider) {
      case 'mercadopago':
        if (!apiConfig.accessToken) {
          missing.push('Access Token do Mercado Pago');
        }
        break;
      case 'pagseguro':
        if (!apiConfig.email || !apiConfig.token) {
          missing.push('Email e Token do PagSeguro');
        }
        break;
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
} 