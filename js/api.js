/**
 * ============================================================================
 * Proyecto: PreuSync Admin Panel
 * Archivo: api.js
 * Versión: v2.1.0
 * Descripción: Cliente HTTP centralizado para interactuar con la API de PreuSync.
 *              Soporta acciones CRUD completas (crear, editar, eliminar) para
 *              contenidos, usuarios, denuncias de posts en DB2, ubicaciones y horarios.
 * Autor: JiroxDEV
 * Licensed under the GNU Affero General Public License v3
 * ============================================================================
 */

import { CONFIG } from './config.js';

export class ApiClient {
  static getToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
  }

  static getRefreshToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
  }

  static setSession(token, refreshToken, user) {
    if (token) localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
    if (refreshToken) localStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    if (user) localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
  }

  static clearSession() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
  }

  static async request(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const token = ApiClient.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });

      // Auto-renovación de token si vence (HTTP 401)
      if (response.status === 401 && ApiClient.getRefreshToken() && !endpoint.includes('/auth/refresh')) {
        const refreshed = await ApiClient.refreshSession();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${ApiClient.getToken()}`;
          const retryRes = await fetch(url, { ...options, headers });
          return await retryRes.json();
        }
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error(`[API Error] ${endpoint}:`, error);
      throw error;
    }
  }

  static async refreshSession() {
    const refreshToken = ApiClient.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      const data = await res.json();
      if (data.success && data.data) {
        ApiClient.setSession(data.data.sessionToken, data.data.refreshToken, data.data.user);
        return true;
      }
    } catch (e) {
      ApiClient.clearSession();
    }
    return false;
  }

  // --- AUTENTICACIÓN Y USUARIOS ---
  static login(username, password) {
    return ApiClient.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  static getMe() {
    return ApiClient.request('/auth/me');
  }

  static getUserByUsername(username) {
    return ApiClient.request(`/auth/profile/${encodeURIComponent(username)}`);
  }

  static updateUser(userId, updateData) {
    return ApiClient.request('/auth/update', {
      method: 'POST',
      body: JSON.stringify({ userId, ...updateData })
    });
  }

  static deleteUser(userId) {
    return ApiClient.request(`/users/${userId}`, {
      method: 'DELETE'
    });
  }

  // --- UBICACIONES Y ESTRUCTURA ESCOLAR ---
  static getProvinces() {
    return ApiClient.request('/schools/provinces');
  }

  static addProvince(provinceData) {
    return ApiClient.request('/schools/provinces', {
      method: 'POST',
      body: JSON.stringify(provinceData)
    });
  }

  static deleteProvince(id) {
    return ApiClient.request(`/schools/provinces/${id}`, {
      method: 'DELETE'
    });
  }

  static getMunicipalities(provinceId) {
    return ApiClient.request(`/schools/municipalities?provinceId=${provinceId}`);
  }

  static addMunicipality(municipalityData) {
    return ApiClient.request('/schools/municipalities', {
      method: 'POST',
      body: JSON.stringify(municipalityData)
    });
  }

  static deleteMunicipality(id) {
    return ApiClient.request(`/schools/municipalities/${id}`, {
      method: 'DELETE'
    });
  }

  static getSchools(municipalityId) {
    return ApiClient.request(`/schools/institutions?municipalityId=${municipalityId}`);
  }

  static addSchool(schoolData) {
    return ApiClient.request('/schools', {
      method: 'POST',
      body: JSON.stringify(schoolData)
    });
  }

  static deleteSchool(id) {
    return ApiClient.request(`/schools/${id}`, {
      method: 'DELETE'
    });
  }

  static getGroups(schoolId) {
    return ApiClient.request(`/groups?schoolId=${schoolId}`);
  }

  static addGroup(groupData) {
    return ApiClient.request('/groups', {
      method: 'POST',
      body: JSON.stringify(groupData)
    });
  }

  static deleteGroup(id) {
    return ApiClient.request(`/groups/${id}`, {
      method: 'DELETE'
    });
  }

  // --- HORARIOS ---
  static getSchedule(group, schoolId) {
    return ApiClient.request(`/schedule?group=${encodeURIComponent(group)}&schoolId=${schoolId}`);
  }

  static upsertSchedule(scheduleData) {
    return ApiClient.request('/schedule', {
      method: 'POST',
      body: JSON.stringify(scheduleData)
    });
  }

  static deleteSchedule(group, schoolId) {
    return ApiClient.request(`/schedule?group=${encodeURIComponent(group)}&schoolId=${schoolId}`, {
      method: 'DELETE'
    });
  }

  // --- PUBLICACIONES (POSTS) ---
  static getTopPosts(limit = 10) {
    return ApiClient.request(`/posts/top?limit=${limit}`);
  }

  static getPostsRange(start = 0, count = 20) {
    return ApiClient.request(`/posts/range?start=${start}&count=${count}`);
  }

  static addPost(postData) {
    return ApiClient.request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  }

  static deletePost(id) {
    return ApiClient.request(`/posts/${id}`, {
      method: 'DELETE'
    });
  }

  // --- NOTICIAS ---
  static getTopNews(limit = 10) {
    return ApiClient.request(`/news/top?limit=${limit}`);
  }

  static getNewsRange(start = 0, count = 20) {
    return ApiClient.request(`/news/range?start=${start}&count=${count}`);
  }

  static addNews(newsData) {
    return ApiClient.request('/news', {
      method: 'POST',
      body: JSON.stringify(newsData)
    });
  }

  static deleteNews(id) {
    return ApiClient.request(`/news/${id}`, {
      method: 'DELETE'
    });
  }

  // --- EVENTOS ---
  static getSchoolEvents(schoolId, start = 0, count = 20) {
    return ApiClient.request(`/events/school?start=${start}&count=${count}&schoolId=${schoolId}`);
  }

  static getExternalEvents(start = 0, count = 20) {
    return ApiClient.request(`/events/external?start=${start}&count=${count}`);
  }

  static addEvent(eventData) {
    return ApiClient.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  }

  static deleteEvent(id) {
    return ApiClient.request(`/events/${id}`, {
      method: 'DELETE'
    });
  }

  // --- EFEMÉRIDES ---
  static getEphemeris(date) {
    return ApiClient.request(`/ephemeris?date=${encodeURIComponent(date)}`);
  }

  static addEphemeris(ephemerisData) {
    return ApiClient.request('/ephemeris', {
      method: 'POST',
      body: JSON.stringify(ephemerisData)
    });
  }

  static deleteEphemeris(id) {
    return ApiClient.request(`/ephemeris/${id}`, {
      method: 'DELETE'
    });
  }

  // --- REPORTES Y DENUNCIAS ---
  static getBugReports() {
    return ApiClient.request('/reports');
  }

  static getPostReports() {
    return ApiClient.request('/reports/posts');
  }

  static deletePostReport(id) {
    return ApiClient.request(`/reports/posts/${id}`, {
      method: 'DELETE'
    });
  }

  static sendBugReport(reportData) {
    return ApiClient.request('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  }

  static deleteReport(id) {
    return ApiClient.request(`/reports/${id}`, {
      method: 'DELETE'
    });
  }
}
