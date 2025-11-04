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
    } catch (error: any) {
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
    } catch (error: any) {
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

  async updateProfile(token: string, userType: string, userId: number, userData: any) {
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
      const passageiro = passageirosData.data.find((p: any) => p.usuario.id === userId);
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
      const motorista = motoristasData.data.find((m: any) => m.id === userId);
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
};
