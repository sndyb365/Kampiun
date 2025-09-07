export default function BeritaCard({ b, onOpen }) {
  return (
    <div className="berita-card" onClick={() => onOpen(b.id)}>
      <img
        src={b.gambar || "https://via.placeholder.com/250"}
        alt={b.judul}
      />
      <div className="info">
        <h3>{b.judul}</h3>
        <p className="meta">
          BY <b>{b.author}</b> –{" "}
          {new Date(b.created_at).toLocaleDateString("id-ID")}
        </p>
      </div>
    </div>
  );
}
