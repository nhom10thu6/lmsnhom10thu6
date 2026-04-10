import axios from 'axios';

const DEFAULT_REMOTE_API = 'https://lmsnhom10thu6.onrender.com';
const DEFAULT_LOCAL_API = 'http://localhost:5000';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (window.location.hostname === 'localhost' ? DEFAULT_LOCAL_API : DEFAULT_REMOTE_API);
const ADMIN_USER_ID_KEY = 'adminUserId';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add x-user-id header for authentication
api.interceptors.request.use((config) => {
  // Lấy chuỗi thông tin user từ lúc đăng nhập thành công
  const userString = localStorage.getItem('user');
  let userId = '6'; // Vẫn giữ số 6 làm phương án dự phòng cho bạn của bạn

  if (userString) {
      const user = JSON.parse(userString);
      userId = String(user.id); // Lấy id thật của tài khoản đang đăng nhập
  } else {
      // Nếu không có 'user', thử lấy 'adminUserId' cũ
      userId = localStorage.getItem(ADMIN_USER_ID_KEY) || '6';
  }

  config.headers['x-user-id'] = userId;
  return config;
});
export const getAdminUserId = () => localStorage.getItem(ADMIN_USER_ID_KEY) || '6';
export const setAdminUserId = (id) => localStorage.setItem(ADMIN_USER_ID_KEY, String(id));

// Admin Users API
export const usersAPI = {
  getAll: (role = null) => {
    const params = role ? { role } : {};
    return api.get('/admin/users', { params });
  },
  search: (taiKhoan) => api.get('/admin/users/search', { params: { taiKhoan } }),
  getById: (id) => api.get(`/admin/users/${id}`),
  create: (userData) => api.post('/admin/users', userData),
  update: (id, userData) => api.put(`/admin/users/${id}`, userData),
  delete: (id) => api.delete(`/admin/users/${id}`),
};

// Admin Classrooms API
export const classroomsAPI = {
  getAll: () => api.get('/admin/classrooms'),
  search: (params) => api.get('/admin/classrooms/search', { params }),
  getById: (id) => api.get(`/admin/classrooms/${id}`),
  create: (classroomData) => api.post('/admin/classrooms', classroomData),
  update: (id, classroomData) => api.put(`/admin/classrooms/${id}`, classroomData),
  delete: (id) => api.delete(`/admin/classrooms/${id}`),
};

export default api;
