import React, { useEffect, useState } from 'react'

function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const [searchId, setSearchId] = useState('')
  const [foundUser, setFoundUser] = useState(null)
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetch('https://lmsnhom10thu6.onrender.com/api/users')
    // fetch('http://localhost:5000/api/users')
      .then(res => res.json())
      .then(result => {
        setData(result)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const handleFindUser = () => {
    if (!searchId) return
    setSearching(true)
    setFoundUser(null)
    setSearchError('')
    fetch(`https://lmsnhom10thu6.onrender.com/api/findUser?id=${searchId}`)
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

      {!loading && data.length === 0 && (
        <p>Không có dữ liệu</p>
      )}

      {!loading && data.length > 0 && (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td>{item.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default App