import React, { useEffect, useState } from "react";
import AddUser from "./AddUser";

const API_URL = "https://lmsnhom10thu6.onrender.com";

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      alert("Không lấy được dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div style={{ maxWidth: 1000, margin: "auto", padding: 20 }}>
      
      <h1 style={{ textAlign: "center" }}>User Management</h1>

      {!showForm && (
        <>
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: "10px 20px",
                background: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              ➕ Thêm User
            </button>
          </div>

          {loading && <p>Đang tải...</p>}

          {!loading && (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                boxShadow: "0 0 10px rgba(0,0,0,0.1)",
              }}
            >
              <thead style={{ background: "#f4f4f4" }}>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {showForm && (
        <AddUser
          fetchUsers={fetchUsers}
          closeForm={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

export default App;