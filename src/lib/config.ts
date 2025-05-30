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
  // Configurações PrimePag - Conta 1
  'primepag.account1.client_id': {
    value: '95bba334-20f7-40b3-8ce3-82b14cb1ebcb',
    description: 'Client ID da PrimePag - Conta 1',
    isEncrypted: true
  },
  'primepag.account1.client_secret': {
    value: 'f28c7937-f850-4222-be6f-8a032cb42d81',
    description: 'Client Secret da PrimePag - Conta 1',
    isEncrypted: true
  },
  'primepag.account1.enabled': {
    value: 'true',
    description: 'Habilitar PrimePag Conta 1',
    isEncrypted: false
  },
  'primepag.account1.name': {
    value: 'Conta Principal',
    description: 'Nome de exibição da Conta 1',
    isEncrypted: false
  },
  
  // Configurações PrimePag - Conta 2
  'primepag.account2.client_id': {
    value: '07a09473-621f-4587-bb73-0fbf3de4a457',
    description: 'Client ID da PrimePag - Conta 2',
    isEncrypted: true
  },
  'primepag.account2.client_secret': {
    value: 'f84dd33f-09ee-4111-a84d-d10ef408ad96',
    description: 'Client Secret da PrimePag - Conta 2',
    isEncrypted: true
  },
  'primepag.account2.enabled': {
    value: 'true',
    description: 'Habilitar PrimePag Conta 2',
    isEncrypted: false
  },
  'primepag.account2.name': {
    value: 'Conta Secundária',
    description: 'Nome de exibição da Conta 2',
    isEncrypted: false
  },
  
  // Configurações PrimePag - Legado (manter compatibilidade)
  'primepag.client_id': {
    value: '95bba334-20f7-40b3-8ce3-82b14cb1ebcb',
    description: 'Client ID da PrimePag (Legado)',
    isEncrypted: true
  },
  'primepag.client_secret': {
    value: 'f28c7937-f850-4222-be6f-8a032cb42d81',
    description: 'Client Secret da PrimePag (Legado)',
    isEncrypted: true
  },
  'primepag.enabled': {
    value: 'true',
    description: 'Habilitar PrimePag como método de pagamento',
    isEncrypted: false
  },
  
  // Configurações para outros provedores (para futuro)
  'mercadopago.client_id': {
    value: '',
    description: 'Client ID do Mercado Pago',
    isEncrypted: true
  },
  'mercadopago.client_secret': {
    value: '',
    description: 'Client Secret do Mercado Pago',
    isEncrypted: true
  },
  'mercadopago.enabled': {
    value: 'false',
    description: 'Habilitar Mercado Pago como método de pagamento',
    isEncrypted: false
  },
  
  'pagseguro.client_id': {
    value: '',
    description: 'Client ID do PagSeguro',
    isEncrypted: true
  },
  'pagseguro.client_secret': {
    value: '',
    description: 'Client Secret do PagSeguro',
    isEncrypted: true
  },
  'pagseguro.enabled': {
    value: 'false',
    description: 'Habilitar PagSeguro como método de pagamento',
    isEncrypted: false
  },
  
  // Configurações gerais do sistema
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
  },
  'system.support_telegram': {
    value: 'https://t.me/watchingdaysbecomeyears',
    description: 'Link do canal de suporte no Telegram',
    isEncrypted: false
  },
  'system.announcement': {
    value: 'Bem-vindo ao painel PIX! Para suporte, entre em nosso canal do Telegram.',
    description: 'Mensagem de anúncio exibida no dashboard',
    isEncrypted: false
  },
  'system.maintenance_mode': {
    value: 'false',
    description: 'Ativar modo manutenção (true/false)',
    isEncrypted: false
  },
  'system.maintenance_message': {
    value: 'Sistema em manutenção. Voltaremos em breve com melhorias!',
    description: 'Mensagem exibida durante a manutenção',
    isEncrypted: false
  },
  'system.maintenance_estimated_time': {
    value: '',
    description: 'Tempo estimado para conclusão da manutenção',
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
    const configMap = new Map(configs.map(config => [config.key, config]));
    
    const result = [];
    
    // Adicionar todas as configurações padrão
    for (const [key, defaultConfig] of Object.entries(DEFAULT_CONFIGS)) {
      const existingConfig = configMap.get(key);
      
      if (existingConfig) {
        result.push({
          key: existingConfig.key,
          value: existingConfig.isEncrypted ? '***ENCRYPTED***' : existingConfig.value,
          description: existingConfig.description || '',
          isEncrypted: existingConfig.isEncrypted,
          updatedAt: existingConfig.updatedAt
        });
      } else {
        // Usar configuração padrão se não existir no banco
        result.push({
          key,
          value: defaultConfig.isEncrypted ? '***ENCRYPTED***' : defaultConfig.value,
          description: defaultConfig.description,
          isEncrypted: defaultConfig.isEncrypted,
          updatedAt: new Date()
        });
      }
    }
    
    return result.sort((a, b) => a.key.localeCompare(b.key));
  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    // Retornar configurações padrão em caso de erro
    return Object.entries(DEFAULT_CONFIGS).map(([key, config]) => ({
      key,
      value: config.isEncrypted ? '***ENCRYPTED***' : config.value,
      description: config.description,
      isEncrypted: config.isEncrypted,
      updatedAt: new Date()
    }));
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
    provider: 'local',
    merchantName: 'T0P1 PAGAMENTOS',
    merchantDocument: '12345678901',
    merchantCity: 'SAO PAULO',
    commissionRate: parseFloat(await getConfig('system.commission_rate') || '0.20'),
    maxAmount: parseFloat(await getConfig('system.max_pix_amount') || '1199.99'),
    minAmount: parseFloat(await getConfig('system.min_pix_amount') || '1.00')
  };
}

// Função para obter configurações de API de pagamento (legado)
export async function getPaymentConfig() {
  return {
    clientId: await getConfig('primepag.client_id'),
    clientSecret: await getConfig('primepag.client_secret')
  };
}

// Função para obter configurações de uma conta específica da Primepag
export async function getPrimepagAccountConfig(accountNumber: 1 | 2) {
  const accountKey = `primepag.account${accountNumber}`;
  return {
    clientId: await getConfig(`${accountKey}.client_id`),
    clientSecret: await getConfig(`${accountKey}.client_secret`),
    enabled: (await getConfig(`${accountKey}.enabled`)) === 'true',
    name: await getConfig(`${accountKey}.name`) || `Conta ${accountNumber}`
  };
}

// Função para obter todas as contas da Primepag disponíveis
export async function getPrimepagAccounts() {
  const accounts = [];
  
  for (let i = 1; i <= 2; i++) {
    const config = await getPrimepagAccountConfig(i as 1 | 2);
    if (config.enabled && config.clientId && config.clientSecret) {
      accounts.push({
        id: i,
        name: config.name,
        clientId: config.clientId,
        clientSecret: config.clientSecret
      });
    }
  }
  
  return accounts;
}

// Função para obter configurações de um provedor específico
export async function getProviderConfig(provider: string) {
  return {
    clientId: await getConfig(`${provider}.client_id`),
    clientSecret: await getConfig(`${provider}.client_secret`),
    enabled: (await getConfig(`${provider}.enabled`)) === 'true'
  };
}

// Função para obter todos os provedores de pagamento disponíveis
export async function getPaymentProviders() {
  const providers = ['primepag', 'mercadopago', 'pagseguro'];
  const result = [];
  
  for (const provider of providers) {
    const config = await getProviderConfig(provider);
    result.push({
      name: provider,
      displayName: getProviderDisplayName(provider),
      ...config
    });
  }
  
  return result;
}

// Função para obter nome de exibição do provedor
function getProviderDisplayName(provider: string): string {
  const names: { [key: string]: string } = {
    'primepag': 'PrimePag',
    'mercadopago': 'Mercado Pago',
    'pagseguro': 'PagSeguro'
  };
  return names[provider] || provider;
}

// Função para obter configurações do sistema
export async function getSystemConfig() {
  return {
    supportTelegram: await getConfig('system.support_telegram') || 'https://t.me/watchingdaysbecomeyears',
    announcement: await getConfig('system.announcement') || 'Bem-vindo ao painel PIX! Para suporte, entre em nosso canal do Telegram.',
    commissionRate: parseFloat(await getConfig('system.commission_rate') || '0.20'),
    maxAmount: parseFloat(await getConfig('system.max_pix_amount') || '1199.99'),
    minAmount: parseFloat(await getConfig('system.min_pix_amount') || '1.00')
  };
}

// Função para verificar se o sistema está em modo manutenção
export async function isMaintenanceMode(): Promise<boolean> {
  const maintenanceMode = await getConfig('system.maintenance_mode');
  return maintenanceMode === 'true';
}

// Função para obter informações do modo manutenção
export async function getMaintenanceInfo() {
  return {
    isActive: await isMaintenanceMode(),
    message: await getConfig('system.maintenance_message') || 'Sistema em manutenção. Voltaremos em breve com melhorias!',
    estimatedTime: await getConfig('system.maintenance_estimated_time') || ''
  };
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

  // Verificar se as configurações de pagamento estão definidas
  const paymentConfig = await getPaymentConfig();
  if (!paymentConfig.clientId || !paymentConfig.clientSecret) {
    missing.push('Client ID e Client Secret da API de Pagamento');
  }

  return {
    valid: missing.length === 0,
    missing
  };
} 