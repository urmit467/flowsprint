import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const Profile = () => {
  const { user } = useAuth();
  const [ownedCount, setOwnedCount] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get("/projects").then(({ data }) => {
      setOwnedCount(data.filter((p) => p.manager?._id === user._id).length);
      setMemberCount(data.filter((p) => p.manager?._id !== user._id).length);
      setLoading(false);
    });
  }, [user._id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(user.specialId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="page">
      <h1>Profile</h1>

      <div className="card profile-card">
        <h2>{user.name}</h2>
        <p className="muted">{user.email}</p>

        <div className="special-id-box">
          <span className="label">Your special ID</span>
          <div className="special-id-row">
            <code className="special-id">{user.specialId}</code>
            <button className="btn-secondary" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="muted small">
            Share this with a project admin so they can add you as a member — or give it out
            yourself to add teammates to projects you created.
          </p>
        </div>
      </div>

      {!loading && (
        <div className="stat-row">
          <div className="card stat-card">
            <span className="stat-number">{ownedCount}</span>
            <span className="muted small">Projects you admin</span>
          </div>
          <div className="card stat-card">
            <span className="stat-number">{memberCount}</span>
            <span className="muted small">Projects you're a member of</span>
          </div>
          <div className="card stat-card">
            <span className="stat-number">{ownedCount + memberCount}</span>
            <span className="muted small">Total projects</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
