import apiClient from './axiosConfig';

export const adminApi = {
  async getAllUsers() {
    const { data } = await apiClient.get('/admin/users');
    return data;
  },

  async updateUserStatus(userId, active) {
    const { data } = await apiClient.put(`/admin/users/${userId}/status`, { active });
    return data;
  },

  async getAllLostItems() {
    const { data } = await apiClient.get('/admin/lost-items');
    return data;
  },

  async getPendingLostItems() {
    const { data } = await apiClient.get('/admin/lost-items/pending');
    return data;
  },

  async moderateLostItem(itemId, moderationStatus) {
    const { data } = await apiClient.put(`/admin/lost-items/${itemId}/moderation`, {
      moderationStatus,
    });
    return data;
  },

  async getAllFoundItems() {
    const { data } = await apiClient.get('/admin/found-items');
    return data;
  },

  async getPendingFoundItems() {
    const { data } = await apiClient.get('/admin/found-items/pending');
    return data;
  },

  async moderateFoundItem(itemId, moderationStatus) {
    const { data } = await apiClient.put(`/admin/found-items/${itemId}/moderation`, {
      moderationStatus,
    });
    return data;
  },

  async getAllClaims() {
    const { data } = await apiClient.get('/admin/claims');
    return data;
  },

  async getAllHandovers() {
    const { data } = await apiClient.get('/admin/handovers');
    return data;
  },
};
