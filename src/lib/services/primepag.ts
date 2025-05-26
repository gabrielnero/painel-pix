import axios, { AxiosRequestConfig } from 'axios';
import qs from 'qs';
import crypto from 'crypto';

// Configurações da API PrimePag - USAR VARIÁVEIS DE AMBIENTE EM PRODUÇÃO
const BASE_URL = 'https://api.primepag.com.br';
const CLIENT_ID = process.env.PRIMEPAG_CLIENT_ID || '9a692e2a-205e-4880-b49b-aa862096bbeb';
const CLIENT_SECRET = process.env.PRIMEPAG_CLIENT_SECRET || 'b2c2a2b5-96ac-4c14-83fb-f3474501a84f';

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
  status?: 'pending' | 'paid' | 'expired' | 'cancelled';
  value_cents?: number;
  paid_at?: string;
  expires_at?: string;
  reference_code?: string;
  external_reference?: string;
  // Campos adicionais que podem estar presentes na resposta
  qrcode?: {
    reference_code: string;
    external_reference?: string;
    status?: 'pending' | 'paid' | 'expired' | 'cancelled';
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

class PrimepagService {
  private static instance: PrimepagService;
  private accessToken: string | null = null;
  private tokenExpiration: Date | null = null;

  private constructor() {}

  public static getInstance(): PrimepagService {
    if (!PrimepagService.instance) {
      PrimepagService.instance = new PrimepagService();
    }
    return PrimepagService.instance;
  }

  private async authenticate(): Promise<void> {
    try {
      console.log('Iniciando autenticação com Primepag...');
      
      const requestConfig: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      const requestBody = {
        grant_type: 'client_credentials'
      };

      // Use the exact Basic Auth provided by the user
      const providedBasicAuth = 'OWE2OTJlMmEtMjA1ZS00ODgwLWI0OWItYWE4NjIwOTZiYmViOmIyYzJhMmI1LTk2YWMtNGMxNC04M2ZiLWYzNDc0NTAxYTg0Zg==';
      
      requestConfig.headers = {
        ...requestConfig.headers,
        'Authorization': `Basic ${providedBasicAuth}`
      };

      const response = await axios.post<PrimepagAuthResponse>(
        `${BASE_URL}/auth/generate_token`,
        qs.stringify(requestBody),
        requestConfig
      );

      if (!response.data.access_token) {
        throw new Error('Token de acesso não recebido');
      }

      this.accessToken = response.data.access_token;
      this.tokenExpiration = new Date(Date.now() + (response.data.expires_in * 1000));
      
      console.log('Autenticação realizada com sucesso');
    } catch (error) {
      console.error('Erro ao autenticar com Primepag:', error);
      throw new Error('Falha na autenticação com Primepag');
    }
  }

  private async ensureAuthenticated(): Promise<string> {
    if (!this.accessToken || !this.tokenExpiration || this.tokenExpiration < new Date()) {
      await this.authenticate();
    }
    return this.accessToken!;
  }

  public async generatePixQRCode(data: QRCodeGenerateRequest): Promise<QRCodeResponse> {
    try {
      const token = await this.ensureAuthenticated();

      const response = await axios.post<QRCodeResponse>(
        `${BASE_URL}/v1/pix/qrcodes`,
        {
          value_cents: Math.round(data.value_cents),
          generator_name: data.generator_name,
          generator_document: data.generator_document,
          expiration_time: data.expiration_time || 1800, // Default 30 minutes
          external_reference: data.external_reference
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao gerar QR Code PIX:', error);
      throw new Error('Falha ao gerar QR Code PIX');
    }
  }

  public async getPixStatus(referenceCode: string): Promise<QRCodeStatusResponse> {
    try {
      const token = await this.ensureAuthenticated();

      console.log('Consultando status PIX para referenceCode:', referenceCode);

      const response = await axios.get<any>(
        `${BASE_URL}/v1/pix/qrcodes/${referenceCode}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Resposta completa da API PrimePag:', {
        status: response.status,
        headers: response.headers,
        data: response.data
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

      console.log('Dados normalizados:', normalizedData);

      return normalizedData;
    } catch (error) {
      console.error('Erro ao consultar status do PIX:', error);
      if (axios.isAxiosError(error)) {
        console.error('Detalhes do erro Axios:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
      }
      throw new Error('Falha ao consultar status do PIX');
    }
  }

  public async listQRCodes(page: number = 1, limit: number = 10): Promise<QRCodeStatusResponse[]> {
    try {
      const token = await this.ensureAuthenticated();

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
}

export const primepagService = PrimepagService.getInstance(); 