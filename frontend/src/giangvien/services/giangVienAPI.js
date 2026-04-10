import api from '../../admin/services/api'; 

export const giangVienAPI = {
  // --- API KHÓA HỌC ---
  getKhoaHocCuaToi: () => api.get('/giang-vien/bai-hoc/khoa-hoc-cua-toi'),
  taoKhoaHoc: (data) => api.post('/giang-vien/khoa-hoc/tao-khoa-hoc', data),
  updateKhoaHoc: (id, data) => api.put(`/giang-vien/khoa-hoc/sua-khoa-hoc/${id}`, data),
  xoaKhoaHoc: (id) => api.delete(`/giang-vien/khoa-hoc/xoa-khoa-hoc/${id}`),

  // --- API BÀI HỌC (ĐÃ SỬA ĐỂ UPLOAD ĐƯỢC FILE) ---
  getBaiHoc: (idKhoaHoc) => api.get(`/giang-vien/bai-hoc/lay-danh-sach/${idKhoaHoc}`),
  
  taoBaiHoc: (data) => api.post('/giang-vien/bai-hoc/tao-bai-hoc', data, {
    headers: { 'Content-Type': 'multipart/form-data' } // Bắt buộc thêm cái này
  }),
  
  updateBaiHoc: (id, data) => api.put(`/giang-vien/bai-hoc/sua-bai-hoc/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' } // Bắt buộc thêm cái này
  }),
  
  xoaBaiHoc: (id) => api.delete(`/giang-vien/bai-hoc/xoa-bai-hoc/${id}`),

  // --- API BÀI KIỂM TRA (QUIZ) ---
  taoQuiz: (data) => api.post('/giang-vien/quiz/tao-bai-kiem-tra', data),
  suaQuiz: (id, data) => api.put(`/giang-vien/quiz/sua-bai-kiem-tra/${id}`, data),
  xoaQuiz: (id, tenQuiz) => api.delete(`/giang-vien/quiz/xoa-bai-kiem-tra/${id}`, { data: { tenQuiz } }),

  // --- API BẢNG ĐIỂM & CHỨNG CHỈ ---
  getBangDiem: (idKhoaHoc) => api.get(`/giang-vien/quiz/bang-diem/${idKhoaHoc}`),
  capChungChi: (data) => api.post('/giang-vien/certificate/cap-chung-chi', data),
};