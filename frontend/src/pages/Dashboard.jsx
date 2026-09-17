import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const loadProjects = async () => {
    const { data } = await api.get("/projects");
    setProjects(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post("/projects", { name, description });
    setName("");
    setDescription("");
    setShowForm(false);
    loadProjects();
  };

  if (loading) return <p className="center-msg">Loading projects...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Projects</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Project"}
        </button>
      </div>

      {showForm && (
        <form className="card form" onSubmit={handleCreate}>
          <input
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="muted small">
            You'll become this project's admin automatically. Add teammates by their special ID
            from the project page once it's created.
          </p>
          <button type="submit" className="btn-primary">Create Project</button>
        </form>
      )}

      <div className="grid">
        {projects.length === 0 && <p className="center-msg">No projects yet.</p>}
        {projects.map((p) => (
          <Link to={`/projects/${p._id}`} key={p._id} className="card project-card">
            <h3>{p.name}</h3>
            <p className="muted">{p.description || "No description"}</p>
            <div className="tag-row">
              <span className={`status-tag status-${p.status}`}>{p.status}</span>
              <span className="muted small">Admin: {p.manager?.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
