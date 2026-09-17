import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const STATUS_COLORS = {
  todo: "#94a3b8",
  "in-progress": "#3b82f6",
  review: "#f59e0b",
  done: "#22c55e",
};

const AnalyticsPanel = ({ tasks }) => {
  const statusCounts = ["todo", "in-progress", "review", "done"].map((status) => ({
    name: status,
    value: tasks.filter((t) => t.status === status).length,
  }));

  const workloadMap = {};
  tasks.forEach((t) => {
    const name = t.assignee ? t.assignee.name : "Unassigned";
    workloadMap[name] = (workloadMap[name] || 0) + t.storyPoints;
  });
  const workloadData = Object.entries(workloadMap).map(([name, points]) => ({ name, points }));

  return (
    <div className="analytics-grid">
      <div className="card chart-card">
        <h4>Task Completion by Status</h4>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={statusCounts} dataKey="value" nameKey="name" outerRadius={80} label>
              {statusCounts.map((entry) => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="card chart-card">
        <h4>Workload by Assignee (story points)</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={workloadData}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="points" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
