import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';

interface MetaMaskState {
  isConnected: boolean;
  account: string | null;
  chainId: number | null;
  balance: string;
  isInstalled: boolean;
}

interface NetworkConfig {
  chainId: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  blockExplorer: string;
}

// Configurações das redes suportadas
const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
  1: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://etherscan.io'
  },
  56: {
    chainId: 56,
    name: 'BSC Mainnet',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    blockExplorer: 'https://bscscan.com'
  },
  137: {
    chainId: 137,
    name: 'Polygon Mainnet',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com/',
    blockExplorer: 'https://polygonscan.com'
  },
  195: {
    chainId: 195,
    name: 'Tron Mainnet',
    symbol: 'TRX',
    rpcUrl: 'https://api.trongrid.io',
    blockExplorer: 'https://tronscan.org'
  }
};

// Endereços dos contratos de depósito (substitua pelos seus)
const DEPOSIT_ADDRESSES = {
  ETH: '0x742d35Cc6635C0532925a3b8D400d5bb1e6A9A30', // Seu endereço ETH
  BNB: '0x742d35Cc6635C0532925a3b8D400d5bb1e6A9A30', // Seu endereço BNB
  MATIC: '0x742d35Cc6635C0532925a3b8D400d5bb1e6A9A30', // Seu endereço MATIC
  USDT: {
    ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT no Ethereum
    bsc: '0x55d398326f99059fF775485246999027B3197955', // USDT na BSC
    polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' // USDT no Polygon
  }
};

export const useMetaMask = () => {
  const [state, setState] = useState<MetaMaskState>({
    isConnected: false,
    account: null,
    chainId: null,
    balance: '0',
    isInstalled: false
  });

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  // Verificar se MetaMask está instalado
  useEffect(() => {
    const checkMetaMask = () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        setState(prev => ({ ...prev, isInstalled: true }));
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
        
        // Verificar se já está conectado
        checkConnection();
      } else {
        setState(prev => ({ ...prev, isInstalled: false }));
      }
    };

    checkMetaMask();
  }, []);

  // Verificar conexão existente
  const checkConnection = async () => {
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        await updateState(accounts[0], parseInt(chainId, 16));
      }
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
    }
  };

  // Atualizar estado
  const updateState = async (account: string, chainId: number) => {
    if (!provider) return;

    try {
      const balance = await provider.getBalance(account);
      const balanceInEth = ethers.formatEther(balance);

      setState({
        isConnected: true,
        account,
        chainId,
        balance: balanceInEth,
        isInstalled: true
      });
    } catch (error) {
      console.error('Erro ao atualizar estado:', error);
    }
  };

  // Conectar MetaMask
  const connect = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask não detectado! Instale a extensão.');
      window.open('https://metamask.io/download/', '_blank');
      return false;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        await updateState(accounts[0], parseInt(chainId, 16));
        toast.success('🦊 MetaMask conectado com sucesso!');
        return true;
      }
    } catch (error: any) {
      if (error.code === 4001) {
        toast.error('Conexão rejeitada pelo usuário');
      } else {
        toast.error('Erro ao conectar MetaMask');
      }
      console.error('Erro de conexão:', error);
    }
    return false;
  };

  // Desconectar
  const disconnect = () => {
    setState({
      isConnected: false,
      account: null,
      chainId: null,
      balance: '0',
      isInstalled: state.isInstalled
    });
    toast.success('MetaMask desconectado');
  };

  // Trocar rede
  const switchNetwork = async (targetChainId: number) => {
    if (!window.ethereum || !SUPPORTED_NETWORKS[targetChainId]) return false;

    const network = SUPPORTED_NETWORKS[targetChainId];
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      });
      return true;
    } catch (error: any) {
      // Se a rede não existe, tentar adicioná-la
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: network.name,
              nativeCurrency: {
                name: network.symbol,
                symbol: network.symbol,
                decimals: 18
              },
              rpcUrls: [network.rpcUrl],
              blockExplorerUrls: [network.blockExplorer]
            }]
          });
          return true;
        } catch (addError) {
          console.error('Erro ao adicionar rede:', addError);
          return false;
        }
      }
      console.error('Erro ao trocar rede:', error);
      return false;
    }
  };

  // Enviar transação nativa (ETH, BNB, etc.)
  const sendNativeTransaction = async (amount: string, targetNetwork: number) => {
    if (!provider || !state.account) {
      toast.error('MetaMask não conectado');
      return null;
    }

    // Verificar/trocar rede
    if (state.chainId !== targetNetwork) {
      const switched = await switchNetwork(targetNetwork);
      if (!switched) {
        toast.error('Erro ao trocar para a rede correta');
        return null;
      }
    }

    try {
      const signer = await provider.getSigner();
      const network = SUPPORTED_NETWORKS[targetNetwork];
      
      // Endereço de depósito baseado na rede
      let toAddress = '';
      switch (targetNetwork) {
        case 1: toAddress = DEPOSIT_ADDRESSES.ETH; break;
        case 56: toAddress = DEPOSIT_ADDRESSES.BNB; break;
        case 137: toAddress = DEPOSIT_ADDRESSES.MATIC; break;
        default: 
          toast.error('Rede não suportada');
          return null;
      }

      const tx = await signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount),
        gasLimit: 21000
      });

      toast.success(`🚀 Transação enviada! Hash: ${tx.hash.substring(0, 10)}...`);
      
      // Aguardar confirmação
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        toast.success('✅ Transação confirmada!');
        return {
          hash: tx.hash,
          from: state.account,
          to: toAddress,
          amount: amount,
          network: network.name,
          blockExplorer: `${network.blockExplorer}/tx/${tx.hash}`
        };
      } else {
        toast.error('❌ Transação falhou');
        return null;
      }
    } catch (error: any) {
      console.error('Erro na transação:', error);
      
      if (error.code === 4001) {
        toast.error('Transação cancelada pelo usuário');
      } else if (error.code === -32603) {
        toast.error('Saldo insuficiente para gas');
      } else {
        toast.error('Erro ao enviar transação');
      }
      return null;
    }
  };

  // Verificar saldo de token específico
  const getTokenBalance = async (tokenAddress: string) => {
    if (!provider || !state.account) return '0';

    try {
      // ABI mínimo para ERC-20
      const tokenABI = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)'
      ];

      const contract = new ethers.Contract(tokenAddress, tokenABI, provider);
      const balance = await contract.balanceOf(state.account);
      const decimals = await contract.decimals();
      
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Erro ao buscar saldo do token:', error);
      return '0';
    }
  };

  // Listeners para mudanças de conta/rede
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== state.account) {
        updateState(accounts[0], state.chainId || 1);
      }
    };

    const handleChainChanged = (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      if (state.account) {
        updateState(state.account, newChainId);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [state.account, state.chainId]);

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    sendNativeTransaction,
    getTokenBalance,
    supportedNetworks: SUPPORTED_NETWORKS,
    provider
  };
}; 