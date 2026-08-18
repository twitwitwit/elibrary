import { useEffect, useMemo, useState } from "react";
import {
  BookMarked,
  RefreshCw,
  RotateCcw,
  UserRound,
} from "lucide-react";

type AdminBorrowingsProps = {
  token: string;
};

type Borrowing = {
  id: number;
  borrowedAt: string;
  returnedAt: string | null;
  dueDate?: string | null;
  status: string;
  isOverdue?: boolean;

  user: {
    id: number;
    name: string;
    email: string;
  };

  book: {
    id: number;
    title: string;

    author: {
      name: string;
    };

    category: {
      name: string;
    };
  };
};

type Filter =
  | "ALL"
  | "BORROWED"
  | "RETURNED"
  | "OVERDUE";

const API_URL = "http://localhost:5000";

function formatDate(date: string | null | undefined) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}

function isOverdue(borrowing: Borrowing) {
  return (
    borrowing.status === "BORROWED" &&
    borrowing.isOverdue === true
  );
}

function getDaysOverdue(
  borrowing: Borrowing,
) {
  if (!borrowing.dueDate) return 0;

  const dueDate = new Date(
    borrowing.dueDate,
  );

  const now = new Date();

  const difference =
    now.getTime() - dueDate.getTime();

  return Math.max(
    0,
    Math.ceil(
      difference / (1000 * 60 * 60 * 24),
    ),
  );
}

export default function AdminBorrowings({
  token,
}: AdminBorrowingsProps) {
  const [borrowings, setBorrowings] =
    useState<Borrowing[]>([]);

  const [filter, setFilter] =
    useState<Filter>("ALL");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [returningId, setReturningId] =
    useState<number | null>(null);

  async function loadBorrowings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/admin/borrowings`,
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
            "Failed to load borrowings",
        );
      }

      setBorrowings(
        data.borrowings ?? [],
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load borrowings.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBorrowings();
  }, [token]);

  const filteredBorrowings =
    useMemo(() => {
      return borrowings.filter(
        (borrowing) => {
          if (filter === "ALL") {
            return true;
          }

          if (filter === "BORROWED") {
            return (
              borrowing.status ===
                "BORROWED" &&
              !isOverdue(borrowing)
            );
          }

          if (filter === "RETURNED") {
            return (
              borrowing.status ===
              "RETURNED"
            );
          }

          if (filter === "OVERDUE") {
            return isOverdue(borrowing);
          }

          return true;
        },
      );
    }, [borrowings, filter]);

  const counts = useMemo(() => {
    return {
      all: borrowings.length,

      borrowed: borrowings.filter(
        (borrowing) =>
          borrowing.status ===
            "BORROWED" &&
          !isOverdue(borrowing),
      ).length,

      returned: borrowings.filter(
        (borrowing) =>
          borrowing.status ===
          "RETURNED",
      ).length,

      overdue: borrowings.filter(
        isOverdue,
      ).length,
    };
  }, [borrowings]);

  async function returnBook(
    borrowing: Borrowing,
  ) {
    const confirmed = window.confirm(
      `Mark "${borrowing.book.title}" as returned by ${borrowing.user.name}?`,
    );

    if (!confirmed) return;

    try {
      setReturningId(
        borrowing.id,
      );

      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/admin/borrowings/${borrowing.id}/return`,
        {
          method: "PATCH",
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
            "Failed to return book",
        );
      }

      setMessage(
        `"${borrowing.book.title}" was returned successfully.`,
      );

      await loadBorrowings();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to return book.",
      );
    } finally {
      setReturningId(null);
    }
  }

  return (
    <section className="admin-borrowings">
      {/* HEADER */}
      <div className="admin-borrowings-heading">
        <div>
          <p className="eyebrow">
            CIRCULATION MANAGEMENT
          </p>

          <h1>Borrowings</h1>

          <p>
            Monitor books currently borrowed
            and manage returns.
          </p>
        </div>

        <button
          className="admin-refresh"
          onClick={loadBorrowings}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* SUMMARY FILTERS */}
      <div className="borrowing-summary">
        <button
          className={
            filter === "ALL"
              ? "borrowing-summary-card active"
              : "borrowing-summary-card"
          }
          onClick={() =>
            setFilter("ALL")
          }
        >
          <span>All Records</span>
          <strong>{counts.all}</strong>
        </button>

        <button
          className={
            filter === "BORROWED"
              ? "borrowing-summary-card active"
              : "borrowing-summary-card"
          }
          onClick={() =>
            setFilter("BORROWED")
          }
        >
          <span>Active</span>
          <strong>
            {counts.borrowed}
          </strong>
        </button>

        <button
          className={
            filter === "RETURNED"
              ? "borrowing-summary-card active"
              : "borrowing-summary-card"
          }
          onClick={() =>
            setFilter("RETURNED")
          }
        >
          <span>Returned</span>
          <strong>
            {counts.returned}
          </strong>
        </button>

        <button
          className={
            filter === "OVERDUE"
              ? "borrowing-summary-card overdue active"
              : "borrowing-summary-card overdue"
          }
          onClick={() =>
            setFilter("OVERDUE")
          }
        >
          <span>Overdue</span>
          <strong>
            {counts.overdue}
          </strong>
        </button>
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

      {/* LOADING */}
      {loading ? (
        <div className="admin-borrowings-empty">
          <BookMarked size={34} />

          <h3>
            Opening circulation records...
          </h3>

          <p>
            Loading borrowing activity
            from the database.
          </p>
        </div>
      ) : filteredBorrowings.length ===
        0 ? (
        /* EMPTY */
        <div className="admin-borrowings-empty">
          <BookMarked size={34} />

          <h3>
            {filter === "ALL"
              ? "No borrowing records"
              : `No ${filter.toLowerCase()} records`}
          </h3>

          <p>
            Borrowing activity will appear
            here when books are checked out.
          </p>
        </div>
      ) : (
        /* BORROWING RECORDS */
        <div className="borrowings-list">
          {filteredBorrowings.map(
            (borrowing) => {
              const overdue =
                isOverdue(borrowing);

              const daysOverdue =
                getDaysOverdue(
                  borrowing,
                );

              return (
                <article
                  className={`borrowing-row ${
                    overdue
                      ? "borrowing-row-overdue"
                      : ""
                  }`}
                  key={borrowing.id}
                >
                  {/* BOOK ICON */}
                  <div className="borrowing-book-icon">
                    <BookMarked size={21} />
                  </div>

                  {/* BOOK */}
                  <div className="borrowing-book">
                    <p className="eyebrow">
                      {
                        borrowing.book
                          .category.name
                      }
                    </p>

                    <h3>
                      {
                        borrowing.book
                          .title
                      }
                    </h3>

                    <span>
                      by{" "}
                      {
                        borrowing.book
                          .author.name
                      }
                    </span>
                  </div>

                  {/* USER */}
                  <div className="borrowing-user">
                    <div className="borrowing-user-icon">
                      <UserRound
                        size={15}
                      />
                    </div>

                    <div>
                      <strong>
                        {
                          borrowing.user
                            .name
                        }
                      </strong>

                      <span>
                        {
                          borrowing.user
                            .email
                        }
                      </span>
                    </div>
                  </div>

                  {/* DATES */}
                  <div className="borrowing-dates">
                    <div>
                      <span>
                        Borrowed
                      </span>

                      <strong>
                        {formatDate(
                          borrowing.borrowedAt,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Due</span>

                      <strong
                        className={
                          overdue
                            ? "date-overdue"
                            : ""
                        }
                      >
                        {formatDate(
                          borrowing.dueDate,
                        )}
                      </strong>

                      {overdue && (
                        <small className="overdue-days">
                          {daysOverdue ===
                          1
                            ? "1 day overdue"
                            : `${daysOverdue} days overdue`}
                        </small>
                      )}
                    </div>

                    {borrowing.returnedAt && (
                      <div>
                        <span>
                          Returned
                        </span>

                        <strong>
                          {formatDate(
                            borrowing.returnedAt,
                          )}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* STATUS + ACTION */}
                  <div className="borrowing-status">
                    {overdue ? (
                      <span className="status-badge overdue">
                        OVERDUE
                      </span>
                    ) : (
                      <span
                        className={`status-badge ${
                          borrowing.status ===
                          "RETURNED"
                            ? "returned"
                            : "borrowed"
                        }`}
                      >
                        {borrowing.status}
                      </span>
                    )}

                    {borrowing.status ===
                      "BORROWED" && (
                      <button
                        className="return-button"
                        onClick={() =>
                          returnBook(
                            borrowing,
                          )
                        }
                        disabled={
                          returningId ===
                          borrowing.id
                        }
                      >
                        <RotateCcw
                          size={14}
                        />

                        {returningId ===
                        borrowing.id
                          ? "Returning..."
                          : "Return Book"}
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