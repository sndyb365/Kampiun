import { useEffect, useState } from "react";
import AdminLayout from "./adminlayout";

export default function KlasemenAdmin() {
  const [klasemen, setKlasemen] = useState([]);
  const [form, setForm] = useState({ tim: "", poin: "" });
  const [editingId, setEditingId] = useState(null);

  const API_URL = "http://localhost/tamtv/public/admin/api/klasemen.php";

  // Ambil data dari backend
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setKlasemen(data))
      .catch((err) => console.error("Error ambil data:", err));
  }, []);

  // Tambah / Update data
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tim: form.tim,
          poin: parseInt(form.poin, 10),
          id: editingId, // biar PHP tahu ini update kalau ada id
        }),
      });

      const data = await res.json();

      if (editingId) {
        setKlasemen(
          klasemen.map((row) => (row.id === editingId ? data : row))
        );
      } else {
        setKlasemen([...klasemen, data]);
      }

      // Reset form
      setForm({ tim: "", poin: "" });
      setEditingId(null);
    } catch (err) {
      console.error("Error submit:", err);
    }
  };

  // Hapus data
  const handleDelete = async (id) => {
    if (!window.confirm("Yakin mau hapus data ini?")) return;

    try {
      const res = await fetch(API_URL + "?id=" + id, {
        method: "DELETE",
      });

      if (res.ok) {
        setKlasemen(klasemen.filter((row) => row.id !== id));
      }
    } catch (err) {
      console.error("Error delete:", err);
    }
  };

  // Edit data
  const handleEdit = (row) => {
    setForm({ tim: row.tim, poin: row.poin });
    setEditingId(row.id);
  };

  return (
    <AdminLayout>
      <h1>Kelola Klasemen</h1>

      <form onSubmit={handleSubmit} className="form">
        <input
          placeholder="Nama Tim"
          value={form.tim}
          onChange={(e) => setForm({ ...form, tim: e.target.value })}
        />
        <input
          placeholder="Poin"
          type="number"
          value={form.poin}
          onChange={(e) => setForm({ ...form, poin: e.target.value })}
        />
        <button type="submit">
          {editingId ? "Update" : "Tambah"}
        </button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Pos</th>
            <th>Tim</th>
            <th>Poin</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {klasemen.map((row, i) => (
            <tr key={row.id}>
              <td>{i + 1}</td>
              <td>{row.tim}</td>
              <td>{row.poin}</td>
              <td>
                <button onClick={() => handleEdit(row)}>Edit</button>
                <button onClick={() => handleDelete(row.id)}>Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
}
