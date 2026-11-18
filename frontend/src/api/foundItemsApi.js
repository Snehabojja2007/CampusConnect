import apiClient from './axiosConfig';

export const foundItemsApi = {
  async getFoundItems({ title = '', location = '', page = 0, size = 10, sort = 'createdAt,desc' } = {}) {
    const params = { page, size, sort };
    if (title.trim()) params.title = title.trim();
    if (location.trim()) params.location = location.trim();
    const { data } = await apiClient.get('/found-items', { params });
    return data;
  },

  async createFoundItem(payload) {
    const { data } = await apiClient.post('/found-items', payload);
    return data;
  },

  async updateFoundItem(id, payload) {
    const { data } = await apiClient.put(`/found-items/${id}`, payload);
    return data;
  },

  async deleteFoundItem(id) {
    await apiClient.delete(`/found-items/${id}`);
  },
};
