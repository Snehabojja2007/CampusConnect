import apiClient from './axiosConfig';

export const matchesApi = {
  async findMatches(lostItemId) {
    const { data } = await apiClient.get(`/matches/lost/${lostItemId}`);
    return data;
  },
};
