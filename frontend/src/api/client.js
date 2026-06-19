import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

export const fetchCities = () => api.get('/cities/').then(r => r.data)

export const fetchAreas = (citySlug) => api.get(`/cities/${citySlug}/areas/`).then(r => r.data)

export const fetchCategories = (areaSlug) => api.get(`/areas/${areaSlug}/categories/`).then(r => r.data)

export const fetchOffers = ({ areaSlug, categorySlug, dealType = 'ALL' }) =>
  api.get('/offers/', { params: { area: areaSlug, category: categorySlug, deal_type: dealType } }).then(r => r.data)

export const fetchSearch = (q) => api.get('/search/', { params: { q } }).then(r => r.data)

export const fetchSearchHistory = () => api.get('/search/history/').then(r => r.data)

export const fetchSaved = () => api.get('/saved/').then(r => r.data)

export const toggleSaved = (offerId) => api.post(`/saved/${offerId}/toggle/`).then(r => r.data)

export default api
