import axios from 'axios'

export const getToken = () => localStorage.getItem('hfleet_token')
export const getHpesaToken = () => { try { return localStorage.getItem('hfleet_hpesa_token') } catch { return null } }
export const setHpesaToken = (t) => { try { t ? localStorage.setItem('hfleet_hpesa_token', t) : localStorage.removeItem('hfleet_hpesa_token') } catch { /* ignore */ } }
const headers = () => ({ Authorization: `Bearer ${getToken()}`, ...(getHpesaToken() ? { 'x-hpesa-token': getHpesaToken() } : {}) })
export const get = (url) => axios.get(url, { headers: headers() }).then(r => r.data)
export const post = (url, body) => axios.post(url, body, { headers: headers() }).then(r => r.data)
export const patch = (url, body) => axios.patch(url, body, { headers: headers() }).then(r => r.data)
export const del = (url) => axios.delete(url, { headers: headers() }).then(r => r.data)
export const errMsg = (e, fallback = 'Something went wrong. Please try again.') => e?.response?.data?.error || (e?.request ? 'Could not reach the server. Check your connection.' : fallback)
export const getUser = () => { try { return JSON.parse(localStorage.getItem('hfleet_user')) || {} } catch { return {} } }

// Where H-Pesa (the wallet app) lives, for the "Top up" button
export const HPESA_URL = (import.meta.env.VITE_HPESA_URL || '').replace(/\/$/, '')
