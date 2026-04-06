import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/career`;

export default function CareerDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");

  

const fetchApplications = async () => {
  try {
    setLoading(true);

    const res = await axios.get(`${API_URL}/all`);

    const data =
      res.data?.data ||
      res.data?.applications ||
      res.data ||
      [];

    // Ensure array only
    setApplications(Array.isArray(data) ? data : []);

  } catch (error) {
    toast.error("Failed to fetch applications");
    setApplications([]);
  } finally {
    setLoading(false);
  }
};

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/status/${id}`, { status });
      toast.success(`Status updated to ${status}`);
      fetchApplications();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // ✅ FILTER LOGIC
  const filteredApplications = useMemo(() => {
    if (filter === "All") return applications;
    return applications.filter(
      (app) => (app.status || "Applied") === filter
    );
  }, [applications, filter]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Selected":
        return "#16a34a";
      case "Rejected":
        return "#dc2626";
      case "Interview Scheduled":
        return "#2563eb";
      default:
        return "#f59e0b"; // Pending
    }
  };

  const statusList = [
  "All",
  "Applied",
  "Interview Scheduled",
  "Selected",
  "Rejected",
];


  return (
    <div style={{ padding: "30px", background: "#f4f6f9", minHeight: "100vh" }}>
      <ToastContainer />

      <h1 style={{ marginBottom: "10px" }}>Career Applications</h1>

      {/* 🔥 FILTER BUTTONS */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {statusList.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: "8px 14px",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              background:
                filter === status ? "#111827" : "#e5e7eb",
              color: filter === status ? "#fff" : "#111",
              transition: "0.2s",
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* 🔢 SMALL STATS */}
      <div style={{ marginBottom: "20px", fontWeight: "500" }}>
        Showing {filteredApplications.length} of {applications.length} applications
      </div>

      {loading ? (
        <h3>Loading applications...</h3>
      ) : filteredApplications.length === 0 ? (
        <h3>No applications found</h3>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredApplications.map((app) => (
            <div
              key={app._id}
              style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                transition: "0.3s",
              }}
            >
              <h2 style={{ marginBottom: "10px" }}>{app.name}</h2>

              <p><strong>Email:</strong> {app.email}</p>
              <p><strong>Mobile:</strong> {app.mobile}</p>
              <p><strong>Role:</strong> {app.subject}</p>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    padding: "5px 10px",
                    borderRadius: "20px",
                    color: "#fff",
                    fontSize: "12px",
                    background: getStatusColor(app.status),
                  }}
                >
                  {app.status || "Pending"}
                </span>
              </p>

              <a
                href={app.resume?.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: "10px",
                  marginBottom: "15px",
                  color: "#2563eb",
                  fontWeight: "bold",
                }}
              >
                View Resume
              </a>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  onClick={() =>
                    updateStatus(app._id, "Interview Scheduled")
                  }
                  style={buttonStyle("#2563eb")}
                >
                  Schedule
                </button>

                <button
                  onClick={() => updateStatus(app._id, "Selected")}
                  style={buttonStyle("#16a34a")}
                >
                  Select
                </button>

                <button
                  onClick={() => updateStatus(app._id, "Rejected")}
                  style={buttonStyle("#dc2626")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const buttonStyle = (color) => ({
  background: color,
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
});
