import axios, { AxiosRequestConfig } from 'axios';
import qs from 'qs';
import crypto from 'crypto';
import { getPrimepagAccountConfig } from '@/lib/config';

// Configurações da API PrimePag
const BASE_URL = 'https://api.primepag.com.br';

// Types and Interfaces
interface PrimepagAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface QRCodeGenerateRequest {
  value_cents: number;
  generator_name?: string;
  generator_document?: string;
  expiration_time?: number;
  external_reference?: string;
  account?: 1 | 2; // Nova propriedade para especificar a conta
}

interface QRCodeResponse {
  qrcode: {
    reference_code: string;
    external_reference?: string;
    content: string;
    image_base64: string | null;
  };
}

interface QRCodeStatusResponse {
  status?: 'pending' | 'paid' | 'expired' | 'cancelled' | 'awaiting_payment' | 'completed';
  value_cents?: number;
  paid_at?: string;
  expires_at?: string;
  reference_code?: string;
  external_reference?: string;
  // Campos adicionais que podem estar presentes na resposta
  qrcode?: {
    reference_code: string;
    external_reference?: string;
    status?: 'pending' | 'paid' | 'expired' | 'cancelled' | 'awaiting_payment' | 'completed';
    value_cents?: number;
    paid_at?: string;
    expires_at?: string;
    created_at?: string;
    content?: string;
    image_base64?: string;
  };
  // Outros campos possíveis
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // Para campos não mapeados
}

interface PixPaymentRequest {
  initiation_type: 'dict' | 'manual';
  idempotent_id: string;
  receiver_name: string;
  receiver_document: string;
  value_cents: number;
  pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  pix_key?: string;
  receiver_bank_ispb?: string;
  receiver_agency?: string;
  receiver_account?: string;
  receiver_account_type?: 'CACC' | 'SVGS';
  authorized?: boolean;
  account?: 1 | 2;
}

interface PixPaymentResponse {
  id: string;
  status: 'authorization_pending' | 'sent' | 'completed' | 'failed' | 'cancelled';
  value_cents: number;
  receiver_name: string;
  receiver_document: string;
  pix_key?: string;
  pix_key_type?: string;
  created_at: string;
  updated_at?: string;
  end_to_end?: string;
  failure_reason?: string;
  authorization_url?: string;
}

class PrimepagService {
  private static instance: PrimepagService;
  private accessTokens: Map<number, { token: string; expiration: Date }> = new Map();

  private constructor() {}

  public static getInstance(): PrimepagService {
    if (!PrimepagService.instance) {
      PrimepagService.instance = new PrimepagService();
    }
    return PrimepagService.instance;
  }

  private async authenticate(accountNumber: 1 | 2 = 1): Promise<void> {
    try {
      console.log(`=== AUTENTICAÇÃO PRIMEPAG CONTA ${accountNumber} ===`);
      console.log(`Iniciando autenticação com Primepag - Conta ${accountNumber}...`);
      
      // Obter configurações da conta específica
      console.log('Obtendo configurações da conta...');
      const accountConfig = await getPrimepagAccountConfig(accountNumber);
      console.log('Configurações obtidas:', {
        hasClientId: !!accountConfig.clientId,
        hasClientSecret: !!accountConfig.clientSecret,
        enabled: accountConfig.enabled,
        name: accountConfig.name,
        clientIdLength: accountConfig.clientId?.length || 0,
        clientSecretLength: accountConfig.clientSecret?.length || 0
      });
      
      if (!accountConfig.enabled || !accountConfig.clientId || !accountConfig.clientSecret) {
        console.error(`Configurações da conta ${accountNumber} incompletas:`, accountConfig);
        throw new Error(`Conta ${accountNumber} da Primepag não está configurada ou habilitada`);
      }
      
      const requestConfig: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      const requestBody = {
        grant_type: 'client_credentials'
      };

      // Gerar Basic Auth com as credenciais da conta específica
      const credentials = Buffer.from(`${accountConfig.clientId}:${accountConfig.clientSecret}`).toString('base64');
      
      requestConfig.headers = {
        ...requestConfig.headers,
        'Authorization': `Basic ${credentials}`
      };

      console.log('Fazendo requisição de autenticação...');
      console.log('URL:', `${BASE_URL}/auth/generate_token`);
      console.log('Headers:', { ...requestConfig.headers, Authorization: 'Basic [HIDDEN]' });
      console.log('Body:', requestBody);

      const response = await axios.post<PrimepagAuthResponse>(
        `${BASE_URL}/auth/generate_token`,
        qs.stringify(requestBody),
        requestConfig
      );

      console.log('Resposta da autenticação:', {
        status: response.status,
        statusText: response.statusText,
        hasAccessToken: !!response.data?.access_token,
        tokenType: response.data?.token_type,
        expiresIn: response.data?.expires_in
      });

      if (!response.data.access_token) {
        console.error('Token de acesso não recebido. Resposta completa:', response.data);
        throw new Error('Token de acesso não recebido');
      }

      // Armazenar token para a conta específica
      this.accessTokens.set(accountNumber, {
        token: response.data.access_token,
        expiration: new Date(Date.now() + (response.data.expires_in * 1000))
      });
      
      console.log(`Autenticação realizada com sucesso - Conta ${accountNumber}`);
    } catch (error) {
      console.error(`=== ERRO NA AUTENTICAÇÃO CONTA ${accountNumber} ===`);
      console.error('Tipo do erro:', typeof error);
      console.error('Erro completo:', error);
      if (error instanceof Error) {
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
      }
      if (axios.isAxiosError(error)) {
        console.error('Axios Error Details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method
        });
      }
      throw new Error(`Falha na autenticação com Primepag - Conta ${accountNumber}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async ensureAuthenticated(accountNumber: 1 | 2 = 1): Promise<string> {
    const tokenData = this.accessTokens.get(accountNumber);
    
    if (!tokenData || tokenData.expiration < new Date()) {
      await this.authenticate(accountNumber);
      const newTokenData = this.accessTokens.get(accountNumber);
      if (!newTokenData) {
        throw new Error(`Falha ao obter token para conta ${accountNumber}`);
      }
      return newTokenData.token;
    }
    
    return tokenData.token;
  }

  public async generatePixQRCode(data: QRCodeGenerateRequest): Promise<QRCodeResponse> {
    try {
      const accountNumber = data.account || 1; // Usar conta 1 como padrão
      console.log(`=== GERANDO PIX QR CODE - CONTA ${accountNumber} ===`);
      console.log('Dados recebidos:', {
        value_cents: data.value_cents,
        generator_name: data.generator_name,
        generator_document: data.generator_document,
        expiration_time: data.expiration_time,
        external_reference: data.external_reference,
        account: accountNumber
      });

      console.log('Obtendo token de autenticação...');
      const token = await this.ensureAuthenticated(accountNumber);
      console.log('Token obtido com sucesso');

      const requestData = {
        value_cents: Math.round(data.value_cents),
        generator_name: data.generator_name || 'Cliente',
        generator_document: data.generator_document || '11144477735', // CPF válido como padrão
        expiration_time: data.expiration_time || 1800, // Default 30 minutes
        external_reference: data.external_reference
      };

      console.log('Fazendo requisição para gerar PIX...');
      console.log('URL:', `${BASE_URL}/v1/pix/qrcodes`);
      console.log('Request Data:', requestData);
      console.log('Headers:', { Authorization: 'Bearer [HIDDEN]', 'Content-Type': 'application/json' });

      const response = await axios.post<QRCodeResponse>(
        `${BASE_URL}/v1/pix/qrcodes`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Resposta da geração de PIX:', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        hasQrcode: !!response.data?.qrcode,
        hasContent: !!response.data?.qrcode?.content,
        hasImage: !!response.data?.qrcode?.image_base64,
        referenceCode: response.data?.qrcode?.reference_code
      });

      if (!response.data || !response.data.qrcode) {
        console.error('Resposta inválida da API PrimePag:', response.data);
        throw new Error('Resposta inválida da API PrimePag');
      }

      console.log('PIX gerado com sucesso!');
      return response.data;
    } catch (error) {
      console.error('=== ERRO AO GERAR PIX QR CODE ===');
      console.error('Tipo do erro:', typeof error);
      console.error('Erro completo:', error);
      if (error instanceof Error) {
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
      }
      if (axios.isAxiosError(error)) {
        console.error('Axios Error Details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method
        });
      }
      throw new Error(`Falha ao gerar QR Code PIX: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async getPixStatus(referenceCode: string, accountNumber: 1 | 2 = 1): Promise<QRCodeStatusResponse> {
    try {
      console.log(`=== CONSULTANDO STATUS PIX - CONTA ${accountNumber} ===`);
      console.log('Reference Code:', referenceCode);

      const token = await this.ensureAuthenticated(accountNumber);
      console.log('Token obtido com sucesso');

      const url = `${BASE_URL}/v1/pix/qrcodes/${referenceCode}`;
      console.log('URL da consulta:', url);

      const response = await axios.get<any>(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
      });

      console.log('Resposta da API PrimePag:', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data
      });

      // Verificar se a resposta tem a estrutura esperada
      if (!response.data) {
        console.error('Resposta vazia da API PrimePag');
        throw new Error('Resposta vazia da API PrimePag');
      }

      // Normalizar a resposta para o formato esperado
      let normalizedData: QRCodeStatusResponse;

      // Se a resposta tem um campo 'qrcode', extrair os dados de lá
      if (response.data.qrcode) {
        normalizedData = {
          reference_code: response.data.qrcode.reference_code,
          external_reference: response.data.qrcode.external_reference,
          status: response.data.qrcode.status || 'pending',
          value_cents: response.data.qrcode.value_cents,
          paid_at: response.data.qrcode.paid_at,
          expires_at: response.data.qrcode.expires_at,
          created_at: response.data.qrcode.created_at,
          qrcode: response.data.qrcode
        };
      } else {
        // Se os dados estão diretamente na resposta
        normalizedData = {
          reference_code: response.data.reference_code,
          external_reference: response.data.external_reference,
          status: response.data.status || 'pending',
          value_cents: response.data.value_cents,
          paid_at: response.data.paid_at,
          expires_at: response.data.expires_at,
          created_at: response.data.created_at,
          ...response.data
        };
      }

      console.log('Dados normalizados:', {
        reference_code: normalizedData.reference_code,
        status: normalizedData.status,
        value_cents: normalizedData.value_cents,
        external_reference: normalizedData.external_reference
      });

      return normalizedData;
    } catch (error) {
      console.error(`=== ERRO AO CONSULTAR STATUS PIX - CONTA ${accountNumber} ===`);
      console.error('Reference Code:', referenceCode);
      
      if (axios.isAxiosError(error)) {
        console.error('Detalhes do erro Axios:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          message: error.message
        });
        
        // Tratar diferentes tipos de erro HTTP
        if (error.response?.status === 404) {
          throw new Error(`PIX não encontrado na conta ${accountNumber} (404)`);
        } else if (error.response?.status === 401) {
          throw new Error(`Erro de autenticação na conta ${accountNumber} (401)`);
        } else if (error.response?.status === 403) {
          throw new Error(`Acesso negado na conta ${accountNumber} (403)`);
        } else if (error.response?.status && error.response.status >= 500) {
          throw new Error(`Erro interno do servidor PrimePag na conta ${accountNumber} (${error.response.status})`);
        } else {
          throw new Error(`Erro HTTP ${error.response?.status || 'desconhecido'} na conta ${accountNumber}: ${error.response?.statusText || 'erro desconhecido'}`);
        }
      } else if (error instanceof Error) {
        console.error('Erro não-HTTP:', error.message);
        throw new Error(`Erro ao consultar PIX na conta ${accountNumber}: ${error.message}`);
      } else {
        console.error('Erro desconhecido:', error);
        throw new Error(`Erro desconhecido ao consultar PIX na conta ${accountNumber}`);
      }
    }
  }

  public async listQRCodes(page: number = 1, limit: number = 10, accountNumber: 1 | 2 = 1): Promise<QRCodeStatusResponse[]> {
    try {
      const token = await this.ensureAuthenticated(accountNumber);

      const response = await axios.get<QRCodeStatusResponse[]>(
        `${BASE_URL}/v1/pix/qrcodes`,
        {
          params: {
            page,
            limit
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao listar QR Codes:', error);
      throw new Error('Falha ao listar QR Codes');
    }
  }

  // Método para recuperar saldo da conta
  async getAccountBalance(accountNumber: 1 | 2 = 1): Promise<any> {
    try {
      console.log(`=== CONSULTANDO SALDO CONTA ${accountNumber} ===`);
      
      const token = await this.ensureAuthenticated(accountNumber);
      
      const response = await axios.get(
        `${BASE_URL}/v1/account/balance`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Saldo consultado com sucesso - Conta ${accountNumber}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao consultar saldo - Conta ${accountNumber}:`, error);
      if (axios.isAxiosError(error)) {
        console.error('Detalhes do erro:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      throw new Error(`Erro ao consultar saldo da conta ${accountNumber}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async sendPixPayment(data: PixPaymentRequest): Promise<PixPaymentResponse> {
    try {
      const accountNumber = data.account || 1;
      console.log(`=== ENVIANDO PIX PAYMENT - CONTA ${accountNumber} ===`);
      console.log('Dados da transferência:', {
        initiation_type: data.initiation_type,
        idempotent_id: data.idempotent_id,
        receiver_name: data.receiver_name,
        receiver_document: data.receiver_document,
        value_cents: data.value_cents,
        pix_key_type: data.pix_key_type,
        pix_key: data.pix_key ? `${data.pix_key.substring(0, 5)}***` : undefined,
        authorized: data.authorized,
        account: accountNumber
      });

      const token = await this.ensureAuthenticated(accountNumber);
      
      // Preparar dados da requisição
      const requestData: any = {
        initiation_type: data.initiation_type,
        idempotent_id: data.idempotent_id,
        receiver_name: data.receiver_name,
        receiver_document: data.receiver_document,
        value_cents: Math.round(data.value_cents),
        authorized: data.authorized || false
      };

      // Adicionar campos específicos baseado no tipo de iniciação
      if (data.initiation_type === 'dict' && data.pix_key && data.pix_key_type) {
        requestData.pix_key_type = data.pix_key_type;
        requestData.pix_key = data.pix_key;
      } else if (data.initiation_type === 'manual') {
        requestData.receiver_bank_ispb = data.receiver_bank_ispb;
        requestData.receiver_agency = data.receiver_agency;
        requestData.receiver_account = data.receiver_account;
        requestData.receiver_account_type = data.receiver_account_type || 'CACC';
      }

      console.log('Enviando requisição para PrimePag...');
      console.log('URL:', `${BASE_URL}/v1/pix/payments`);
      console.log('Dados da requisição:', {
        ...requestData,
        pix_key: requestData.pix_key ? `${requestData.pix_key.substring(0, 5)}***` : undefined
      });

      const response = await axios.post<PixPaymentResponse>(
        `${BASE_URL}/v1/pix/payments`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ PIX enviado com sucesso:', {
        id: response.data.id,
        status: response.data.status,
        value_cents: response.data.value_cents,
        receiver_name: response.data.receiver_name,
        created_at: response.data.created_at
      });

      return response.data;
    } catch (error) {
      const accountNumber = data.account || 1;
      console.error(`❌ Erro ao enviar PIX - Conta ${accountNumber}:`, error);
      if (axios.isAxiosError(error)) {
        console.error('Detalhes do erro:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
        
        // Tratar erros específicos da API
        if (error.response?.status === 400) {
          const errorData = error.response.data;
          throw new Error(`Dados inválidos: ${errorData.message || JSON.stringify(errorData)}`);
        } else if (error.response?.status === 401) {
          throw new Error('Não autorizado - verifique as credenciais da API');
        } else if (error.response?.status === 403) {
          throw new Error('Acesso negado - conta sem permissão para enviar PIX');
        } else if (error.response?.status === 422) {
          const errorData = error.response.data;
          throw new Error(`Erro de validação: ${errorData.message || JSON.stringify(errorData)}`);
        }
      }
      throw new Error(`Erro ao enviar PIX: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async getPixPaymentStatus(paymentId: string, accountNumber: 1 | 2 = 1): Promise<PixPaymentResponse> {
    try {
      console.log(`=== CONSULTANDO STATUS PIX PAYMENT - CONTA ${accountNumber} ===`);
      console.log('Payment ID:', paymentId);

      const token = await this.ensureAuthenticated(accountNumber);
      
      const response = await axios.get<PixPaymentResponse>(
        `${BASE_URL}/v1/pix/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Status consultado com sucesso:', {
        id: response.data.id,
        status: response.data.status,
        value_cents: response.data.value_cents,
        updated_at: response.data.updated_at
      });

      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao consultar status PIX payment - Conta ${accountNumber}:`, error);
      if (axios.isAxiosError(error)) {
        console.error('Detalhes do erro:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      throw new Error(`Erro ao consultar status do PIX payment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const primepagService = PrimepagService.getInstance(); 