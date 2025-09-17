import BeritaCard from "../components/BeritaCard";

export default function HomePage({ berita, klasemen, onOpen }) {
  return (
    <div className="content">
      <div className="berita-list">
        <h2>Berita Terbaru</h2>
        {berita.map((b) => (
          <BeritaCard key={b.id} b={b} onOpen={onOpen} />
        ))}
      </div>
      <div className="klasemen">
        <h2>Klasemen</h2>
        <table>
          <thead>
            <tr>
              <th>Tim</th>
              <th>Main</th>
              <th>Menang</th>
              <th>Seri</th>
              <th>Kalah</th>
              <th>Poin</th>
            </tr>
          </thead>
          <tbody>
            {klasemen.map((k) => (
              <tr key={k.id}>
                <td>{k.tim}</td>
                <td>{k.main}</td>
                <td>{k.menang}</td>
                <td>{k.seri}</td>
                <td>{k.kalah}</td>
                <td>{k.poin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
