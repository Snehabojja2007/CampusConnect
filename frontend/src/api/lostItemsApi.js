import apiClient from './axiosConfig';

export const lostItemsApi = {
  async getLostItems({ title = '', location = '', page = 0, size = 10, sort = 'createdAt,desc' } = {}) {
    const params = { page, size, sort };
    if (title.trim()) params.title = title.trim();
    if (location.trim()) params.location = location.trim();
    const { data } = await apiClient.get('/lost-items', { params });
    return data;
  },

  async createLostItem(payload) {
    const { data } = await apiClient.post('/lost-items', payload);
    return data;
  },

  async updateLostItem(id, payload) {
    const { data } = await apiClient.put(`/lost-items/${id}`, payload);
    return data;
  },

  async deleteLostItem(id) {
    await apiClient.delete(`/lost-items/${id}`);
  },
};
