import api from './client';

export const uploadPDF = async (chatbotId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`/knowledge/${chatbotId}/upload-pdf`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const uploadText = async (chatbotId, { title, text }) => {
  const response = await api.post(`/knowledge/${chatbotId}/upload-text`, { title, text });
  return response.data;
};

export const getKnowledgeSummary = async (chatbotId) => {
  const response = await api.get(`/knowledge/${chatbotId}`);
  return response.data;
};

export const getChunks = async (chatbotId, documentName = '') => {
  const url = documentName
    ? `/knowledge/${chatbotId}/chunks?documentName=${encodeURIComponent(documentName)}`
    : `/knowledge/${chatbotId}/chunks`;
  const response = await api.get(url);
  return response.data;
};

export const deleteDocument = async (chatbotId, documentName) => {
  const response = await api.delete(`/knowledge/${chatbotId}/document`, {
    data: { documentName }
  });
  return response.data;
};
