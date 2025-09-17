// src/admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./admin.css";

export default function AdminDashboard() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isRegister, setIsRegister] = useState(false);
  const [activeTab, setActiveTab] = useState("berita");

  // ===== STATE BERITA =====
  const [berita, setBerita] = useState([]);
  const [kontenUser, setKontenUser] = useState([]);
  const [judul, setJudul] = useState("");
  const [konten, setKonten] = useState("");
  const [kategori, setKategori] = useState("nasional");
  const [gambarFile, setGambarFile] = useState(null);
  const [editBeritaId, setEditBeritaId] = useState(null);

  // ===== STATE USERS =====
  const [users, setUsers] = useState([]);

  // ===== STATE KLASEMEN =====
  const [klasemen, setKlasemen] = useState([]);
  const [tim, setTim] = useState("");
  const [poin, setPoin] = useState("");
  const [liga, setLiga] = useState("");
  const [editKlasemenId, setEditKlasemenId] = useState(null);

  const [daftarLiga, setDaftarLiga] = useState([]);
  const [ligaBaru, setLigaBaru] = useState("");

  // ===== AUTH =====
  const login = async (e) => {
    e.preventDefault();
    const { email, password } = e.target;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (error) alert(error.message);
    else setSession(data.session);
  };

  const register = async (e) => {
    e.preventDefault();
    const { email, password } = e.target;
    const { error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    });
    if (error) alert(error.message);
    else {
      alert("Register berhasil, cek email konfirmasi.");
      setIsRegister(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  // ===== EFFECTS =====
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, s) => setSession(s)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      if (data) setProfile(data);
    })();
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchBerita();
      fetchKontenUser();
      fetchUsers();
      fetchKlasemen();
      fetchLiga();
    }
  }, [session]);

  // ===== FETCH =====
  const fetchBerita = async () => {
    const { data } = await supabase
      .from("berita")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (data) setBerita(data);
  };

  const fetchKontenUser = async () => {
    const { data } = await supabase
      .from("berita")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setKontenUser(data);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*");
    if (data) setUsers(data);
  };

  const fetchKlasemen = async () => {
    const { data } = await supabase
      .from("klasemen")
      .select("*")
      .order("poin", { ascending: false });
    if (data) setKlasemen(data);
  };

  const fetchLiga = async () => {
    const { data } = await supabase.from("klasemen").select("liga");
    if (data) {
      const uniqueLiga = [...new Set(data.map(item => item.liga))];
      setDaftarLiga(uniqueLiga.map((l, i) => ({ id: i, nama: l })));
      if (!liga && uniqueLiga.length) setLiga(uniqueLiga[0]);
    }
  };

  // ===== CRUD BERITA =====
  const submitBerita = async (e) => {
    e.preventDefault();
    let gambarUrl = null;
    if (gambarFile) {
      const fileName = `${Date.now()}_${gambarFile.name}`;
      const { error } = await supabase.storage.from("images").upload(fileName, gambarFile);
      if (error) return alert("Upload gagal: " + error.message);
      gambarUrl = supabase.storage.from("images").getPublicUrl(fileName).data.publicUrl;
    }
    const { data: pd } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", session.user.id)
      .single();
    const author = pd?.name || "Anonim";

    if (editBeritaId) {
      await supabase
        .from("berita")
        .update({ judul, konten, kategori, ...(gambarUrl && { gambar: gambarUrl }), author })
        .eq("id", editBeritaId);
    } else {
      await supabase
        .from("berita")
        .insert([{ judul, konten, kategori, gambar: gambarUrl, author, status: "published" }]);
    }

    setJudul(""); setKonten(""); setKategori("nasional"); setGambarFile(null); setEditBeritaId(null);
    fetchBerita();
  };

  // ===== CRUD USERS =====
  const toggleBlock = async (id, status) => {
    await supabase.from("profiles").update({ blocked: status }).eq("id", id);
    fetchUsers();
  };

  // ===== CRUD KLASEMEN =====
  const submitKlasemen = async (e) => {
    e.preventDefault();
    if (!liga) return alert("Pilih liga!");
    if (editKlasemenId) {
      await supabase
        .from("klasemen")
        .update({ tim, poin: +poin, liga })
        .eq("id", editKlasemenId);
    } else {
      await supabase
        .from("klasemen")
        .insert([{ tim, poin: +poin, liga }]);
    }
    setTim(""); setPoin(""); setEditKlasemenId(null);
    fetchKlasemen();
  };

  const tambahLiga = () => {
    const trimmed = ligaBaru.trim();
    if (!trimmed) return;
    setDaftarLiga(prev => [...prev, { id: prev.length, nama: trimmed }]);
    setLiga(trimmed);
    setLigaBaru("");
  };

  // ===== KONTEN USER ACTION =====
  const approveKonten = async (id) => {
    await supabase.from("berita")
      .update({ status: "published", revisi_catatan: null })
      .eq("id", id);
    fetchKontenUser();
    fetchBerita();
  };

  const revisiKonten = async (id, catatan) => {
    await supabase.from("berita")
      .update({ status: "revisi", revisi_catatan: catatan })
      .eq("id", id);
    fetchKontenUser();
  };

  // ===== AUTH PAGE =====
  if (!session) {
    return (
      <div className="auth-page">
        <div className="auth-box">
          <h1>{isRegister ? "Register" : "Login"}</h1>
          <form onSubmit={isRegister ? register : login}>
            <input type="email" name="email" placeholder="Email" required />
            <input type="password" name="password" placeholder="Password" required />
            <button type="submit">{isRegister ? "Daftar" : "Login"}</button>
          </form>
          <p>
            {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
            <a href="#" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? "Login di sini" : "Daftar di sini"}
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ===== DASHBOARD =====
  return (
   <div className="admin-layout">
  <button 
    className="menu-toggle" 
    onClick={() => document.querySelector(".admin-layout").classList.toggle("sidebar-open")}
  >
    ☰
  </button>

  <aside className="sidebar">
    <h2 className="logo">Admin Panel</h2>
    <ul>
      {["berita", "konten", "users", "klasemen"].map((t) => (
        <li key={t}>
          <a
            href="#"
            className={activeTab === t ? "active" : ""}
            onClick={(e) => { 
              e.preventDefault(); 
              setActiveTab(t); 
              document.querySelector(".admin-layout").classList.remove("sidebar-open"); // tutup otomatis
            }}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </a>
        </li>
      ))}
    </ul>
    <button onClick={logout} className="btn-logout">Logout</button>
  </aside>

  {/* Overlay untuk mobile */}
  <div 
    className="overlay" 
    onClick={() => document.querySelector(".admin-layout").classList.remove("sidebar-open")}
  />

      <main className="content">

        {/* === BERITA === */}
        {activeTab === "berita" && (
          <div>
            <h1>Kelola Berita</h1>
            <form onSubmit={submitBerita} className="form-box">
              <input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Judul" required />
              <select value={kategori} onChange={(e) => setKategori(e.target.value)}>
                <option value="nasional">Nasional</option>
                <option value="internasional">Internasional</option>
              </select>
              <textarea value={konten} onChange={(e) => setKonten(e.target.value)} placeholder="Isi berita..." rows={10} />
              <input type="file" accept="image/*" onChange={(e) => setGambarFile(e.target.files[0])} />
              <button type="submit">{editBeritaId ? "Update" : "Tambah"} Berita</button>
            </form>
            <table>
              <thead><tr><th>Judul</th><th>Author</th><th>Kategori</th><th>Gambar</th><th>Aksi</th></tr></thead>
              <tbody>
                {berita.map((b) => (
                  <tr key={b.id}>
                    <td>{b.judul}</td><td>{b.author}</td><td>{b.kategori}</td>
                    <td>{b.gambar && <img src={b.gambar} alt="thumb" style={{ width: "60px" }} />}</td>
                    <td>
                      <button onClick={() => { setJudul(b.judul); setKonten(b.konten); setKategori(b.kategori); setEditBeritaId(b.id); }}>Edit</button>
                      <button onClick={() => supabase.from("berita").delete().eq("id", b.id).then(fetchBerita)} className="btn-delete">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* === KONTEN USER === */}
        {activeTab === "konten" && (
          <div>
            <h1>Konten User</h1>
            <table>
              <thead>
                <tr>
                  <th>Judul</th><th>Author</th><th>Status</th><th>Catatan Revisi</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {kontenUser.map((c) => (
                  <tr key={c.id}>
                    <td>{c.judul}</td>
                    <td>{c.author}</td>
                    <td>{c.status}</td>
                    <td>{c.revisi_catatan || "-"}</td>
                    <td>
                      <button onClick={() => approveKonten(c.id)}>Approve</button>
                      <button onClick={() => {
                        const catatan = prompt("Masukkan catatan revisi:");
                        if (catatan) revisiKonten(c.id, catatan);
                      }}>Revisi</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* === USERS === */}
        {activeTab === "users" && (
          <div>
            <h1>Kelola Users</h1>
            <table>
              <thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td><td>{u.name || "-"}</td><td>{u.role}</td>
                    <td>{u.blocked ? "Blocked" : "Active"}</td>
                    <td>
                      <button onClick={() => toggleBlock(u.id, !u.blocked)}>
                        {u.blocked ? "Unblock" : "Block"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* === KLASEMEN === */}
        {activeTab === "klasemen" && (
          <div>
            <h1>Kelola Klasemen</h1>
            <form onSubmit={submitKlasemen} className="form-box">
              <input value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Nama Tim" required />
              <input type="number" value={poin} onChange={(e) => setPoin(e.target.value)} placeholder="Poin" required />
              <select value={liga} onChange={(e) => setLiga(e.target.value)}>
                {daftarLiga.map((l) => (
                  <option key={l.id} value={l.nama}>{l.nama}</option>
                ))}
              </select>
              <div className="input-liga-baru">
                <input value={ligaBaru} onChange={(e) => setLigaBaru(e.target.value)} placeholder="Tambah liga baru..." />
                <button type="button" onClick={tambahLiga}>+ Liga</button>
              </div>
              <button type="submit">{editKlasemenId ? "Update" : "Tambah"} Klasemen</button>
            </form>
            <table>
              <thead><tr><th>Tim</th><th>Poin</th><th>Liga</th><th>Aksi</th></tr></thead>
              <tbody>
                {klasemen.map((k) => (
                  <tr key={k.id}>
                    <td>{k.tim}</td><td>{k.poin}</td><td>{k.liga}</td>
                    <td>
                      <button onClick={() => { setTim(k.tim); setPoin(k.poin); setLiga(k.liga); setEditKlasemenId(k.id); }} className="btn-edit">Edit</button>
                      <button onClick={() => supabase.from("klasemen").delete().eq("id", k.id).then(fetchKlasemen)} className="btn-delete">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>
    </div>
  );
}
