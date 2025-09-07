export default function Navbar({ setPage }) {
  return (
    <nav className="navbar">
      <h1 className="logo">KAMPIUN</h1>
      <div className="links">
        <button onClick={() => setPage("home")}>Home</button>
        <button onClick={() => setPage("unggah")}>Unggah</button>
        <button onClick={() => setPage("myposts")}>My Posts</button>
      </div>
    </nav>
  );
}
