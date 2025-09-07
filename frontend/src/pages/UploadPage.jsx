export default function UploadPage({
  judul,
  author,
  gambar,
  konten,
  setJudul,
  setAuthor,
  setGambar,
  setKonten,
  tambahBerita,
}) {
  return (
    <div>
      <h2>Unggah Berita</h2>
      <form className="form" onSubmit={tambahBerita}>
        <input
          type="text"
          placeholder="Judul"
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="URL Gambar"
          value={gambar}
          onChange={(e) => setGambar(e.target.value)}
        />
        <textarea
          placeholder="Konten"
          value={konten}
          onChange={(e) => setKonten(e.target.value)}
          required
        />
        <button type="submit">Unggah</button>
      </form>
    </div>
  );
}
