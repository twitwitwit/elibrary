import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Trash2,
  Shield,
  UserRound,
  Search,
} from "lucide-react";

type AdminUsersProps = {
  token: string;
  currentUserId: number;
};

type User = {
  id: number;
  name: string;
  email: string;
  role: "STUDENT" | "LIBRARIAN" | "ADMIN";
  createdAt: string;
  _count?: {
    borrows: number;
  };
};

type RoleFilter =
  | "ALL"
  | "STUDENT"
  | "LIBRARIAN"
  | "ADMIN";

const API_URL = "http://localhost:5000";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}

export default function AdminUsers({
  token,
  currentUserId,
}: AdminUsersProps) {
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState<RoleFilter>("ALL");

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load users",
        );
      }

      setUsers(data.users ?? []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load users.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [token]);

  const filteredUsers = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !searchText ||
        user.name
          .toLowerCase()
          .includes(searchText) ||
        user.email
          .toLowerCase()
          .includes(searchText);

      const matchesRole =
        roleFilter === "ALL" ||
        user.role === roleFilter;

      return (
        matchesSearch &&
        matchesRole
      );
    });
  }, [users, search, roleFilter]);

  async function changeRole(
    user: User,
    role: User["role"],
  ) {
    if (user.id === currentUserId) {
      return;
    }

    if (user.role === role) {
      return;
    }

    try {
      setUpdatingId(user.id);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/admin/users/${user.id}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update user role",
        );
      }

      setMessage(
        `${user.name}'s role was changed to ${role}.`,
      );

      await loadUsers();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to update role.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteUser(
    user: User,
  ) {
    if (user.id === currentUserId) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${user.name}'s account? This action cannot be undone.`,
      );

    if (!confirmed) return;

    try {
      setUpdatingId(user.id);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/admin/users/${user.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete user",
        );
      }

      setMessage(
        `${user.name}'s account was deleted.`,
      );

      await loadUsers();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete user.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const roleCounts = {
    all: users.length,

    students: users.filter(
      (user) =>
        user.role === "STUDENT",
    ).length,

    librarians: users.filter(
      (user) =>
        user.role === "LIBRARIAN",
    ).length,

    admins: users.filter(
      (user) =>
        user.role === "ADMIN",
    ).length,
  };

  return (
    <section className="admin-users">
      {/* HEADER */}

      <div className="admin-users-heading">
        <div>
          <p className="eyebrow">
            MEMBER MANAGEMENT
          </p>

          <h1>Users</h1>

          <p>
            Manage library members and
            their access levels.
          </p>
        </div>

        <button
          className="admin-refresh"
          onClick={loadUsers}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* SUMMARY */}

      <div className="user-summary">
        <button
          className={
            roleFilter === "ALL"
              ? "user-summary-card active"
              : "user-summary-card"
          }
          onClick={() =>
            setRoleFilter("ALL")
          }
        >
          <span>All Users</span>
          <strong>
            {roleCounts.all}
          </strong>
        </button>

        <button
          className={
            roleFilter === "STUDENT"
              ? "user-summary-card active"
              : "user-summary-card"
          }
          onClick={() =>
            setRoleFilter("STUDENT")
          }
        >
          <span>Students</span>
          <strong>
            {roleCounts.students}
          </strong>
        </button>

        <button
          className={
            roleFilter === "LIBRARIAN"
              ? "user-summary-card active"
              : "user-summary-card"
          }
          onClick={() =>
            setRoleFilter("LIBRARIAN")
          }
        >
          <span>Librarians</span>
          <strong>
            {roleCounts.librarians}
          </strong>
        </button>

        <button
          className={
            roleFilter === "ADMIN"
              ? "user-summary-card active"
              : "user-summary-card"
          }
          onClick={() =>
            setRoleFilter("ADMIN")
          }
        >
          <span>Admins</span>
          <strong>
            {roleCounts.admins}
          </strong>
        </button>
      </div>

      {/* SEARCH */}

      <div className="admin-users-toolbar">
        <div className="admin-users-search">
          <Search size={18} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search by name or email..."
          />
        </div>

        <select
          className="admin-users-role-filter"
          value={roleFilter}
          onChange={(event) =>
            setRoleFilter(
              event.target.value as RoleFilter,
            )
          }
        >
          <option value="ALL">
            All roles
          </option>

          <option value="STUDENT">
            Students
          </option>

          <option value="LIBRARIAN">
            Librarians
          </option>

          <option value="ADMIN">
            Admins
          </option>
        </select>
      </div>

      {/* MESSAGES */}

      {message && (
        <div className="admin-message success">
          {message}
        </div>
      )}

      {error && (
        <div className="admin-message error">
          {error}
        </div>
      )}

      {/* CONTENT */}

      {loading ? (
        <div className="admin-users-empty">
          <UserRound size={34} />

          <h3>
            Loading members...
          </h3>

          <p>
            Opening the library
            membership records.
          </p>
        </div>
      ) : filteredUsers.length ===
        0 ? (
        <div className="admin-users-empty">
          <UserRound size={34} />

          <h3>
            {users.length === 0
              ? "No users found"
              : "No matching users"}
          </h3>

          <p>
            {users.length === 0
              ? "Registered library members will appear here."
              : "Try a different name, email, or role."}
          </p>
        </div>
      ) : (
        <div className="admin-users-table">
          {/* TABLE HEADER */}

          <div className="admin-users-table-header">
            <span>MEMBER</span>
            <span>ROLE</span>
            <span>BORROWINGS</span>
            <span>JOINED</span>
            <span>ACTIONS</span>
          </div>

          {/* USERS */}

          {filteredUsers.map(
            (user) => {
              const isCurrentUser =
                user.id ===
                currentUserId;

              const isUpdating =
                updatingId ===
                user.id;

              return (
                <article
                  className="admin-user-row"
                  key={user.id}
                >
                  {/* MEMBER */}

                  <div className="user-member">
                    <div className="user-avatar">
                      <UserRound
                        size={17}
                      />
                    </div>

                    <div>
                      <strong>
                        {user.name}
                      </strong>

                      <span>
                        {user.email}
                      </span>
                    </div>
                  </div>

                  {/* ROLE */}

                  <div className="user-role">
                    <select
                      value={user.role}
                      disabled={
                        isCurrentUser ||
                        isUpdating
                      }
                      onChange={(
                        event,
                      ) =>
                        changeRole(
                          user,
                          event.target
                            .value as User["role"],
                        )
                      }
                    >
                      <option value="STUDENT">
                        Student
                      </option>

                      <option value="LIBRARIAN">
                        Librarian
                      </option>

                      <option value="ADMIN">
                        Admin
                      </option>
                    </select>

                    {isCurrentUser && (
                      <small>
                        Current account
                      </small>
                    )}

                    {isUpdating && (
                      <small>
                        Updating...
                      </small>
                    )}
                  </div>

                  {/* BORROWINGS */}

                  <div className="user-borrowings">
                    <BookCount
                      count={
                        user._count
                          ?.borrows ??
                        0
                      }
                    />
                  </div>

                  {/* JOINED */}

                  <div className="user-joined">
                    {formatDate(
                      user.createdAt,
                    )}
                  </div>

                  {/* ACTIONS */}

                  <div className="user-actions">
                    <span
                      className={`user-role-badge ${user.role.toLowerCase()}`}
                    >
                      <Shield size={11} />

                      {user.role}
                    </span>

                    {!isCurrentUser && (
                      <button
                        className="user-delete"
                        disabled={
                          isUpdating
                        }
                        title="Delete user"
                        onClick={() =>
                          deleteUser(
                            user,
                          )
                        }
                      >
                        <Trash2
                          size={14}
                        />
                      </button>
                    )}
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}

function BookCount({
  count,
}: {
  count: number;
}) {
  return (
    <span className="user-book-count">
      {count}{" "}
      {count === 1
        ? "record"
        : "records"}
    </span>
  );
}