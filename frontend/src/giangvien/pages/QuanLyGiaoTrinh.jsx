import React, { useState, useEffect } from "react";
import { giangVienAPI } from "../services/giangVienAPI";
import "../../admin/styles/classrooms.css";
import axios from 'axios';

export default function QuanLyGiaoTrinh() {
  const [danhSachKhoaHoc, setDanhSachKhoaHoc] = useState([]);
  const [khoaHocDuocChon, setKhoaHocDuocChon] = useState("");
  const [danhSachBaiHoc, setDanhSachBaiHoc] = useState([]);
  const [danhSachQuiz, setDanhSachQuiz] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("baihoc");

  // --- STATE MODALS ---
  const [showModal, setShowModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // STATE MỚI: Dành cho chức năng Upload File của Hìn
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form data không cần videoUrl/taiLieuUrl nữa vì Backend sẽ tự tạo từ file
  const [formData, setFormData] = useState({ tenBaiHoc: "", thuTu: 1 });

  const [quizData, setQuizData] = useState({
    tenQuiz: "",
    thoiGianLamBai: 15,
    questions: [
      {
        cauHoi: "",
        loaiCauHoi: "tracnghiem",
        dapAnA: "",
        dapAnB: "",
        dapAnC: "",
        dapAnD: "",
        dapAnDung: "",
        diemCauHoi: 10,
      },
    ],
  });

  useEffect(() => {
    const loadKH = async () => {
      try {
        const res = await giangVienAPI.getKhoaHocCuaToi();
        if (res.data.success) {
          setDanhSachKhoaHoc(res.data.data);
          if (res.data.data.length > 0)
            setKhoaHocDuocChon(res.data.data[0].idKhoaHoc.toString());
        }
      } catch (error) {
        console.error("Lỗi load khóa học:", error);
      }
    };
    loadKH();
  }, []);

  const loadContent = async (forcedId = null) => {
    let idToLoad = forcedId || khoaHocDuocChon;
    if (!idToLoad) return;
    const idClean = parseInt(idToLoad);

    setIsLoading(true);
    try {
      if (activeTab === "baihoc") {
        const res = await giangVienAPI.getBaiHoc(idClean);
        if (res.data.success) setDanhSachBaiHoc(res.data.data);
      } else {
        const res = await giangVienAPI.getBangDiem(idClean);
        if (res.data.success) setDanhSachQuiz(res.data.data.danhSachQuiz || []);
      }
    } catch (e) {
      console.error("Lỗi:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [khoaHocDuocChon, activeTab]);

  // --- XỬ LÝ BÀI HỌC (ĐỒNG BỘ VỚI UPLOAD CỦA HÌN) ---
  // const handleSubmitLesson = async (e) => {
  //   e.preventDefault();
  //   setIsUploading(true); // Hiển thị trạng thái đang tải lên

  //   try {
  //     const currentId = parseInt(khoaHocDuocChon);

  //     // Dùng FormData để gửi file vật lý qua API
  //     const formToSend = new FormData();
  //     formToSend.append("idKhoaHoc", currentId);
  //     formToSend.append("tenBaiHoc", formData.tenBaiHoc);
  //     formToSend.append("thuTu", formData.thuTu);

  //     if (selectedFile) {
  //       formToSend.append("file", selectedFile);
  //     } else if (!isEditing) {
  //       alert("⚠️ Bạn chưa chọn file video/tài liệu cho bài học này!");
  //       setIsUploading(false);
  //       return;
  //     }

  //     const res = isEditing
  //       ? await giangVienAPI.updateBaiHoc(editingId, formToSend)
  //       : await giangVienAPI.taoBaiHoc(formToSend);

  //     if (res.data.success) {
  //       alert(`🎉 ${isEditing ? "Cập nhật" : "Tạo"} bài học thành công!`);
  //       setShowModal(false);
  //       setSelectedFile(null); // Reset file
  //       loadContent(currentId);
  //     }
  //   } catch (err) {
  //     alert(err.response?.data?.message || "Lỗi lưu bài học!");
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };
  const handleSubmitLesson = async (e) => {
    e.preventDefault();
    setIsUploading(true); // Hiển thị trạng thái đang tải lên

    try {
      const currentId = parseInt(khoaHocDuocChon);

      // Dùng FormData để gửi file qua API
      const formToSend = new FormData();
      formToSend.append("idKhoaHoc", currentId);
      formToSend.append("tenBaiHoc", formData.tenBaiHoc);
      formToSend.append("thuTu", formData.thuTu);

      if (selectedFile) {
        formToSend.append("file", selectedFile);
      } else if (!isEditing) {
        alert("⚠️ Bạn chưa chọn file video/tài liệu cho bài học này!");
        setIsUploading(false);
        return;
      }

      // QUAY LẠI DÙNG API GỐC CỦA LIÊM ĐỂ ĐẢM BẢO KHÔNG BỊ LỖI 401
      const res = isEditing
        ? await giangVienAPI.updateBaiHoc(editingId, formToSend)
        : await giangVienAPI.taoBaiHoc(formToSend);

      if (res.data.success) {
        alert(`🎉 ${isEditing ? "Cập nhật" : "Tạo"} bài học thành công!`);
        setShowModal(false);
        setSelectedFile(null); // Reset file
        loadContent(currentId);
      }
    } catch (err) {
      // 🕵️ TÓM CỔ CHI TIẾT LỖI 400 Ở ĐÂY
      console.error("🕵️ LỖI TỪ BACKEND LÀ GÌ:", err.response?.data);
      alert(err.response?.data?.message || "Lỗi lưu bài học!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLesson = async (id) => {
    if (
      window.confirm(
        "⚠️ Xóa bài học này sẽ xóa luôn file trên Google Drive. Bạn chắc chứ?",
      )
    ) {
      try {
        const res = await giangVienAPI.xoaBaiHoc(id);
        if (res.data.success) {
          alert("Đã xóa thành công!");
          loadContent();
        }
      } catch (e) {
        alert("Lỗi xóa bài học!");
      }
    }
  };

  // --- XỬ LÝ QUIZ GIỮ NGUYÊN ---
  const addQuestion = () =>
    setQuizData({
      ...quizData,
      questions: [
        ...(quizData.questions || []),
        {
          cauHoi: "",
          loaiCauHoi: "tracnghiem",
          dapAnA: "",
          dapAnB: "",
          dapAnC: "",
          dapAnD: "",
          dapAnDung: "",
          diemCauHoi: 10,
        },
      ],
    });
  const removeQuestion = (index) =>
    setQuizData({
      ...quizData,
      questions: (quizData.questions || []).filter((_, i) => i !== index),
    });
  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...(quizData.questions || [])];
    newQuestions[index][field] = value;
    setQuizData({ ...quizData, questions: newQuestions });
  };
  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    try {
      const currentId = parseInt(khoaHocDuocChon);
      const data = { ...quizData, idKhoaHoc: currentId };
      const res = isEditing
        ? await giangVienAPI.suaQuiz(editingId, data)
        : await giangVienAPI.taoQuiz(data);
      if (res.data.success) {
        alert("🎉 Đã lưu bài kiểm tra thành công!");
        setShowQuizModal(false);
        loadContent(currentId);
      }
    } catch (err) {
      alert("Lỗi lưu Quiz!");
    }
  };
  const handleDeleteQuiz = async (id, ten) => {
    if (window.confirm(`Xóa bài kiểm tra "${ten}" nhé?`)) {
      try {
        const res = await giangVienAPI.xoaQuiz(id, ten);
        if (res.data.success) loadContent();
      } catch (e) {
        alert("Lỗi xóa Quiz!");
      }
    }
  };

  return (
    <div
      className="classrooms-page"
      style={{ padding: "20px", backgroundColor: "#f8fafc" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          background: "#fff",
          padding: "15px 20px",
          borderRadius: "12px",
        }}
      >
        <h2 style={{ color: "#1e293b", margin: 0 }}>📝 Quản lý Giáo trình</h2>
        <select
          className="filter-select"
          style={{
            width: "400px",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
          value={khoaHocDuocChon}
          onChange={(e) => setKhoaHocDuocChon(e.target.value)}
        >
          {danhSachKhoaHoc.map((kh) => (
            <option key={kh.idKhoaHoc} value={kh.idKhoaHoc}>
              {kh.tenKhoaHoc}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("baihoc")}
          style={{
            padding: "10px 25px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            backgroundColor: activeTab === "baihoc" ? "#1e293b" : "#f1f5f9",
            color: activeTab === "baihoc" ? "white" : "#1e293b",
            fontWeight: "bold",
          }}
        >
          📖 Bài Học
        </button>
        <button
          onClick={() => setActiveTab("quiz")}
          style={{
            padding: "10px 25px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            backgroundColor: activeTab === "quiz" ? "#1e293b" : "#f1f5f9",
            color: activeTab === "quiz" ? "white" : "#1e293b",
            fontWeight: "bold",
          }}
        >
          📓 Bài Kiểm Tra
        </button>
      </div>

      <div
        className="classrooms-list"
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        }}
      >
        {activeTab === "baihoc" ? (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
              }}
            >
              <h3 style={{ margin: 0 }}>Danh sách Bài học</h3>
              <button
                className="btn btn-primary"
                style={{ backgroundColor: "#1e293b" }}
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    tenBaiHoc: "",
                    thuTu: danhSachBaiHoc.length + 1,
                  });
                  setSelectedFile(null);
                  setShowModal(true);
                }}
              >
                + Thêm Bài Học
              </button>
            </div>
            <table className="classrooms-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên Bài Học</th>
                  <th>Thứ tự</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      Đang nạp...
                    </td>
                  </tr>
                ) : danhSachBaiHoc.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      Chưa có bài học
                    </td>
                  </tr>
                ) : (
                  danhSachBaiHoc.map((bh) => (
                    <tr key={bh.idBaiHoc}>
                      <td>#{bh.idBaiHoc}</td>
                      <td>{bh.tenBaiHoc}</td>
                      <td>{bh.thuTu}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btn-sm btn-edit"
                          style={{ marginRight: "5px" }}
                          onClick={() => {
                            setIsEditing(true);
                            setEditingId(bh.idBaiHoc);
                            setFormData({
                              tenBaiHoc: bh.tenBaiHoc,
                              thuTu: bh.thuTu,
                            });
                            setSelectedFile(null);
                            setShowModal(true);
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ backgroundColor: "#ef4444", color: "white" }}
                          onClick={() => handleDeleteLesson(bh.idBaiHoc)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
              }}
            >
              <h3 style={{ margin: 0 }}>Danh sách Bài kiểm tra</h3>
              <button
                className="btn btn-primary"
                style={{ backgroundColor: "#1e293b" }}
                onClick={() => {
                  setIsEditing(false);
                  setQuizData({
                    tenQuiz: "",
                    thoiGianLamBai: 15,
                    questions: [
                      {
                        cauHoi: "",
                        loaiCauHoi: "tracnghiem",
                        dapAnA: "",
                        dapAnB: "",
                        dapAnC: "",
                        dapAnD: "",
                        dapAnDung: "",
                        diemCauHoi: 10,
                      },
                    ],
                  });
                  setShowQuizModal(true);
                }}
              >
                + Tạo Quiz Mới
              </button>
            </div>
            <table className="classrooms-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên Quiz</th>
                  <th>Thời gian</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      Đang nạp dữ liệu...
                    </td>
                  </tr>
                ) : danhSachQuiz.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
                      Chưa có bài kiểm tra.
                    </td>
                  </tr>
                ) : (
                  danhSachQuiz.map((qz) => (
                    <tr key={qz.idQuiz}>
                      <td>#{qz.idQuiz}</td>
                      <td>{qz.tenQuiz}</td>
                      <td>{qz.thoiGianLamBai} phút</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btn-sm btn-edit"
                          style={{ marginRight: "5px" }}
                          onClick={() => {
                            setIsEditing(true);
                            setEditingId(qz.idQuiz);
                            setQuizData({
                              ...qz,
                              questions: qz.quiz_questions || [],
                            });
                            setShowQuizModal(true);
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ backgroundColor: "#ef4444", color: "white" }}
                          onClick={() =>
                            handleDeleteQuiz(qz.idQuiz, qz.tenQuiz)
                          }
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* --- MODAL BÀI HỌC (ĐÃ SỬA DÀNH CHO UPLOAD FILE) --- */}
      {showModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ width: "500px" }}>
            <div className="modal-header">
              <h3>{isEditing ? "📝 Sửa bài học" : "✨ Thêm bài học mới"}</h3>
              <button
                className="btn-close"
                disabled={isUploading}
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmitLesson} style={{ padding: "20px" }}>
              <div className="form-group" style={{ marginBottom: "10px" }}>
                <label>Tên bài học</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.tenBaiHoc}
                  onChange={(e) =>
                    setFormData({ ...formData, tenBaiHoc: e.target.value })
                  }
                />
              </div>
              <div className="form-group" style={{ marginBottom: "10px" }}>
                <label>Thứ tự</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  value={formData.thuTu}
                  onChange={(e) =>
                    setFormData({ ...formData, thuTu: e.target.value })
                  }
                />
              </div>

              {/* THAY THẾ 2 Ô TEXT BẰNG 1 Ô UPLOAD FILE */}
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label>
                  Upload File (Tự động nhận diện Video hoặc PDF/Word)
                </label>
                <input
                  type="file"
                  // Thay style này để nó không bị lỗi khung đè lên nhau
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: "8px",
                    padding: "10px",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    cursor: "pointer",
                  }}
                  accept="video/*, .pdf, .doc, .docx, .ppt, .pptx, .xls, .xlsx"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
                {isEditing && !selectedFile && (
                  <small
                    style={{
                      color: "#64748b",
                      display: "block",
                      marginTop: "5px",
                    }}
                  >
                    * Bỏ trống nếu muốn giữ nguyên file trên Drive cũ
                  </small>
                )}
              </div>

              <div
                className="form-actions"
                style={{ display: "flex", gap: "10px" }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isUploading}
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, backgroundColor: "#1e293b" }}
                  disabled={isUploading}
                >
                  {isUploading ? "⏳ Đang tải lên Drive..." : "Lưu bài học"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL QUIZ (GIỮ NGUYÊN BẢN CHUẨN) --- */}
      {showQuizModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div
            className="modal-content"
            style={{ width: "650px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="modal-header">
              <h3>{isEditing ? "📝 Sửa Quiz" : "📝 Tạo Quiz mới"}</h3>
              <button
                className="btn-close"
                onClick={() => setShowQuizModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveQuiz} style={{ padding: "20px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: "15px",
                  marginBottom: "20px",
                }}
              >
                <div className="form-group">
                  <label>Tên bài kiểm tra</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={quizData?.tenQuiz || ""}
                    onChange={(e) =>
                      setQuizData({ ...quizData, tenQuiz: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Thời gian (phút)</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    value={quizData?.thoiGianLamBai || 15}
                    onChange={(e) =>
                      setQuizData({
                        ...quizData,
                        thoiGianLamBai: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {(quizData?.questions || []).map((q, index) => (
                <div
                  key={index}
                  style={{
                    background: "#f5f3ff",
                    padding: "15px",
                    borderRadius: "8px",
                    marginBottom: "15px",
                    border: "1px solid #c4b5fd",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                    }}
                  >
                    <b>Câu hỏi #{index + 1}</b>
                    <select
                      value={q.loaiCauHoi}
                      onChange={(e) =>
                        handleQuestionChange(
                          index,
                          "loaiCauHoi",
                          e.target.value,
                        )
                      }
                      style={{ padding: "2px 8px" }}
                    >
                      <option value="tracnghiem">Trắc nghiệm</option>
                      <option value="tuluan">Tự luận</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      style={{
                        color: "red",
                        border: "none",
                        background: "none",
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                  <textarea
                    className="form-input"
                    rows="2"
                    placeholder="Nội dung câu hỏi..."
                    required
                    value={q.cauHoi}
                    onChange={(e) =>
                      handleQuestionChange(index, "cauHoi", e.target.value)
                    }
                  />

                  {q.loaiCauHoi === "tracnghiem" ? (
                    <div
                      style={{
                        marginTop: "10px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                      }}
                    >
                      <input
                        className="form-input"
                        placeholder="Đáp án A"
                        value={q.dapAnA || ""}
                        onChange={(e) =>
                          handleQuestionChange(index, "dapAnA", e.target.value)
                        }
                      />
                      <input
                        className="form-input"
                        placeholder="Đáp án B"
                        value={q.dapAnB || ""}
                        onChange={(e) =>
                          handleQuestionChange(index, "dapAnB", e.target.value)
                        }
                      />
                      <input
                        className="form-input"
                        placeholder="Đáp án C"
                        value={q.dapAnC || ""}
                        onChange={(e) =>
                          handleQuestionChange(index, "dapAnC", e.target.value)
                        }
                      />
                      <input
                        className="form-input"
                        placeholder="Đáp án D"
                        value={q.dapAnD || ""}
                        onChange={(e) =>
                          handleQuestionChange(index, "dapAnD", e.target.value)
                        }
                      />
                      <div style={{ gridColumn: "span 2" }}>
                        <label>Đáp án đúng (A/B/C/D)</label>
                        <input
                          className="form-input"
                          value={q.dapAnDung || ""}
                          onChange={(e) =>
                            handleQuestionChange(
                              index,
                              "dapAnDung",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: "10px" }}>
                      <label>Gợi ý đáp án (Tự luận)</label>
                      <textarea
                        className="form-input"
                        value={q.dapAnDung || ""}
                        onChange={(e) =>
                          handleQuestionChange(
                            index,
                            "dapAnDung",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  )}
                  <div style={{ marginTop: "10px" }}>
                    <label>Điểm</label>
                    <input
                      type="number"
                      className="form-input"
                      value={q.diemCauHoi || 10}
                      onChange={(e) =>
                        handleQuestionChange(
                          index,
                          "diemCauHoi",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn"
                style={{
                  width: "100%",
                  border: "2px dashed #8b5cf6",
                  color: "#8b5cf6",
                  background: "#fff",
                  marginBottom: "20px",
                }}
                onClick={addQuestion}
              >
                + Thêm câu hỏi
              </button>
              <div
                className="form-actions"
                style={{ display: "flex", gap: "10px" }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowQuizModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: "#1e293b", color: "white", flex: 1 }}
                >
                  Lưu bài kiểm tra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
