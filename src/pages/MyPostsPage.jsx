import BeritaCard from "../components/BeritaCard";

export default function MyPostsPage({ berita, onOpen }) {
  return (
    <div>
      <h2>Postingan Saya</h2>
      {berita.map((b) => (
        <BeritaCard key={b.id} b={b} onOpen={onOpen} />
      ))}
    </div>
  );
}
