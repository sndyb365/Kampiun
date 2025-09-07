// src/admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "./admin.css";

export default function AdminDashboard() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isRegister, setIsRegister] = useState(false);
  const [activeTab, setActiveTab] = useState("berita");

  // ======= State =======
  const [berita, setBerita] = useState([]);
  const [judul, setJudul] = useState("");
  const [konten, setKonten] = useState("");
  const [kategori, setKategori] = useState("nasional");
  const [gambarFile, setGambarFile] = useState(null);
  const [editBeritaId, setEditBeritaId] = useState(null);

  const [users, setUsers] = useState([]);

  // ======= AUTH =======
  async function login(e) {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) alert("Login gagal: " + error.message);
  else {
    setSession(data.session);
    setAuthUI({ show: false, register: false });
  }
}

async function register(e) {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) alert("Register gagal: " + error.message);
  else {
    alert("Register berhasil! Cek email untuk konfirmasi sebelum login.");
    setAuthUI({ show: false, register: false });
  }
}

async function logout() {
  await supabase.auth.signOut();
  setSession(null);
  setProfile(null);
}

// === SESSION LISTENER ===
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => setSession(data.session));

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => setSession(session)
  );

  return () => listener.subscription.unsubscribe();
}, []);
  // ======= Fetch Profile & Role =======
  useEffect(() => {
    if (!session) return;

    async function fetchProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (!error && data) setProfile(data);
    }

    fetchProfile();
  }, [session]);

  // ======= Fetch data =======
  useEffect(() => {
    if (session) {
      fetchBerita();
      fetchUsers();
    }
  }, [session]);

  async function fetchBerita() {
    const { data } = await supabase
      .from("berita")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setBerita(data);
  }

  async function fetchUsers() {
    const { data } = await supabase.from("profiles").select("*");
    if (data) setUsers(data);
  }

  // ======= Submit Berita =======
  async function submitBerita(e) {
    e.preventDefault();

    let gambarUrl = null;

    if (gambarFile) {
      const fileName = `${Date.now()}_${gambarFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(fileName, gambarFile);

      if (uploadError) {
        alert("Gagal upload gambar: " + uploadError.message);
        return;
      }

      const { data } = supabase.storage.from("images").getPublicUrl(fileName);
      gambarUrl = data.publicUrl;
    }

    // ambil name user dari profiles
    const { data: profileData } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", session.user.id)
      .single();

    const author = profileData?.name || "Anonim";

    if (editBeritaId) {
      await supabase
        .from("berita")
        .update({
          judul,
          konten,
          kategori,
          ...(gambarUrl && { gambar: gambarUrl }),
          author,
        })
        .eq("id", editBeritaId);
      setEditBeritaId(null);
    } else {
      await supabase.from("berita").insert([
        {
          judul,
          konten,
          kategori,
          gambar: gambarUrl,
          author,
        },
      ]);
    }

    setJudul("");
    setKonten("");
    setKategori("nasional");
    setGambarFile(null);
    fetchBerita();
  }

  async function hapusBerita(id) {
    await supabase.from("berita").delete().eq("id", id);
    fetchBerita();
  }

  function mulaiEditBerita(b) {
    setJudul(b.judul);
    setKonten(b.konten);
    setKategori(b.kategori);
    setEditBeritaId(b.id);
  }

  async function blockUser(id) {
    await supabase.from("profiles").update({ blocked: true }).eq("id", id);
    fetchUsers();
  }

  async function unblockUser(id) {
    await supabase.from("profiles").update({ blocked: false }).eq("id", id);
    fetchUsers();
  }

  // ======= AUTH PAGE =======
  if (!session) {
    return (
      <div className="auth-page">
        <div className="auth-box">
          <h1>{isRegister ? "Register" : "Login"}</h1>
          <form onSubmit={isRegister ? register : login}>
            <input type="email" name="email" placeholder="Email" required />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
            />
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

  // ======= DASHBOARD =======
  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <h2 className="logo">Admin Panel</h2>
        <ul>
          <li>
            <a
              href="#"
              className={activeTab === "berita" ? "active" : ""}
              onClick={() => setActiveTab("berita")}
            >
              BERITA
            </a>
          </li>
          {profile?.role === "admin" && (
            <li>
              <a
                href="#"
                className={activeTab === "users" ? "active" : ""}
                onClick={() => setActiveTab("users")}
              >
                USERS
              </a>
            </li>
          )}
        </ul>
        <button onClick={logout} className="btn-logout">
          Logout
        </button>
      </aside>

      <main className="content">
        {/* === BERITA === */}
        {activeTab === "berita" && (
          <div>
            <h1>Kelola Berita</h1>
            <form onSubmit={submitBerita} className="form-box">
              <input
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Judul"
                required
              />
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
              >
                <option value="nasional">Nasional</option>
                <option value="internasional">Internasional</option>
              </select>
              <textarea
                value={konten}
                onChange={(e) => setKonten(e.target.value)}
                placeholder="Isi berita..."
                rows={15}
                className="konten-textarea"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setGambarFile(e.target.files[0])}
              />
              <button type="submit">
                {editBeritaId ? "Update" : "Tambah"} Berita
              </button>
            </form>

            <table>
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Author</th>
                  <th>Kategori</th>
                  <th>Gambar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {berita.map((b) => (
                  <tr key={b.id}>
                    <td>{b.judul}</td>
                    <td>{b.author}</td>
                    <td>{b.kategori}</td>
                    <td>
                      {b.gambar && (
                        <img
                          src={b.gambar}
                          alt="thumb"
                          style={{ width: "60px", borderRadius: "4px" }}
                        />
                      )}
                    </td>
                    <td>
                      <button onClick={() => mulaiEditBerita(b)}>Edit</button>
                      <button
                        onClick={() => hapusBerita(b.id)}
                        className="btn-delete"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* === USERS (hanya admin) === */}
        {activeTab === "users" && profile?.role === "admin" && (
          <div>
            <h1>Kelola Users</h1>
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.name || "-"}</td>
                    <td>{u.role}</td>
                    <td>{u.blocked ? "Blocked" : "Active"}</td>
                    <td>
                      {u.blocked ? (
                        <button onClick={() => unblockUser(u.id)}>
                          Unblock
                        </button>
                      ) : (
                        <button onClick={() => blockUser(u.id)}>Block</button>
                      )}
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
