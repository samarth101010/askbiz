import api from './client';

export const askChatbot = async (chatbotId, question, conversationId = null) => {
  const response = await api.post(`/chat/${chatbotId}`, { question, conversationId });
  return response.data;
};

export const getConversations = async (chatbotId) => {
  const response = await api.get(`/chat/${chatbotId}/conversations`);
  return response.data;
};

export const getConversationMessages = async (chatbotId, conversationId) => {
  const response = await api.get(`/chat/${chatbotId}/conversations/${conversationId}`);
  return response.data;
};

export const deleteConversation = async (chatbotId, conversationId) => {
  const response = await api.delete(`/chat/${chatbotId}/conversations/${conversationId}`);
  return response.data;
};
