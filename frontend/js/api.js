const API_BASE = '/api';

async function apiGet(path) {
  const res = await fetch(API_BASE + path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const API = {
  getTopics: () => apiGet('/topics'),
  getTopic: (slug) => apiGet(`/topics/${slug}`),
  getChallenges: () => apiGet('/challenges'),
};
