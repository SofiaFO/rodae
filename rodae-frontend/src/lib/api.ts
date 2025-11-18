const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
  // Auth
  async login(email: string, senha: string) {
    console.log('Login attempt:', { email, apiUrl: API_URL });
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Resposta não é JSON:', text);
        throw new Error('Servidor retornou uma resposta inválida. Verifique se o backend está rodando na porta 3000.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer login');
      }

      return data;
    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:3000');
      }
      throw error;
    }
  },

  async register(userData: {
    tipo: 'PASSAGEIRO' | 'MOTORISTA';
    nome: string;
    email: string;
    telefone: string;
    senha: string;
    cnh?: string;
    validadeCNH?: string;
    docVeiculo?: string;
    placaVeiculo?: string;
    modeloCorVeiculo?: string;
  }) {
    console.log('Registering user:', { tipo: userData.tipo, email: userData.email, apiUrl: API_URL });
    console.log('Full URL:', `${API_URL}/auth/register`);
    
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        mode: 'cors',
        credentials: 'include',
      });

      console.log('Response status:', response.status);
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Resposta não é JSON:', text);
        throw new Error('Servidor retornou uma resposta inválida. Verifique se o backend está rodando corretamente.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao registrar');
      }

      return data;
    } catch (error) {
      console.error('Error during register:', error);
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:3000');
      }
      throw error;
    }
  },

  async getMe(token: string) {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar dados do usuário');
    }

    return data;
  },

  async updateProfile(token: string, userType: string, userId: number, userData) {
    let endpoint = '';
    let id = userId;
    
    // Determinar o endpoint correto baseado no tipo de usuário
    if (userType === 'PASSAGEIRO') {
      // Para passageiro, buscar o ID do passageiro
      const passageirosResponse = await fetch(`${API_URL}/passageiros`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const passageirosData = await passageirosResponse.json();
      const passageiro = passageirosData.data.find((p) => p.usuario.id === userId);
      if (passageiro) {
        id = passageiro.id;
      }
      endpoint = `${API_URL}/passageiros/${id}`;
    } else if (userType === 'MOTORISTA') {
      // Para motorista, buscar o ID do motorista
      const motoristasResponse = await fetch(`${API_URL}/motoristas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const motoristasData = await motoristasResponse.json();
      const motorista = motoristasData.data.find((m) => m.id === userId);
      if (motorista && motorista.motorista) {
        id = motorista.motorista.id;
      }
      endpoint = `${API_URL}/motoristas/${id}`;
    } else {
      // Para admin ou outros, usar a rota de usuários
      endpoint = `${API_URL}/usuarios/${userId}`;
    }

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao atualizar perfil');
    }

    return data;
  },

  async deleteAccount(token: string, userId: number) {
    const response = await fetch(`${API_URL}/usuarios/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao excluir conta');
    }

    return data;
  },

  // Passageiros
  async getAllPassageiros(token: string) {
    const response = await fetch(`${API_URL}/passageiros`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar passageiros');
    }

    return data;
  },

  async deletePassageiro(token: string, id: number) {
    const response = await fetch(`${API_URL}/passageiros/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao excluir passageiro');
    }

    return data;
  },

  // Motoristas (Admin)
  async getAllMotoristas(token: string, status?: string) {
    const url = status 
      ? `${API_URL}/admin/motoristas?status=${status}`
      : `${API_URL}/admin/motoristas`;
      
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar motoristas');
    }

    return data;
  },

  async getMotoristaPendentes(token: string) {
    const response = await fetch(`${API_URL}/admin/motoristas?status=PENDENTE`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar motoristas pendentes');
    }

    return data;
  },

  async getMotoristaById(token: string, id: number) {
    const response = await fetch(`${API_URL}/admin/motoristas/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar motorista');
    }

    return data;
  },

  async aprovarMotorista(token: string, id: number) {
    const response = await fetch(`${API_URL}/admin/motoristas/${id}/aprovar`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao aprovar motorista');
    }

    return data;
  },

  async rejeitarMotorista(token: string, id: number) {
    const response = await fetch(`${API_URL}/admin/motoristas/${id}/rejeitar`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao rejeitar motorista');
    }

    return data;
  },

  async getEstatisticas(token: string) {
    const response = await fetch(`${API_URL}/admin/estatisticas`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar estatísticas');
    }

    return data;
  },

  async deleteMotorista(token: string, id: number) {
    const response = await fetch(`${API_URL}/motoristas/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao excluir motorista');
    }

    return data;
  },

  async deleteUsuario(token: string, id: number) {
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao excluir usuário');
    }

    return data;
  },

  // Corridas
  async createCorrida(token: string, corridaData: {
    origem: string;
    destino: string;
    formaPagamento: 'PIX' | 'CARTAO_CREDITO' | 'CARTEIRA_DIGITAL';
    opcaoCorrida: 'PADRAO' | 'PREMIUM' | 'COMPARTILHADA';
    origemLat?: number;
    origemLng?: number;
    destinoLat?: number;
    destinoLng?: number;
  }) {
    const response = await fetch(`${API_URL}/corridas`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(corridaData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao solicitar corrida');
    }

    return data;
  },

  async getCorridas(token: string, filters?: {
    status?: 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';
    dataInicio?: string;
    dataFim?: string;
    passageiroId?: number;
    motoristaId?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.dataInicio) queryParams.append('dataInicio', filters.dataInicio);
    if (filters?.dataFim) queryParams.append('dataFim', filters.dataFim);
    if (filters?.passageiroId) queryParams.append('passageiroId', filters.passageiroId.toString());
    if (filters?.motoristaId) queryParams.append('motoristaId', filters.motoristaId.toString());

    const url = queryParams.toString() 
      ? `${API_URL}/corridas?${queryParams.toString()}`
      : `${API_URL}/corridas`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar corridas');
    }

    return data;
  },

  async getCorridaById(token: string, id: number) {
    const response = await fetch(`${API_URL}/corridas/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar corrida');
    }

    return data;
  },

  async getCorridasDisponiveis(token: string) {
    const response = await fetch(`${API_URL}/corridas/disponiveis`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar corridas disponíveis');
    }

    return data;
  },

  async aceitarCorrida(token: string, id: number) {
    const response = await fetch(`${API_URL}/corridas/${id}/aceitar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao aceitar corrida');
    }

    return data;
  },

  async cancelarCorrida(token: string, id: number, motivo?: string) {
    const response = await fetch(`${API_URL}/corridas/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ motivo: motivo || '' }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao cancelar corrida');
    }

    return data;
  },

  async updateCorrida(token: string, id: number, updateData: unknown) {
    const response = await fetch(`${API_URL}/corridas/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao atualizar corrida');
    }

    return data;
  },

  // Formas de Pagamento
  async createFormaPagamento(token: string, formaPagamentoData: {
    tipoPagamento: 'CARTAO_CREDITO' | 'PIX' | 'CARTEIRA_DIGITAL';
    nomeNoCartao?: string;
    numeroCartao?: string;
    validadeCartao?: string;
    cvv?: string;
  }) {
    // Mapear tipos do frontend para o backend
    const tipoBackend = formaPagamentoData.tipoPagamento === 'CARTEIRA_DIGITAL' 
      ? 'CARTEIRA_APP' 
      : formaPagamentoData.tipoPagamento;

    const backendData = {
      tipoPagamento: tipoBackend,
      nomeCartao: formaPagamentoData.nomeNoCartao,
      numeroCartao: formaPagamentoData.numeroCartao,
      validadeCartao: formaPagamentoData.validadeCartao,
      cvv: formaPagamentoData.cvv,
    };

    const response = await fetch(`${API_URL}/metodos-pagamento`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao cadastrar forma de pagamento');
    }

    return data;
  },

  async getFormasPagamento(token: string) {
    const response = await fetch(`${API_URL}/metodos-pagamento`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar formas de pagamento');
    }

    return data;
  },

  async getFormaPagamentoById(token: string, id: number) {
    const response = await fetch(`${API_URL}/metodos-pagamento/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar forma de pagamento');
    }

    return data;
  },

  async updateFormaPagamento(token: string, id: number, updateData: {
    nomeNoCartao?: string;
    validadeCartao?: string;
  }) {
    const backendData = {
      nomeCartao: updateData.nomeNoCartao,
      validadeCartao: updateData.validadeCartao,
    };

    const response = await fetch(`${API_URL}/metodos-pagamento/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao atualizar forma de pagamento');
    }

    return data;
  },

  async deleteFormaPagamento(token: string, id: number) {
    const response = await fetch(`${API_URL}/metodos-pagamento/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao excluir forma de pagamento');
    }

    return data;
  },

  // Avaliações
  async createAvaliacao(token: string, avaliacaoData: {
    corridaId: number;
    nota: number;
    comentario?: string;
    usuarioParaId: number;
  }) {
    const response = await fetch(`${API_URL}/avaliacoes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(avaliacaoData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao cadastrar avaliação');
    }

    return data;
  },

  async getAvaliacoes(token: string, filters?: {
    usuarioAvaliadoId?: number;
    notaMinima?: number;
    notaMaxima?: number;
    dataInicio?: string;
    dataFim?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (filters?.usuarioAvaliadoId) queryParams.append('usuarioAvaliadoId', filters.usuarioAvaliadoId.toString());
    if (filters?.notaMinima) queryParams.append('notaMinima', filters.notaMinima.toString());
    if (filters?.notaMaxima) queryParams.append('notaMaxima', filters.notaMaxima.toString());
    if (filters?.dataInicio) queryParams.append('dataInicio', filters.dataInicio);
    if (filters?.dataFim) queryParams.append('dataFim', filters.dataFim);

    const url = queryParams.toString() 
      ? `${API_URL}/avaliacoes?${queryParams.toString()}`
      : `${API_URL}/avaliacoes`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar avaliações');
    }

    return data;
  },

  async getAvaliacaoById(token: string, id: number) {
    const response = await fetch(`${API_URL}/avaliacoes/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar avaliação');
    }

    return data;
  },

  async getAvaliacoesPorCorrida(token: string, corridaId: number) {
    const response = await fetch(`${API_URL}/avaliacoes/corrida/${corridaId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar avaliações da corrida');
    }

    return data;
  },

  async updateAvaliacao(token: string, id: number, updateData: {
    nota?: number;
    comentario?: string;
  }) {
    const response = await fetch(`${API_URL}/avaliacoes/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao editar avaliação');
    }

    return data;
  },

  async deleteAvaliacao(token: string, id: number, justificativa?: string) {
    const response = await fetch(`${API_URL}/avaliacoes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ justificativa: justificativa || '' }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao excluir avaliação');
    }

    return data;
  },

  async podeAvaliarCorrida(token: string, corridaId: number) {
    const response = await fetch(`${API_URL}/avaliacoes/pode-avaliar/${corridaId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao verificar se pode avaliar');
    }

    return data;
  },

  // Admin - Dashboard e Relatórios
  async getDashboardAdmin(token: string) {
    const response = await fetch(`${API_URL}/admin/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao carregar dashboard');
    }

    return data;
  },

  async updateUsuarioStatus(token: string, id: number, status: string, justificativa: string) {
    const response = await fetch(`${API_URL}/admin/usuarios/${id}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, justificativa }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao atualizar status do usuário');
    }

    return data;
  },

  async cancelarCorridaAdmin(token: string, id: number, justificativa: string) {
    const response = await fetch(`${API_URL}/admin/corridas/${id}/cancelar`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ justificativa }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao cancelar corrida');
    }

    return data;
  },

  async getHistoricoUsuario(token: string, id: number) {
    const response = await fetch(`${API_URL}/admin/usuarios/${id}/historico`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar histórico do usuário');
    }

    return data;
  },

  async getRelatoriosCorridas(token: string, filters?: {
    dataInicio?: string;
    dataFim?: string;
    statusCorrida?: string;
    statusPagamento?: string;
    cidade?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (filters?.dataInicio) queryParams.append('dataInicio', filters.dataInicio);
    if (filters?.dataFim) queryParams.append('dataFim', filters.dataFim);
    if (filters?.statusCorrida) queryParams.append('statusCorrida', filters.statusCorrida);
    if (filters?.statusPagamento) queryParams.append('statusPagamento', filters.statusPagamento);
    if (filters?.cidade) queryParams.append('cidade', filters.cidade);

    const url = queryParams.toString() 
      ? `${API_URL}/admin/relatorios/corridas?${queryParams.toString()}`
      : `${API_URL}/admin/relatorios/corridas`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao gerar relatório de corridas');
    }

    return data;
  },

  async exportarRelatoriosCorridas(token: string, formato: 'csv' | 'excel' | 'pdf', filters?: {
    dataInicio?: string;
    dataFim?: string;
    statusCorrida?: string;
    statusPagamento?: string;
    cidade?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (filters?.dataInicio) queryParams.append('dataInicio', filters.dataInicio);
    if (filters?.dataFim) queryParams.append('dataFim', filters.dataFim);
    if (filters?.statusCorrida) queryParams.append('statusCorrida', filters.statusCorrida);
    if (filters?.statusPagamento) queryParams.append('statusPagamento', filters.statusPagamento);
    if (filters?.cidade) queryParams.append('cidade', filters.cidade);

    const url = queryParams.toString() 
      ? `${API_URL}/admin/relatorios/corridas/export/${formato}?${queryParams.toString()}`
      : `${API_URL}/admin/relatorios/corridas/export/${formato}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao exportar relatório');
    }

    return response.blob();
  },

  async getRelatoriosMotoristas(token: string, filters?: {
    dataInicio?: string;
    dataFim?: string;
    statusMotorista?: string;
    cidade?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (filters?.dataInicio) queryParams.append('dataInicio', filters.dataInicio);
    if (filters?.dataFim) queryParams.append('dataFim', filters.dataFim);
    if (filters?.statusMotorista) queryParams.append('statusMotorista', filters.statusMotorista);
    if (filters?.cidade) queryParams.append('cidade', filters.cidade);

    const url = queryParams.toString() 
      ? `${API_URL}/admin/relatorios/motoristas?${queryParams.toString()}`
      : `${API_URL}/admin/relatorios/motoristas`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao gerar relatório de motoristas');
    }

    return data;
  },

  async exportarRelatoriosMotoristas(token: string, formato: 'csv' | 'excel' | 'pdf', filters?: {
    dataInicio?: string;
    dataFim?: string;
    statusMotorista?: string;
    cidade?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (filters?.dataInicio) queryParams.append('dataInicio', filters.dataInicio);
    if (filters?.dataFim) queryParams.append('dataFim', filters.dataFim);
    if (filters?.statusMotorista) queryParams.append('statusMotorista', filters.statusMotorista);
    if (filters?.cidade) queryParams.append('cidade', filters.cidade);

    const url = queryParams.toString() 
      ? `${API_URL}/admin/relatorios/motoristas/export/${formato}?${queryParams.toString()}`
      : `${API_URL}/admin/relatorios/motoristas/export/${formato}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao exportar relatório');
    }

    return response.blob();
  },
};
