import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="brand">FlowSprint</Link>
      <div className="nav-right">
        <Link to="/profile" className="user-tag-link">{user.name} · {user.specialId}</Link>
        <button onClick={logout} className="btn-ghost">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
