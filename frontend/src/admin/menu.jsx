import { useEffect, useState } from "react";
import AdminLayout from "./adminlayout"; // ⬅️ path diperbaiki

export default function MenuAdmin() {
  const [menu, setMenu] = useState([]);
  const [form, setForm] = useState({ nama: "", link: "" });

  useEffect(() => {
    fetch("http://localhost:5000/api/menu")
      .then((res) => res.json())
      .then((data) => setMenu(data));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://localhost:5000/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then((res) => res.json())
      .then((data) => setMenu([...menu, data]));
  };

  return (
    <AdminLayout>
      <h1>Kelola Menu Footer</h1>
      <form onSubmit={handleSubmit} className="form">
        <input
          placeholder="Nama Menu"
          onChange={(e) => setForm({ ...form, nama: e.target.value })}
        />
        <input
          placeholder="Link"
          onChange={(e) => setForm({ ...form, link: e.target.value })}
        />
        <button type="submit">Tambah</button>
      </form>

      <ul>
        {menu.map((item) => (
          <li key={item.id}>
            {item.nama} - {item.link}
          </li>
        ))}
      </ul>
    </AdminLayout>
  );
}
