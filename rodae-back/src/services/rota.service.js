const axios = require('axios');

class RotaService {
  /**
   * Calcula rota, distância e tempo usando OSRM (Open Source Routing Machine)
   * API 100% gratuita, sem necessidade de API key
   */
  async calcularRota(coordsOrigem, coordsDestino) {
    const { longitude: lon1, latitude: lat1 } = coordsOrigem;
    const { longitude: lon2, latitude: lat2 } = coordsDestino;

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}`;
      
      const response = await axios.get(url, {
        params: {
          overview: 'false',
          geometries: 'geojson'
        }
      });

      if (!response.data || !response.data.routes || response.data.routes.length === 0) {
        throw new Error('Nenhuma rota encontrada');
      }

      const rota = response.data.routes[0];

      return {
        distanciaMetros: rota.distance, // em metros
        duracaoSegundos: rota.duration, // em segundos
        distanciaKm: (rota.distance / 1000).toFixed(2),
        duracaoMinutos: Math.ceil(rota.duration / 60),
        duracaoFormatada: this.formatarDuracao(rota.duration)
      };
    } catch (error) {
      if (error.response) {
        throw new Error(`Erro ao calcular rota: ${error.response.data}`);
      }
      throw new Error(`Erro ao calcular rota: ${error.message}`);
    }
  }

  /**
   * Formata duração em segundos para string legível
   */
  formatarDuracao(segundos) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    
    if (horas > 0) {
      return `${horas}h ${minutos}min`;
    }
    return `${minutos}min`;
  }

  /**
   * Calcula valor estimado da corrida baseado na distância e tempo
   */
  calcularValorEstimado(distanciaKm, duracaoMinutos, opcaoCorrida = 'PADRAO') {
    // Tarifas base
    const TARIFA_BASE = 3.00;
    
    // Preço por km conforme modalidade
    const PRECO_POR_KM = {
      PADRAO: 1.80,
      PREMIUM: 2.80,
      COMPARTILHADA: 1.20
    };
    
    // Preço por minuto
    const PRECO_POR_MINUTO = 0.25;

    const precoKm = PRECO_POR_KM[opcaoCorrida] || PRECO_POR_KM.PADRAO;
    
    const valorDistancia = parseFloat(distanciaKm) * precoKm;
    const valorTempo = duracaoMinutos * PRECO_POR_MINUTO;
    const valorTotal = TARIFA_BASE + valorDistancia + valorTempo;

    return {
      tarifaBase: TARIFA_BASE,
      valorDistancia: parseFloat(valorDistancia.toFixed(2)),
      valorTempo: parseFloat(valorTempo.toFixed(2)),
      valorTotal: parseFloat(valorTotal.toFixed(2)),
      detalhamento: {
        distanciaKm: parseFloat(distanciaKm),
        duracaoMinutos,
        precoKm,
        precoMinuto: PRECO_POR_MINUTO
      }
    };
  }

  /**
   * Calcula estimativa completa: rota + valor
   */
  async calcularEstimativaCompleta(coordsOrigem, coordsDestino, opcaoCorrida = 'PADRAO') {
    const rota = await this.calcularRota(coordsOrigem, coordsDestino);
    const valor = this.calcularValorEstimado(
      rota.distanciaKm,
      rota.duracaoMinutos,
      opcaoCorrida
    );

    return {
      rota,
      valor
    };
  }
}

module.exports = new RotaService();
