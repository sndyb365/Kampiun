import { useEffect, useState } from "react";
import AdminLayout from "./adminlayout";

export default function HeadlinesAdmin() {
  const [headlines, setHeadlines] = useState([]);
  const [judul, setJudul] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

  // Dummy fetch data (nanti ganti API fetch)
  useEffect(() => {
    setHeadlines([
      { id: 1, judul: "Headlines Pertama" },
      { id: 2, judul: "Headlines Kedua" },
    ]);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingIndex !== null) {
      // Update
      const newData = [...headlines];
      newData[editingIndex].judul = judul;
      setHeadlines(newData);
      setEditingIndex(null);
    } else {
      // Create
      setHeadlines([...headlines, { id: Date.now(), judul }]);
    }
    setJudul("");
  };

  const handleEdit = (index) => {
    setJudul(headlines[index].judul);
    setEditingIndex(index);
  };

  const handleDelete = (id) => {
    setHeadlines(headlines.filter((h) => h.id !== id));
  };

  return (
    <AdminLayout>
      <h1>Manajemen Headlines</h1>

      {/* Form Tambah/Edit */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          placeholder="Judul Headlines"
          required
          style={{ padding: "8px", width: "300px", marginRight: "10px" }}
        />
        <button type="submit">
          {editingIndex !== null ? "Update" : "Tambah"}
        </button>
      </form>

      {/* Tabel Headlines */}
      <table border="1" cellPadding="10" cellSpacing="0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Judul</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {headlines.map((item, index) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.judul}</td>
              <td>
                <button onClick={() => handleEdit(index)}>Edit</button>
                <button onClick={() => handleDelete(item.id)}>Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
}
