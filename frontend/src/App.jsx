import React, { useEffect, useState } from 'react'

function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')
  const [editForm, setEditForm] = useState({ id: '', name: '', email: '', phone: '' })

  const [searchId, setSearchId] = useState('')
  const [foundUser, setFoundUser] = useState(null)
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)

  const fetchData = () => {
    fetch('http://localhost:5000/api/test')
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

  const handleFindUser = () => {
    if (!searchId) return
    setSearching(true)
    setFoundUser(null)
    setSearchError('')
    fetch(`http://localhost:5000/api/findUser?id=${searchId}`)
      .then(res => {
        if (!res.ok) return res.json().then(e => { throw new Error(e.error) })
        return res.json()
      })
      .then(user => {
        setFoundUser(user)
        setSearching(false)
      })
      .catch(err => {
        setSearchError(err.message)
        setSearching(false)
      })
  }

  const handleEditClick = (item) => {
    setEditForm(item)
    setView('edit')
  }

  const handleInputChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }

  const handleUpdate = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/test/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, phone: Number(editForm.phone) })
      })
      if (response.ok) {
        alert('Cập nhật thành công! ✅')
        setView('list')
        fetchData()
      }
    } catch (err) {
      console.error('Lỗi:', err)
    }
  }

  if (view === 'edit') {
    return (
      <div style={{ padding: 20 }}>
        <h1>Chỉnh sửa thông tin</h1>
        <form
          onSubmit={(e) => { e.preventDefault(); handleUpdate(editForm.id) }}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}
        >
          <p>Đang sửa ID: <b>{editForm.id}</b></p>

          <label>Tên:</label>
          <input name="name" value={editForm.name} onChange={handleInputChange} />

          <label>Email:</label>
          <input name="email" value={editForm.email} onChange={handleInputChange} />

          <label>Điện thoại:</label>
          <input name="phone" value={editForm.phone} onChange={handleInputChange} />

          <div style={{ marginTop: '10px' }}>
            <button type="submit" style={{ background: 'green', color: 'white', marginRight: '10px', padding: '8px' }}>
              Lưu thay đổi
            </button>
            <button type="button" onClick={() => setView('list')} style={{ padding: '8px' }}>
              Quay lại
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>

      <h2>Tìm user theo ID</h2>
      <div style={{ marginBottom: 16 }}>
        <input
          type="number"
          placeholder="Nhập ID"
          value={searchId}
          onChange={e => setSearchId(e.target.value)}
          style={{ padding: '6px 10px', marginRight: 8 }}
        />
        <button onClick={handleFindUser} disabled={searching} style={{ padding: '6px 14px' }}>
          {searching ? 'Đang tìm...' : 'Tìm kiếm'}
        </button>
      </div>

      {searchError && <p style={{ color: 'red' }}>Lỗi: {searchError}</p>}

      {foundUser && (
        <table border="1" cellPadding="8" style={{ marginBottom: 24 }}>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>{foundUser.id}</td>
              <td>{foundUser.name}</td>
              <td>{foundUser.email}</td>
              <td>{foundUser.phone}</td>
            </tr>
          </tbody>
        </table>
      )}

      <h1>Danh sách test</h1>

      {loading && <p>Đang tải...</p>}

      {!loading && data.length === 0 && <p>Không có dữ liệu</p>}

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
