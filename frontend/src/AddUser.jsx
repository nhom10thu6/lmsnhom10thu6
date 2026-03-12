import React, { useState } from "react";

const API_URL = "https://lmsnhom10thu6.onrender.com";

function AddUser({ fetchUsers, closeForm }) {

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    phone: ""
  });

  const [loading, setLoading] = useState(false);

  // nhập input
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });
  };

  // submit form
  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);

    try {

      const res = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: Number(formData.id),
          name: formData.name,
          email: formData.email,
          phone: formData.phone ? Number(formData.phone) : null
        })
      });

      // nếu API lỗi
      if (!res.ok) {

        const text = await res.text();
        console.error("Server response:", text);

        alert("Thêm user thất bại");
        return;
      }

      const result = await res.json();

      console.log("User added:", result);

      alert("Thêm user thành công!");

      setFormData({
        id: "",
        name: "",
        email: "",
        phone: ""
      });

      fetchUsers();

      closeForm();

    } catch (err) {

      console.error("Fetch error:", err);

      alert("Không kết nối được server");

    } finally {

      setLoading(false);

    }

  };

  return (

    <div
      style={{
        maxWidth: 500,
        margin: "auto",
        padding: 20,
        border: "1px solid #ddd",
        borderRadius: 10,
        boxShadow: "0 0 10px rgba(0,0,0,0.1)"
      }}
    >

      <h2 style={{ textAlign: "center" }}>Thêm User</h2>

      <form onSubmit={handleSubmit}>

        <input
          name="id"
          placeholder="ID"
          value={formData.id}
          onChange={handleChange}
          required
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10
          }}
        />

        <input
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10
          }}
        />

        <input
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10
          }}
        />

        <input
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 20
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 20px",
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: 5,
            marginRight: 10,
            cursor: "pointer"
          }}
        >
          {loading ? "Đang thêm..." : "Thêm User"}
        </button>

        <button
          type="button"
          onClick={closeForm}
          style={{
            padding: "10px 20px",
            background: "#ccc",
            border: "none",
            borderRadius: 5,
            cursor: "pointer"
          }}
        >
          Huỷ
        </button>

      </form>

    </div>
  );
}

export default AddUser;