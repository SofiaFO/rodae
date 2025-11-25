const axios = require('axios');

class GeocodingService {
  /**
   * Converte endereço em coordenadas usando Nominatim (OpenStreetMap)
   * API 100% gratuita, sem necessidade de API key
   */
  async geocode(endereco) {
    if (!endereco || endereco.trim() === '') {
      throw new Error('Endereço não pode ser vazio');
    }

    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: endereco,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'Rodae-App/1.0' // Nominatim requer User-Agent
        }
      });

      if (!response.data || response.data.length === 0) {
        throw new Error(`Endereço não encontrado: ${endereco}`);
      }

      const result = response.data[0];

      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        enderecoFormatado: result.display_name
      };
    } catch (error) {
      if (error.response) {
        throw new Error(`Erro ao geocodificar endereço: ${error.response.data}`);
      }
      throw new Error(`Erro ao geocodificar endereço: ${error.message}`);
    }
  }

  /**
   * Geocodifica origem e destino em paralelo
   */
  async geocodeBatch(origem, destino) {
    const [coordsOrigem, coordsDestino] = await Promise.all([
      this.geocode(origem),
      this.geocode(destino)
    ]);

    return {
      origem: coordsOrigem,
      destino: coordsDestino
    };
  }

  /**
   * Calcula distância entre dois pontos usando Haversine (em km)
   * Útil para buscar motoristas próximos
   */
  calcularDistanciaHaversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;
    
    return distancia;
  }

  toRad(graus) {
    return graus * (Math.PI / 180);
  }
}

module.exports = new GeocodingService();
