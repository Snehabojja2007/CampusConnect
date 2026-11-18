import apiClient from './axiosConfig';

export const authApi = {
  async login(credentials) {
    const { data } = await apiClient.post('/auth/login', credentials);
    return data;
  },

  async register(payload) {
    const { data } = await apiClient.post('/auth/register', payload);
    return data;
  },

  async getCurrentUser() {
    const { data } = await apiClient.get('/users/me');
    return data;
  },
};
