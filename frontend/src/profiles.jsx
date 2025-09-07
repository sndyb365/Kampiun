import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./profil.css";
import { supabase } from "./supabaseClient";

export default function Profiles() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState([]);
  const [tab, setTab] = useState("komentar");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);

    await ensureProfileRow(user);
    await fetchProfile(user.id);
    await fetchComments(user.id);
    await fetchLikes(user.id);
  }

  async function ensureProfileRow(user) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existing) {
      const defaultName = user.email ? user.email.split("@")[0] : "user";
      await supabase.from("profiles").insert({
        id: user.id,
        name: defaultName,
        bio: "",
        role: "member",
      });
    }
  }

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!error && data) {
      setProfile(data);
      setNewName(data.name || "");
      setNewBio(data.bio || "");
    }
  }

  async function fetchComments(userId) {
    const { data, error } = await supabase
      .from("comments")
      .select("*, berita:post_id(id, judul)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error) setComments(data || []);
  }

  async function fetchLikes(userId) {
    const { data, error } = await supabase
      .from("likes")
      .select("*, berita:post_id(id, judul)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error) setLikes(data || []);
  }

  const goToBerita = (id) => {
    if (!id) return;
    navigate(`/berita/${id}`);
  };

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function confirmUpload() {
    if (!selectedFile || !user) return;
    const filePath = `${user.id}/${Date.now()}-${selectedFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, selectedFile, { upsert: true });
    if (uploadError) return;

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    setSelectedFile(null);
    setPreviewUrl(null);
    await fetchProfile(user.id);
  }

  async function saveProfile() {
    await supabase.from("profiles")
      .update({ name: newName, bio: newBio })
      .eq("id", user.id);
    setIsEditing(false);
    await fetchProfile(user.id);
  }

  if (!profile) return <p>Loading profil...</p>;

  return (
    <div className="profil-container">
      {/* Avatar */}
      {previewUrl ? (
        <img src={previewUrl} alt="preview" className="profil-avatar" />
      ) : profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="avatar" className="profil-avatar" />
      ) : (
        <div className="profil-avatar">{profile?.name?.[0]?.toUpperCase() || "?"}</div>
      )}
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {selectedFile && <button className="profil-btn" onClick={confirmUpload}>Ubah PP Sekarang</button>}

      {/* Nama & Bio */}
      <h2 className="profil-name">{profile?.name || "User"}</h2>
      <p className="profil-bio">{profile?.bio || "Belum ada bio"}</p>

      {/* Stats */}
      <div className="profil-stats">
        <span><b>{profile?.followers ?? 0}</b> Pengikut</span>
        <span><b>{profile?.following ?? 0}</b> Mengikuti</span>
      </div>

      <button className="profil-btn" onClick={() => setIsEditing(true)}>Ubah Profil</button>

      {/* Modal edit profil */}
      {isEditing && (
        <div className="profil-modal">
          <div className="profil-modal-content">
            <h3>Edit Profil</h3>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nama" />
            <textarea value={newBio} onChange={(e) => setNewBio(e.target.value)} placeholder="Bio" />
            <div className="profil-modal-actions">
              <button onClick={saveProfile}>Simpan</button>
              <button onClick={() => setIsEditing(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="profil-tabs">
        <button className={tab === "komentar" ? "active" : ""} onClick={() => setTab("komentar")}>Komentar</button>
        <button className={tab === "suka" ? "active" : ""} onClick={() => setTab("suka")}>Suka</button>
      </div>

      {/* Grid konten */}
      <div className="profil-content grid">
        {tab === "komentar" &&
          (comments.length > 0 ? (
            comments.map((c) => (
              <div
                key={c.id}
                className="profil-card"
                onClick={() => goToBerita(c.berita?.id)}
                style={{ cursor: c.berita?.id ? "pointer" : "default" }}
              >
                <p>{c.content}</p>
                <small>di: {c.berita?.judul || "Berita dihapus"}<br />{new Date(c.created_at).toLocaleDateString("id-ID")}</small>
              </div>
            ))
          ) : <p>Belum ada komentar.</p>)
        }

        {tab === "suka" &&
          (likes.length > 0 ? (
            likes.map((l) => (
              <div
                key={l.id}
                className="profil-card"
                onClick={() => goToBerita(l.berita?.id)}
                style={{ cursor: l.berita?.id ? "pointer" : "default" }}
              >
                <p>Liked: {l.berita?.judul || "Berita dihapus"}</p>
                <small>{new Date(l.created_at).toLocaleDateString("id-ID")}</small>
              </div>
            ))
          ) : <p>Belum ada like.</p>)
        }
      </div>
    </div>
  );
}
