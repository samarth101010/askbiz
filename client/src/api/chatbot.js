import api from './client';

export const getChatbots = async () => {
  const response = await api.get('/chatbots');
  return response.data;
};

export const getChatbotById = async (id) => {
  const response = await api.get(`/chatbots/${id}`);
  return response.data;
};

export const createChatbot = async (data) => {
  const response = await api.post('/chatbots', data);
  return response.data;
};

export const updateChatbot = async (id, data) => {
  const response = await api.put(`/chatbots/${id}`, data);
  return response.data;
};

export const deleteChatbot = async (id) => {
  const response = await api.delete(`/chatbots/${id}`);
  return response.data;
};
