import apiClient from './axiosConfig';

export const notificationsApi = {
  async getMyNotifications({ page = 0, size = 10 } = {}) {
    const { data } = await apiClient.get('/notifications', {
      params: { page, size },
    });
    return data;
  },

  async markAsRead(notificationId) {
    await apiClient.put(`/notifications/${notificationId}/read`);
  },
};
