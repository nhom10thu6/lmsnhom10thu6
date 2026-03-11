import React, { useEffect, useState } from 'react'

function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list'); // 'list' là hiện bảng, 'edit' là hiện form sửa
  const [editingId, setEditingId] = useState(null) 
  const [editForm, setEditForm] = useState({ id: '', name: '', email: '', phone: '' })

  const fetchData = () => {
    fetch('https://lmsnhom10thu6.onrender.com/api/test')
    //fetch('http://localhost:5000/api/test') 
      .then(res => res.json())
      .then(result => {
        setData(result)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchData()
  }, [])

  
  const handleEditClick = (item) => {
    setEditingId(item.id)
    setEditForm(item) // Lưu toàn bộ thông tin item vào form
    setView('edit')   // Bấm nút là chuyển sang giao diện sửa liền
  }

  // ✅ Hàm này giúp bạn gõ được chữ vào ô Input
  const handleInputChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }

  const handleUpdate = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/test/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          phone: Number(editForm.phone)
        })
      })

      if (response.ok) {
        alert("Cập nhật thành công! ✅")
        setEditingId(null) 
        setView('list') // Sửa xong quay lại trang danh sách
        fetchData() 
      }
    } catch (err) {
      console.error("Lỗi:", err)
    }
  }

  // --- QUYẾT ĐỊNH HIỂN THỊ GIAO DIỆN NÀO ---
  
  // 1. Nếu view là 'edit', trả về giao diện trang sửa
  if (view === 'edit') {
    return (
      <div style={{ padding: 20 }}>
        <h1>Chỉnh sửa thông tin</h1>
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(editForm.id); }} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
          <p>Đang sửa ID: <b>{editForm.id}</b></p>
          
          <label>Tên:</label>
          <input 
            name="name"
            value={editForm.name} 
            onChange={handleInputChange} 
          />

          <label>Email:</label>
          <input 
            name="email"
            value={editForm.email} 
            onChange={handleInputChange} 
          />

          <label>Điện thoại:</label>
          <input 
            name="phone"
            value={editForm.phone} 
            onChange={handleInputChange} 
          />

          <div style={{ marginTop: '10px' }}>
            <button type="submit" style={{ background: 'green', color: 'white', marginRight: '10px', padding: '8px' }}>Lưu thay đổi</button>
            <button type="button" onClick={() => setView('list')} style={{ padding: '8px' }}>Quay lại</button>
          </div>
        </form>
      </div>
    )
  }

  // 2. Mặc định trả về trang danh sách (Nếu không phải đang sửa)
  return (
    <div style={{ padding: 20 }}>
      <h1>Danh sách test</h1>

      {loading && <p>Đang tải...</p>}

      {!loading && data.length === 0 && (
        <p>Không có dữ liệu</p>
      )}

      {!loading && data.length > 0 && (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td>{item.phone}</td>
                <td>
                  <button onClick={() => handleEditClick(item)}>Sửa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default App