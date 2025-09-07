// src/AuthorProfile.jsx
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./authorProfile.css";

export default function AuthorProfile({ authorId, onBack, onSelectNews }) {
  const [author, setAuthor] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (!authorId) return;

    // Fetch profil author
    const fetchAuthor = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, bio")
        .eq("id", authorId)
        .single();

      if (error) {
        console.error("Error fetching author:", error);
        return;
      }

      setAuthor(data);
    };

    // Fetch tulisan-tulisan author
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("berita")
        .select("id, judul, created_at, kategori")
        .eq("author_id", authorId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
        return;
      }

      setPosts(data || []);
    };

    fetchAuthor();
    fetchPosts();
  }, [authorId]);

  if (!author) return <p>Loading profil...</p>;

  return (
    <div className="author-page">
      <button className="back-btn" onClick={onBack}>
        ← Kembali
      </button>

      <div className="author-header">
        <img
          src={author.avatar_url || "https://via.placeholder.com/120"}
          alt={author.name}
          className="author-avatar"
        />
        <div className="author-info">
          <h2>{author.name}</h2>
          <p className="author-name">@{author.name}</p>
          <p className="author-bio">{author.bio || "Belum ada bio"}</p>
        </div>
      </div>

      <div className="author-posts">
        <h3>Tulisan oleh {author.name}</h3>
        {posts.length === 0 ? (
          <p>Author ini belum menulis artikel apapun.</p>
        ) : (
          <div className="berita-grid">
            {posts.map((p) => (
              <div
                key={p.id}
                className="berita-card"
                style={{ cursor: "pointer" }}
                onClick={() => onSelectNews && onSelectNews(p.id)}
              >
                <h4>{p.judul}</h4>
                <small>
                  {p.kategori?.toUpperCase()} •{" "}
                  {new Date(p.created_at).toLocaleDateString("id-ID")}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
