import api from './api';

/**
 * Service to interact with the Global Search backend endpoints.
 */
export const searchService = {
  /**
   * Perform global multi-entity search across Clients, Cases, and Documents.
   * 
   * @param {string} query - Search term (e.g. "Smith" or "2026-0001")
   * @param {number} limit - Max results per entity category (default: 5)
   * @returns {Promise<Object>} - Promise resolving to GlobalSearchResponse JSON payload
   */
  globalSearch: async (query, limit = 5) => {
    const response = await api.get('/search', {
      params: {
        q: query,
        limit: limit
      }
    });
    return response.data;
  }
};

export default searchService;
