import { useEffect, useState } from "react";
import {
  BookOpen,
  Users,
  BookMarked,
  Library,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

type AdminDashboardProps = {
  token: string;
  onBooks: () => void;
  onBorrowings: () => void;
  onUsers: () => void;
  onLibraryData: () => void;
};

type Stats = {
  totalBooks: number;
  availableCopies: number;
  activeBorrowings: number;
  totalUsers: number;
  overdueBooks: number;
};

const API_URL = "http://localhost:5000";

export default function AdminDashboard({
  token,
  onBooks,
  onBorrowings,
  onUsers,
  onLibraryData,
}: AdminDashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load dashboard");
      }

      setStats(data.stats);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Unable to load dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [token]);

  if (loading) {
    return (
      <section className="admin-page">
        <div className="admin-loading">
          <Library size={34} />
          <h2>Opening the library office...</h2>
          <p>Loading your management dashboard.</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="admin-page">
        <div className="admin-loading">
          <Library size={34} />
          <h2>Dashboard unavailable</h2>
          <p>{error}</p>

          <button className="admin-refresh" onClick={loadDashboard}>
            <RefreshCw size={15} />
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">LIBRARY MANAGEMENT</p>

          <h1>Admin Dashboard</h1>

          <p>Manage your collection, members, and borrowing activity.</p>
        </div>

        <button className="admin-refresh" onClick={loadDashboard}>
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* DASHBOARD STATISTICS */}
      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat-icon">
            <BookOpen size={21} />
          </div>

          <div>
            <span>Total Books</span>
            <strong>{stats?.totalBooks ?? 0}</strong>
          </div>
        </div>

        <div className="admin-stat">
          <div className="admin-stat-icon">
            <Library size={21} />
          </div>

          <div>
            <span>Available Copies</span>
            <strong>{stats?.availableCopies ?? 0}</strong>
          </div>
        </div>

        <div className="admin-stat">
          <div className="admin-stat-icon">
            <BookMarked size={21} />
          </div>

          <div>
            <span>Active Borrowings</span>
            <strong>{stats?.activeBorrowings ?? 0}</strong>
          </div>
        </div>

        <div className="admin-stat">
          <div className="admin-stat-icon">
            <Users size={21} />
          </div>

          <div>
            <span>Registered Users</span>
            <strong>{stats?.totalUsers ?? 0}</strong>
          </div>
        </div>

        <div className="admin-stat admin-stat-overdue">
          <div className="admin-stat-icon">
            <AlertTriangle size={21} />
          </div>

          <div>
            <span>Overdue Books</span>
            <strong>{stats?.overdueBooks ?? 0}</strong>
          </div>
        </div>
      </div>

      {/* LIBRARY OPERATIONS */}
      <div className="admin-section">
        <div className="admin-section-heading">
          <div>
            <p className="eyebrow">MANAGEMENT</p>

            <h2>Library Operations</h2>
          </div>
        </div>

        <div className="admin-actions">
          <button className="admin-action" onClick={onBooks}>
            <BookOpen size={22} />

            <strong>Books</strong>

            <span>Add and manage books</span>
          </button>

          <button className="admin-action" onClick={onBorrowings}>
            <BookMarked size={22} />
            <strong>Borrowings</strong>
            <span>View borrowing activity</span>
          </button>

          <button className="admin-action" onClick={onUsers}>
            <Users size={22} />
            <strong>Users</strong>
            <span>Manage library members</span>
          </button>

          <button className="admin-action" onClick={onLibraryData}>
            <Library size={22} />
            <strong>Categories</strong>

            <span>Organize your collection</span>
          </button>
        </div>
      </div>
    </section>
  );
}
