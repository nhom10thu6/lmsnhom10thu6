import React, { useEffect, useState } from "react";

// LOCAL
// const API_URL = "https://lmsnhom10thu6.onrender.com"

// RENDER
const API_URL = "https://lmsnhom10thu6.onrender.com"

function App() {

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [editId, setEditId] = useState(null)

  const [searchId, setSearchId] = useState('')
  const [foundUser, setFoundUser] = useState(null)
  const [searchError, setSearchError] = useState('')

  /* =======================
  GET ALL USERS
  ======================= */
  const fetchData = () => {
    fetch(`${API_URL}/users`)
      .then(res => res.json())
      .then(result => {
        setData(result)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchData()
  }, [])

  /* =======================
  CREATE USER
  ======================= */
  const addUser = () => {

    fetch(`${API_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: parseInt(id),
        name,
        email,
        phone: parseInt(phone)
      })
    })
      .then(res => res.json())
      .then(() => {
        fetchData()
        clearForm()
      })
  }

  /* =======================
  UPDATE USER
  ======================= */
  const updateUser = () => {

    fetch(`${API_URL}/api/users/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        phone: parseInt(phone)
      })
    })
      .then(res => res.json())
      .then(() => {
        fetchData()
        clearForm()
      })
  }

  /* =======================
  DELETE USER
  ======================= */
  const deleteUser = (id) => {

    fetch(`${API_URL}/api/users/${id}`, {
      method: "DELETE"
    })
      .then(() => fetchData())

  }

  /* =======================
  EDIT USER
  ======================= */
  const editUser = (user) => {

    setEditId(user.id)
    setId(user.id)
    setName(user.name)
    setEmail(user.email)
    setPhone(user.phone)

  }

  /* =======================
  CLEAR FORM
  ======================= */
  const clearForm = () => {
    setEditId(null)
    setId('')
    setName('')
    setEmail('')
    setPhone('')
  }

  /* =======================
  FIND USER
  ======================= */
  const handleFindUser = () => {

    // fetch(`${API_URL}/api/findUser?id=${searchId}`)
    fetch(`${API_URL}/users/${searchId}`)
      .then(res => {
        if (!res.ok) throw new Error("User not found")
        return res.json()
      })
      .then(user => {
        setFoundUser(user)
        setSearchError('')
      })
      .catch(err => {
        setSearchError(err.message)
        setFoundUser(null)
      })

  }

  return (

    <div style={{ padding: 20 }}>

      <h1>CRUD User</h1>

      {/* =======================
ADD / UPDATE USER
======================= */}

      <h3>{editId ? "Update User" : "Add User"}</h3>

      <input
        placeholder="Id"
        value={id}
        disabled={editId !== null}
        onChange={(e) => setId(e.target.value)}
      />

      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      {editId !== null ? (
        <button onClick={updateUser}>Update</button>
      ) : (
        <button onClick={addUser}>Add</button>
      )}

      {editId && (
        <button onClick={clearForm} style={{ marginLeft: 10 }}>
          Cancel
        </button>
      )}

      {/* =======================
SEARCH USER
======================= */}

      <h3>Tìm user theo ID</h3>

      <input
        placeholder="Nhập ID"
        value={searchId}
        onChange={(e) => setSearchId(e.target.value)}
      />

      <button onClick={handleFindUser}>Search</button>

      {searchError && <p style={{ color: "red" }}>{searchError}</p>}

      {foundUser && (
        <div>
          <p>ID: {foundUser.id}</p>
          <p>Name: {foundUser.name}</p>
          <p>Email: {foundUser.email}</p>
          <p>Phone: {foundUser.phone}</p>
        </div>
      )}

      {/* =======================
USER LIST
======================= */}

      <h3>Danh sách User</h3>

      {loading && <p>Loading...</p>}

      <table border="1">

        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {data.map(user => (

            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.phone}</td>

              <td>

                <button onClick={() => editUser(user)}>
                  Edit
                </button>

                <button
                  onClick={() => deleteUser(user.id)}
                  style={{ marginLeft: 5 }}
                >
                  Delete
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )

}

export default App