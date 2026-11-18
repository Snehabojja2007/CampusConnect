import apiClient from './axiosConfig';

export const handoversApi = {
  async createHandover(claimId) {
    const { data } = await apiClient.post('/handovers', null, {
      params: { claimId },
    });
    return data;
  },

  async completeHandover(handoverId) {
    const { data } = await apiClient.put(`/handovers/${handoverId}/complete`);
    return data;
  },

  async getMyHandovers() {
    const { data } = await apiClient.get('/handovers/my');
    return data;
  },
};
