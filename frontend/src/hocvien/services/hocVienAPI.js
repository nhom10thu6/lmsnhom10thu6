import axios from 'axios';

const DEFAULT_REMOTE_API = 'https://lmsnhom10thu6.onrender.com';
const DEFAULT_LOCAL_API = 'http://localhost:5000';
const API_URL = import.meta.env.VITE_API_BASE_URL
  || (window.location.hostname === 'localhost' ? DEFAULT_LOCAL_API : DEFAULT_REMOTE_API);

const getHeaders = () => {
  const userString = localStorage.getItem('user');
  let finalId = '';
  
  if (userString && userString !== 'undefined') {
      try {
          const user = JSON.parse(userString);
          const foundId = user.id || user.idNguoiDung;
          if (foundId) finalId = String(foundId);
      } catch (err) {}
  }

  return {
    'Content-Type': 'application/json',
    ...(finalId && { 'x-user-id': finalId })
  };
};

export const hocVienAPI = {
  // === KHÓA HỌC ===
  getDanhSachKhoaHoc: () =>
    axios.get(`${API_URL}/api/hocvien/khoahoc`, { headers: getHeaders() }),

  getKhoaHocDangKy: () =>
    axios.get(`${API_URL}/api/hocvien/khoahoc/dang-ky`, { headers: getHeaders() }),

  dangKyKhoaHoc: (idKhoaHoc) =>
    axios.post(`${API_URL}/api/hocvien/khoahoc/dang-ky`, { idKhoaHoc }, { headers: getHeaders() }),

  getKhoaHocChoThanhToan: () =>
    axios.get(`${API_URL}/api/hocvien/khoahoc/cho-thanh-toan`, { headers: getHeaders() }),

  taoThanhToanSePay: (idKhoaHoc) =>
    axios.post(
      `${API_URL}/thanhtoan/sepay/tao`,
      { idKhoaHoc },
      { headers: getHeaders() },
    ),

  thanhToanKhoaHoc: (idKhoaHoc, payload = {}) =>
    axios.post(
      `${API_URL}/api/hocvien/khoahoc/thanh-toan`,
      { idKhoaHoc, ...payload },
      { headers: getHeaders() },
    ),

  getChiTietKhoaHoc: (idKhoaHoc) =>
    axios.get(`${API_URL}/api/hocvien/khoahoc/${idKhoaHoc}`, { headers: getHeaders() }),

  // === BÀI HỌC ===
  getBaiHoc: (idBaiHoc) =>
    axios.get(`${API_URL}/api/hocvien/baihoc/${idBaiHoc}`, { headers: getHeaders() }),

  startBaiHoc: (idBaiHoc) =>
    axios.patch(`${API_URL}/api/hocvien/start`, { idBaiHoc }, { headers: getHeaders() }),

  updateTime: (idBaiHoc, thoiGianHoc) =>
    axios.patch(`${API_URL}/api/hocvien/time`, { idBaiHoc, thoiGianHoc }, { headers: getHeaders() }),

  completeBaiHoc: (idBaiHoc) =>
    axios.patch(`${API_URL}/api/hocvien/complete`, { idBaiHoc }, { headers: getHeaders() }),

  // === QUIZ ===
  startQuiz: (idQuiz) =>
    axios.get(`${API_URL}/api/hocvien/quiz/${idQuiz}/start`, { headers: getHeaders() }),

  getQuiz: (idQuiz) =>
    axios.get(`${API_URL}/api/hocvien/quiz/${idQuiz}`, { headers: getHeaders() }),

  submitQuiz: (idQuiz, answers, thoiGianLamBai) =>
    axios.post(`${API_URL}/api/hocvien/quiz/${idQuiz}/submit`, { answers, thoiGianLamBai }, { headers: getHeaders() }),

  getQuizResult: (idQuiz) =>
    axios.get(`${API_URL}/api/hocvien/quiz/${idQuiz}/result`, { headers: getHeaders() }),

  // === CHỨNG CHỈ ===
  getDanhSachChungChi: () =>
    axios.get(`${API_URL}/api/hocvien/certificate`, { headers: getHeaders() }),

  getChungChi: (idKhoaHoc) =>
    axios.get(`${API_URL}/api/hocvien/certificate/${idKhoaHoc}`, { headers: getHeaders() }),

  inChungChi: (idKhoaHoc) =>
    axios.get(`${API_URL}/api/hocvien/certificate/${idKhoaHoc}/print`, { headers: getHeaders() })
};
