import { useEffect, useState } from "react";
import "./index.css";
import Profil from "./profiles";
import NewsDetail from "./NewsDetail";
import AuthorProfile from "./AuthorProfile";
import { supabase } from "./supabaseClient";

export default function App() {
  const [data, setData] = useState({ nasional: [], internasional: [], klasemen: [], headlines: [], menu: [] });
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState(localStorage.getItem("page") || "home");
  const [selectedNewsId, setSelectedNewsId] = useState(localStorage.getItem("selectedNewsId") || null);
  const [selectedAuthorId, setSelectedAuthorId] = useState(null);
  const [isRegister, setIsRegister] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [popupMessage, setPopupMessage] = useState(""); 
  const [showMobileMenu, setShowMobileMenu] = useState(false); // hamburger

  // === AUTH HANDLER ===
  const handleAuth = async (e, type) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password?.value;
    let result, error;

    if (type === "login") ({ data: result, error } = await supabase.auth.signInWithPassword({ email, password }));
    if (type === "register") ({ error } = await supabase.auth.signUp({ email, password }));
    if (type === "reset") ({ error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: window.location.origin }));

    if (error) setErrorMessage(type === "reset" ? "Gagal kirim email: " + error.message : "Email/password salah bro.");
    else {
      setErrorMessage(type === "register" ? "Register berhasil! Cek email." : type === "reset" ? "Link reset terkirim!" : "");
      if (type === "login" && result?.session) {
        setSession(result.session);
        setShowAuthForm(false);
      }
      setShowReset(false);
      setResetEmail("");
    }
  };

  // === SESSION LISTENER & FETCH PROFILE ===
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return setProfile(null);
    supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data, error }) => !error && setProfile(data));
  }, [session]);

  // === FETCH DATA ===
  useEffect(() => {
    (async () => {
      const fetch = (t, s) => supabase.from(t).select("*").order(...s);
      const [berita, klasemen, menu] = await Promise.all([
        fetch("berita", ["created_at", { ascending: false }]),
        fetch("klasemen", ["poin", { ascending: false }]),
        fetch("menu", ["urutan", { ascending: true }]),
      ]);
      const news = berita.data || [];
      setData({
        nasional: news.filter((b) => b.kategori === "nasional"),
        internasional: news.filter((b) => b.kategori === "internasional"),
        klasemen: klasemen.data || [],
        headlines: [...news].sort((a, b) => (b.views || 0) - (a.views || 0) || new Date(b.created_at) - new Date(a.created_at)).slice(0, 10),
        menu: menu.data || [],
      });
    })();
  }, [session]);

  const logout = async () => { 
    await supabase.auth.signOut(); 
    setSession(null); 
    setProfile(null); 
    setPage("home"); 
    localStorage.removeItem("page"); 
    localStorage.removeItem("selectedNewsId");
  };

  useEffect(() => localStorage.setItem("page", page), [page]);
  useEffect(() => { 
    if(selectedNewsId) localStorage.setItem("selectedNewsId", selectedNewsId); 
    else localStorage.removeItem("selectedNewsId");
  }, [selectedNewsId]);

  // === COMPONENTS ===
  const Navbar = ({ onNavigate }) => (
    <header className="navbar">
      <div className="navbar-logo" onClick={() => onNavigate("home")} style={{ cursor: "pointer" }}>
        <h1>Kampiun</h1>
      </div>

      {/* Menu untuk desktop */}
      <nav className="navbar-menu">
        {["HOME","NASIONAL","INTERNASIONAL"].map((m,i) => (
          <a 
            key={i} 
            href="#" 
            onClick={e => { 
              e.preventDefault(); 
              const lower = m.toLowerCase();
              if(lower === "nasional") onNavigate("nasional");
              else if(lower === "internasional") onNavigate("internasional");
              else onNavigate("home");
            }}
          >
            {m}
          </a>
        ))}
      </nav>

      {/* Tombol hamburger untuk mobile */}
      <button 
        className="hamburger" 
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        ☰
      </button>

      {/* Menu versi mobile */}
      {showMobileMenu && (
        <div className="mobile-menu">
          {["HOME","NASIONAL","INTERNASIONAL"].map((m,i) => (
            <a 
              key={i} 
              href="#" 
              onClick={e => { 
                e.preventDefault(); 
                setShowMobileMenu(false);
                const lower = m.toLowerCase();
                if(lower === "nasional") onNavigate("nasional");
                else if(lower === "internasional") onNavigate("internasional");
                else onNavigate("home");
              }}
            >
              {m}
            </a>
          ))}
        </div>
      )}

      {/* Profile tetap */}
      <div className="profile-container">
        <img 
          src={profile?.avatar_url || "https://cdn-icons-png.flaticon.com/512/847/847969.png"} 
          alt="profile" 
          className="profile-pic" 
          onClick={() => setShowDropdown(!showDropdown)} 
        />
        {showDropdown && <div className="profile-dropdown">
          {!session ? 
            <button className="dropdown-btn" onClick={() => { setShowReset(false); setShowAuthForm(true); }}>
              Login / Register
            </button>
            :
            <>
              <button className="dropdown-btn" onClick={() => onNavigate("profil")}>Lihat Profil</button>
              <button className="dropdown-btn" onClick={() => setPage("unggah")}>Unggah Tulisan</button>
              <button className="dropdown-btn" onClick={() => setPage("tulisan-saya")}>Lihat Tulisan Saya</button>
              <button className="dropdown-btn logout" onClick={logout}>Logout</button>
            </>
          }
        </div>}
      </div>
    </header>
  );


  const BeritaCard = ({ b, variant }) => (
    <div className={`berita-card ${variant}`} onClick={() => { setSelectedNewsId(b.id); setPage("newsdetail"); }}>
      <div className="thumb"><img src={b.gambar || "https://via.placeholder.com/250"} alt={b.judul} /></div>
      <div className="info">
        <h3>{b.judul}</h3>
        <p className="meta">
          Oleh <b className="author-link" style={{cursor:"pointer",color:"blue"}} 
            onClick={e=>{e.stopPropagation(); if(b.author_id) setSelectedAuthorId(b.author_id);}}>
            {b.author || "Unknown"}
          </b> – {new Date(b.created_at).toLocaleDateString("id-ID",{year:"numeric",month:"long",day:"numeric"})}
        </p>
      </div>
    </div>
  );

  const TabelKlasemen = ({ liga }) => (
    <div className="klasemen">
      <h3>Klasemen Liga {liga}</h3>
      <table>
        <thead><tr><th>Pos</th><th>Tim</th><th>Poin</th></tr></thead>
        <tbody>{data.klasemen.filter(r => r.liga === liga).map((r,i) => <tr key={r.id}><td>{i+1}</td><td>{r.tim}</td><td>{r.poin}</td></tr>)}</tbody>
      </table>
    </div>
  );

  const Popup = ({ message, onClose }) => (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup" onClick={e => e.stopPropagation()}>
        <p>{message}</p>
        <button className="ok-btn" onClick={onClose}>OKE</button>
      </div>
    </div>
  );

  // === RENDER LOGIC ===
  if (selectedAuthorId) 
    return (
      <div>
        <Navbar onNavigate={setPage} />
        <main className="container">
          <AuthorProfile 
            authorId={selectedAuthorId} 
            onBack={() => setSelectedAuthorId(null)}
            onSelectNews={(id) => { 
              setSelectedNewsId(id); 
              setPage("newsdetail"); 
            }}
          />
        </main>
      </div>
    );

  if (showAuthForm && !session) return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>{showReset?"Reset Password":isRegister?"Register":"Login"}</h1>
        <form onSubmit={e=>handleAuth(e, showReset?"reset":isRegister?"register":"login")}>
          <input type="email" name="email" placeholder="Email" value={showReset?resetEmail:undefined} onChange={e=>setResetEmail(e.target.value)} required />
          {!showReset && <input type="password" name="password" placeholder="Password" required />}
          <button type="submit">{showReset?"Kirim Link":isRegister?"Daftar":"Login"}</button>
          {showReset && <button type="button" onClick={()=>setShowReset(false)}>← Kembali</button>}
        </form>
        {!showReset && <p className="forgot-password"><a href="#" onClick={()=>setShowReset(true)}>Lupa Password?</a></p>}
        {errorMessage && <Popup message={errorMessage} onClose={()=>setErrorMessage("")}/>}
        <p>{isRegister?"Sudah punya akun?":"Belum punya akun?"} <a href="#" onClick={()=>{setIsRegister(!isRegister); setErrorMessage(""); setShowReset(false)}}>{isRegister?"Login di sini":"Daftar di sini"}</a></p>
      </div>
    </div>
  );

  if (page === "profil") return <div><Navbar onNavigate={setPage}/><main className="container"><button className="back-btn" onClick={()=>setPage("home")}>← Kembali</button><Profil /></main></div>;

  if (page === "unggah") return (
    <div>
      <Navbar onNavigate={setPage} />
      <main className="container">
        <button className="back-btn" onClick={()=>setPage("home")}>← Kembali</button>
        <div className="form-box">
          <h2>Unggah Tulisan</h2>
          <form
            onSubmit={async e => {
              e.preventDefault();
              if (!profile?.name) { setPopupMessage("Profil belum lengkap"); return; }

              const judul = e.target.judul.value;
              const isi = e.target.isi.value;
              const kategori = e.target.kategori.value;
              const file = e.target.gambar.files[0];

              let imageUrl = null;
              if(file){
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const { data: uploadData, error: uploadError } = await supabase.storage.from("images").upload(fileName, file);
                if(uploadError){ setPopupMessage("Gagal upload gambar: " + uploadError.message); return; }
                imageUrl = supabase.storage.from("images").getPublicUrl(fileName).data.publicUrl;
              }

              const { data, error } = await supabase.from("berita").insert([{
                judul,
                konten: isi,
                kategori,
                gambar: imageUrl,
                author_id: session.user.id,
                author: profile.name
              }]).select();

              if(!error && data && data.length > 0){
                setSelectedNewsId(data[0].id);
                setPopupMessage("Tulisan berhasil diunggah!");
                e.target.reset();
              } else if(error) setPopupMessage("Gagal mengunggah: " + error.message);
              else setPopupMessage("Gagal mengunggah: Data kosong");
            }}
          >
            <input name="judul" placeholder="Judul" required />
            <select name="kategori" required>
              <option value="">-- Pilih Kategori --</option>
              <option value="nasional">Nasional</option>
              <option value="internasional">Internasional</option>
            </select>
            <textarea name="isi" placeholder="Isi tulisan" rows="10" required />
            <input type="file" name="gambar" accept="image/*" />
            <button type="submit">Unggah</button>
          </form>
        </div>
      </main>
    </div>
  );

  if (page === "tulisan-saya") return (
    <div>
      <Navbar onNavigate={setPage}/>
      <main className="container">
        <button className="back-btn" onClick={()=>setPage("home")}>← Kembali</button>
        <h2>Tulisan Saya</h2>
        <div className="berita-list">
          {data.nasional.concat(data.internasional).filter(b=>b.author_id===session.user.id).map(b=><BeritaCard key={b.id} b={b} variant="list"/>)}
        </div>
      </main>
    </div>
  );

  if (page === "newsdetail" && selectedNewsId) return (
  <div>
    <Navbar onNavigate={setPage}/>
    <main className="container">
      <NewsDetail 
        id={selectedNewsId} 
        onBack={() => { setSelectedNewsId(null); setPage("home"); }} 
        onSelect={value => {
          if (typeof value === "string" && value.startsWith("page:")) {
            // klik kategori di breadcrumb
            const targetPage = value.replace("page:", "");
            setSelectedNewsId(null);
            setPage(targetPage); 
          } else {
            // klik berita lain
            setSelectedNewsId(value); 
            setPage("newsdetail"); 
          }
        }} 
        session={session}
        user={session?.user}
        onShowPopup={msg => setPopupMessage(msg)}
      />
    </main>
    {popupMessage && <Popup message={popupMessage} onClose={()=>setPopupMessage("")} />}
  </div>
);


  // === HALAMAN NASIONAL ===
// === HALAMAN NASIONAL ===
if(page === "nasional") return (
  <div>
    <Navbar onNavigate={setPage}/>
    <main className="container">
      <nav className="breadcrumb">
        <span onClick={()=>setPage("home")} style={{cursor:"pointer", color:"blue"}}>Beranda</span> 
        {" > "}
        <span>Nasional</span>
      </nav>
      <h2>Berita Sepakbola Nasional</h2>
      <div className="grid-berita">
        {data.nasional.map(b => (
          <div key={b.id} className="berita-grid-card" onClick={()=>{setSelectedNewsId(b.id); setPage("newsdetail");}}>
            {b.gambar && <img src={b.gambar} alt={b.judul} className="thumb" />}
            <h3>{b.judul}</h3>
            <p className="meta">
              Oleh <b className="author-link" style={{cursor:"pointer", color:"blue"}} 
                onClick={e=>{e.stopPropagation(); if(b.author_id) setSelectedAuthorId(b.author_id);}}>
                {b.author || "Unknown"}
              </b>
              <br />
              {new Date(b.created_at).toLocaleString("id-ID")}
            </p>
          </div>
        ))}
      </div>
    </main>
  </div>
);

// === HALAMAN INTERNASIONAL ===
if(page === "internasional") return (
  <div>
    <Navbar onNavigate={setPage}/>
    <main className="container">
      <nav className="breadcrumb">
        <span onClick={()=>setPage("home")} style={{cursor:"pointer", color:"blue"}}>Beranda</span> 
        {" > "}
        <span>Internasional</span>
      </nav>
      <h2>Berita Sepakbola Internasional</h2>
      <div className="grid-berita">
        {data.internasional.map(b => (
          <div key={b.id} className="berita-grid-card" onClick={()=>{setSelectedNewsId(b.id); setPage("newsdetail");}}>
            {b.gambar && <img src={b.gambar} alt={b.judul} className="thumb" />}
            <h3>{b.judul}</h3>
            <p className="meta">
              Oleh <b className="author-link" style={{cursor:"pointer", color:"blue"}} 
                onClick={e=>{e.stopPropagation(); if(b.author_id) setSelectedAuthorId(b.author_id);}}>
                {b.author || "Unknown"}
              </b>
              <br />
              {new Date(b.created_at).toLocaleString("id-ID")}
            </p>
          </div>
        ))}
      </div>
    </main>
  </div>
);



  // === HOME PAGE ===
  return (
    <div>
      <Navbar onNavigate={setPage} />
      <main className="container">
        <section className="section">
  <h2>TOP HEADLINES</h2>
  <div className="headlines-grid">
    {data.headlines.slice(0,3).map(b => (
      <BeritaCard key={b.id} b={b} variant="card" />
    ))}
  </div>
</section>

        <section className="section">
          <h2>SEPAKBOLA NASIONAL</h2>
          <div className="content-grid">
            <div className="berita-list">{data.nasional.slice(0,6).map(b=><BeritaCard key={b.id} b={b} variant="list"/>)}</div>
            <div className="klasemen-box"><TabelKlasemen liga="Indonesia"/><TabelKlasemen liga="Inggris"/></div>
          </div>
        </section>
        <section className="section">
          <h2>SEPAKBOLA INTERNASIONAL</h2>
          <div className="headlines-grid">{data.internasional.slice(0,6).map(b=><BeritaCard key={b.id} b={b} variant="card"/>)}</div>
        </section>
      </main>
      <footer className="footer"><p>© 2025 Kampiun. All rights reserved.</p></footer>
      {popupMessage && <Popup message={popupMessage} onClose={()=>setPopupMessage("")} />}
    </div>
  );
}
