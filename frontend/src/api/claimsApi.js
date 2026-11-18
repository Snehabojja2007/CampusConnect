import apiClient from './axiosConfig';

export const claimsApi = {
  async createClaim(foundItemId) {
    const { data } = await apiClient.post('/claims', { foundItemId });
    return data;
  },

  async getMyClaims() {
    const { data } = await apiClient.get('/claims/my');
    return data;
  },

  async updateClaimStatus(claimId, status) {
    const { data } = await apiClient.put(`/claims/${claimId}/status`, null, {
      params: { status },
    });
    return data;
  },
};
