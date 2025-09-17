export default function NewsDetailPage({ news }) {
  if (!news) return <p>Berita tidak ditemukan.</p>;

  return (
    <div className="news-detail">
      <h2>{news.judul}</h2>
      <p className="meta">
        BY <b>{news.author}</b> –{" "}
        {new Date(news.created_at).toLocaleDateString("id-ID")}
      </p>
      <img
        src={news.gambar || "https://via.placeholder.com/600x300"}
        alt={news.judul}
      />
      <p>{news.konten}</p>
    </div>
  );
}
