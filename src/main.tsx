import AdminDashboard from "./components/AdminDashboard";
import AdminBooks from "./components/AdminBooks";
import AdminLibraryData from "./components/AdminLibraryData";
import AdminBorrowings from "./components/AdminBorrowings";
import AdminUsers from "./components/AdminUsers";

import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  BookOpen,
  Search,
  UserRound,
  Library,
  ChevronRight,
  X,
  LogOut,
  RotateCcw,
} from "lucide-react";

import "./styles.css";

type Book = {
  id: number;
  title: string;
  author: string;
  category: string;
  color: string;
  available: number;
  total: number;
};

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type Borrowing = {
  id: number;
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: "BORROWED" | "RETURNED" | "OVERDUE";
  book: {
    id: number;
    title: string;
    author: {
      name: string;
    };
    category: {
      name: string;
    };
    availableCopies: number;
    totalCopies: number;
  };
};

type Page =
  | "home"
  | "browse"
  | "my-books"
  | "borrowing"
  | "reader"
  | "admin"
  | "admin-books"
  | "library-data"
  | "borrowings"
  | "users";

const API_URL = "http://localhost:5000";

const categoryColors: Record<string, string> = {
  Fiction: "#7f1d1d",
  "Self-Development": "#334155",
  Fantasy: "#365314",
  Romance: "#9f1239",
  Biography: "#854d0e",
  Technology: "#4338ca",
  History: "#57534e",
};

function getBookColor(category: string) {
  return categoryColors[category] ?? "#4c1d95";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  return (
    <button
      className="book-card"
      onClick={onClick}
      aria-label={`View ${book.title}`}
    >
      <div className="book-cover" style={{ background: book.color }}>
        <span className="cover-mark">LIBRARY</span>

        <strong>{book.title}</strong>

        <small>{book.author}</small>
      </div>

      <div className="book-spine" style={{ background: book.color }}>
        <span>{book.title}</span>
      </div>
    </button>
  );
}

function Shelf({
  title,
  items,
  onSelect,
  onSeeAll,
}: {
  title: string;
  items: Book[];
  onSelect: (book: Book) => void;
  onSeeAll: () => void;
}) {
  return (
    <section className="shelf-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">COLLECTION</p>
          <h2>{title}</h2>
        </div>

        <button className="see-all" onClick={onSeeAll}>
          See all <ChevronRight size={16} />
        </button>
      </div>

      <div className="shelf">
        <div className="books-row">
          {items.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onClick={() => onSelect(book)}
            />
          ))}
        </div>

        <div className="shelf-board" />
      </div>
    </section>
  );
}

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<Book | null>(null);

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("elibrary_user");

    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("elibrary_token");
  });

  const [page, setPage] = useState<Page>("home");

  const [myBooks, setMyBooks] = useState<Borrowing[]>([]);
  const [myBooksLoading, setMyBooksLoading] = useState(false);
  const [myBooksError, setMyBooksError] = useState("");

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [borrowLoading, setBorrowLoading] = useState(false);

  const [borrowMessage, setBorrowMessage] = useState("");

  const [returnLoading, setReturnLoading] = useState<number | null>(null);

  const [returnMessage, setReturnMessage] = useState("");

  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [readerUrl, setReaderUrl] = useState("");
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerError, setReaderError] = useState("");

  // =========================
  // LOAD BOOKS
  // =========================

  async function loadBooks() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/books`);

      if (!response.ok) {
        throw new Error("Failed to load books");
      }

      const data = await response.json();

      const formattedBooks: Book[] = data.books.map((book: any) => ({
        id: book.id,
        title: book.title,
        author: book.author.name,
        category: book.category.name,
        color: getBookColor(book.category.name),
        available: book.availableCopies,
        total: book.totalCopies,
      }));

      setBooks(formattedBooks);
    } catch (error) {
      console.error(error);

      setError("Unable to connect to the library database.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, []);

  // =========================
  // LOAD MY BOOKS
  // =========================

  async function loadMyBooks() {
    if (!token) {
      setMyBooks([]);
      return;
    }

    try {
      setMyBooksLoading(true);
      setMyBooksError("");

      const response = await fetch(`${API_URL}/api/borrowings/my-books`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load your books");
      }

      setMyBooks(data.borrowings);
    } catch (error) {
      console.error(error);

      setMyBooksError(
        error instanceof Error ? error.message : "Unable to load your books.",
      );
    } finally {
      setMyBooksLoading(false);
    }
  }

  useEffect(() => {
    if ((page === "my-books" || page === "borrowing") && token) {
      loadMyBooks();
    }
  }, [page, token]);

  // =========================
  // FILTERS
  // =========================

  const categories = [
    "All",
    ...Array.from(new Set(books.map((book) => book.category))),
  ];

  const filtered = useMemo(() => {
    return books.filter((book) => {
      const matchesCategory = category === "All" || book.category === category;

      const searchText = `${book.title} ${book.author}`.toLowerCase();

      const matchesSearch = searchText.includes(query.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [books, query, category]);

  const featured = filtered.slice(0, 6);
  const newArrivals = filtered.slice(6, 10);

  // =========================
  // LOGIN / REGISTER
  // =========================

  async function handleAuth() {
    try {
      setAuthLoading(true);
      setAuthError("");

      const endpoint =
        authMode === "login" ? "/api/auth/login" : "/api/auth/register";

      const body =
        authMode === "login"
          ? {
              email: authEmail,
              password: authPassword,
            }
          : {
              name: authName,
              email: authEmail,
              password: authPassword,
            };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      localStorage.setItem("elibrary_token", data.token);

      localStorage.setItem("elibrary_user", JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);

      setShowAuth(false);
      setAuthPassword("");
      setAuthName("");
      setAuthEmail("");
    } catch (error) {
      console.error(error);

      setAuthError(
        error instanceof Error ? error.message : "Authentication failed",
      );
    } finally {
      setAuthLoading(false);
    }
  }

  // =========================
  // LOGOUT
  // =========================

  function handleLogout() {
    localStorage.removeItem("elibrary_token");

    localStorage.removeItem("elibrary_user");

    setToken(null);
    setUser(null);
    setMyBooks([]);
    setPage("home");
  }

  // =========================
  // BORROW
  // =========================

  async function handleBorrow() {
    if (!selected) return;

    if (!token || !user) {
      setShowAuth(true);
      setAuthMode("login");
      setBorrowMessage("");
      return;
    }

    try {
      setBorrowLoading(true);
      setBorrowMessage("");

      const response = await fetch(`${API_URL}/api/borrowings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookId: selected.id,
          days: 14,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to borrow book");
      }

      setBorrowMessage(
        `Successfully borrowed "${selected.title}". Due in 14 days.`,
      );

      setSelected({
        ...selected,
        available: Math.max(0, selected.available - 1),
      });

      setBooks((currentBooks) =>
        currentBooks.map((book) =>
          book.id === selected.id
            ? {
                ...book,
                available: Math.max(0, book.available - 1),
              }
            : book,
        ),
      );

      await loadMyBooks();
    } catch (error) {
      console.error(error);

      setBorrowMessage(
        error instanceof Error ? error.message : "Unable to borrow book.",
      );
    } finally {
      setBorrowLoading(false);
    }
  }

// =========================
// READ BOOK
// =========================

async function handleReadBook() {
  if (!selected) return;

  if (!token || !user) {
    setShowAuth(true);
    setAuthMode("login");
    setAuthError("");
    return;
  }

  try {
    setReaderLoading(true);
    setReaderError("");

    const response = await fetch(
      `${API_URL}/api/borrowings/${selected.id}/read`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      let message = "Unable to open this book.";

      try {
        const data = await response.json();
        message = data.message || message;
      } catch {
        // Response wasn't JSON
      }

      throw new Error(message);
    }

    const blob = await response.blob();

    if (!blob.type.includes("pdf")) {
      throw new Error(
        "The digital book could not be opened.",
      );
    }

    const fileUrl = URL.createObjectURL(blob);

    setReaderUrl(fileUrl);
    setReadingBook(selected);
    setSelected(null);
    setPage("reader");
  } catch (error) {
    console.error(error);

    setReaderError(
      error instanceof Error
        ? error.message
        : "Unable to open this book.",
    );
  } finally {
    setReaderLoading(false);
  }
}

function closeReader() {
  if (readerUrl) {
    URL.revokeObjectURL(readerUrl);
  }

  setReaderUrl("");
  setReadingBook(null);
  setReaderError("");
  setPage("browse");
}

const selectedBorrowing = selected
  ? myBooks.find(
      (borrowing) =>
        borrowing.book.id === selected.id &&
        borrowing.status === "BORROWED",
    )
  : null;

  // =========================
  // RETURN
  // =========================

  async function handleReturn(borrowingId: number) {
    if (!token) return;

    try {
      setReturnLoading(borrowingId);
      setReturnMessage("");

      const response = await fetch(
        `${API_URL}/api/borrowings/${borrowingId}/return`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to return book");
      }

      setReturnMessage("Book returned successfully.");

      await loadMyBooks();
      await loadBooks();
    } catch (error) {
      console.error(error);

      setReturnMessage(
        error instanceof Error ? error.message : "Unable to return book.",
      );
    } finally {
      setReturnLoading(null);
    }
  }

  // =========================
  // NAVIGATION HELPERS
  // =========================

  const canManageLibrary =
    user && (user.role === "ADMIN" || user.role === "LIBRARIAN");

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="app">
      {/* NAVBAR */}

      <header className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <Library size={22} />
          </div>

          <div>
            <strong>E-Library</strong>
            <span>Digital Reading Room</span>
          </div>
        </div>

        <nav>
          <a
            className={page === "home" ? "active" : ""}
            onClick={() => setPage("home")}
          >
            Home
          </a>
          <a
            className={page === "browse" ? "active" : ""}
            onClick={() => setPage("browse")}
          >
            Browse
          </a>
          <a
            className={page === "my-books" ? "active" : ""}
            onClick={() => {
              if (!user) {
                setAuthMode("login");
                setAuthError("");
                setShowAuth(true);
                return;
              }

              setPage("my-books");
            }}
          >
            My Books
          </a>
          <a
            className={page === "borrowing" ? "active" : ""}
            onClick={() => {
              if (!user) {
                setAuthMode("login");
                setAuthError("");
                setShowAuth(true);
                return;
              }

              setPage("borrowing");
            }}
          >
            Borrowing
          </a>
          {canManageLibrary && (
            <a
              className={page === "admin" ? "active" : ""}
              onClick={() => setPage("admin")}
            >
              Admin
            </a>
          )}
        </nav>

        {user ? (
          <button className="profile" onClick={handleLogout}>
            <LogOut size={18} />
            <span>{user.name}</span>
          </button>
        ) : (
          <button
            className="profile"
            onClick={() => {
              setAuthMode("login");
              setAuthError("");
              setShowAuth(true);
            }}
          >
            <UserRound size={18} />
            <span>Account</span>
          </button>
        )}
      </header>

      <main>
        {/* =========================
            HOME
        ========================= */}

        {page === "home" && (
          <>
            <section className="hero">
              <div>
                <p className="eyebrow">WELCOME TO YOUR DIGITAL LIBRARY</p>

                <h1>
                  Find a book.
                  <br />
                  <em>Find a new world.</em>
                </h1>

                <p className="hero-copy">
                  Explore our collection, discover something new, and keep your
                  next great read close at hand.
                </p>

                <div className="search">
                  <Search size={19} />

                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by title or author..."
                  />

                  <kbd>⌘ K</kbd>
                </div>
              </div>

              <div className="hero-books">
                <div className="floating-book b1">
                  READ
                  <br />
                  MORE
                </div>

                <div className="floating-book b2">
                  YOUR
                  <br />
                  STORY
                </div>

                <div className="floating-book b3">
                  OPEN
                  <br />
                  MINDS
                </div>
              </div>
            </section>

            <div className="filters">
              {categories.map((item) => (
                <button
                  key={item}
                  className={category === item ? "selected" : ""}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            {loading && (
              <div className="empty">
                <BookOpen size={34} />

                <h3>Opening the library...</h3>

                <p>Loading books from the collection.</p>
              </div>
            )}

            {error && !loading && (
              <div className="empty">
                <BookOpen size={34} />

                <h3>Library unavailable</h3>

                <p>{error}</p>
              </div>
            )}

            {!loading && !error && (
              <>
                {filtered.length > 0 ? (
                  <>
                    <Shelf
                      title="Featured Collection"
                      items={featured}
                      onSelect={setSelected}
                      onSeeAll={() => setPage("browse")}
                    />

                    {newArrivals.length > 0 && (
                      <Shelf
                        title="More to Explore"
                        items={newArrivals}
                        onSelect={setSelected}
                        onSeeAll={() => setPage("browse")}
                      />
                    )}
                  </>
                ) : (
                  <div className="empty">
                    <BookOpen size={34} />

                    <h3>No books found</h3>

                    <p>Try a different title, author, or category.</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* =========================
    BROWSE
========================= */}

        {page === "browse" && (
          <section className="browse-page">
            <div className="browse-heading">
              <div>
                <p className="eyebrow">LIBRARY COLLECTION</p>

                <h1>Browse Books</h1>

                <p>
                  Explore the complete collection and find your next great read.
                </p>
              </div>
            </div>

            <div className="browse-toolbar">
              <div className="search browse-search">
                <Search size={19} />

                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by title or author..."
                />
              </div>

              <div className="filters browse-filters">
                {categories.map((item) => (
                  <button
                    key={item}
                    className={category === item ? "selected" : ""}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="empty">
                <BookOpen size={34} />

                <h3>Opening the library...</h3>

                <p>Loading books from the collection.</p>
              </div>
            )}

            {error && !loading && (
              <div className="empty">
                <BookOpen size={34} />

                <h3>Library unavailable</h3>

                <p>{error}</p>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="empty">
                <BookOpen size={34} />

                <h3>No books found</h3>

                <p>Try a different title, author, or category.</p>
              </div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <>
                <div className="browse-results">
                  <span>
                    Showing <strong>{filtered.length}</strong>{" "}
                    {filtered.length === 1 ? "book" : "books"}
                  </span>
                </div>

                <div className="browse-grid">
                  {filtered.map((book) => (
                    <article
                      className="browse-book"
                      key={book.id}
                      onClick={() => setSelected(book)}
                    >
                      <div
                        className="browse-book-cover"
                        style={{
                          background: book.color,
                        }}
                      >
                        <span>LIBRARY</span>

                        <strong>{book.title}</strong>

                        <small>{book.author}</small>
                      </div>

                      <div className="browse-book-info">
                        <p className="eyebrow">{book.category}</p>

                        <h3>{book.title}</h3>

                        <p>by {book.author}</p>

                        <span
                          className={
                            book.available > 0
                              ? "browse-available"
                              : "browse-unavailable"
                          }
                        >
                          {book.available > 0
                            ? `${book.available} of ${book.total} available`
                            : "Currently unavailable"}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* =========================
            MY BOOKS
        ========================= */}

        {page === "my-books" && (
          <section className="my-books-page">
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR READING LIST</p>

                <h2>My Books</h2>
              </div>

              <button className="see-all" onClick={loadMyBooks}>
                Refresh
                <RotateCcw size={15} />
              </button>
            </div>

            {myBooksLoading && (
              <div className="empty">
                <BookOpen size={34} />

                <h3>Loading your books...</h3>
              </div>
            )}

            {myBooksError && !myBooksLoading && (
              <div className="empty">
                <BookOpen size={34} />

                <h3>Unable to load your books</h3>

                <p>{myBooksError}</p>
              </div>
            )}

            {returnMessage && (
              <div className="empty">
                <p>{returnMessage}</p>
              </div>
            )}

            {!myBooksLoading && !myBooksError && myBooks.length === 0 && (
              <div className="empty">
                <BookOpen size={34} />

                <h3>Your shelf is empty</h3>

                <p>Borrow a book from the library to see it here.</p>
              </div>
            )}

            {!myBooksLoading && myBooks.length > 0 && (
              <div className="my-books-grid">
                {myBooks.map((borrowing) => {
                  const book = borrowing.book;

                  return (
                    <article className="borrowed-book" key={borrowing.id}>
                      <div
                        className="borrowed-cover"
                        style={{
                          background: getBookColor(book.category.name),
                        }}
                      >
                        <span>LIBRARY</span>

                        <strong>{book.title}</strong>

                        <small>{book.author.name}</small>
                      </div>

                      <div className="borrowed-info">
                        <p className="eyebrow">{book.category.name}</p>

                        <h3>{book.title}</h3>

                        <p className="author">by {book.author.name}</p>

                        <div className="borrow-details">
                          <span>
                            Borrowed:{" "}
                            <strong>{formatDate(borrowing.borrowedAt)}</strong>
                          </span>

                          <span>
                            Due:{" "}
                            <strong>{formatDate(borrowing.dueDate)}</strong>
                          </span>

                          <span>
                            Status: <strong>{borrowing.status}</strong>
                          </span>
                        </div>

                        {borrowing.status === "BORROWED" && (
                          <button
                            className="borrow"
                            disabled={returnLoading === borrowing.id}
                            onClick={() => handleReturn(borrowing.id)}
                          >
                            {returnLoading === borrowing.id
                              ? "Returning..."
                              : "Return Book"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* =========================
    BORROWING HISTORY
========================= */}

        {page === "borrowing" && (
          <section className="borrowing-page">
            <div className="section-heading">
              <div>
                <p className="eyebrow">LIBRARY ACTIVITY</p>

                <h2>Borrowing History</h2>

                <p>View your current and previous borrowing records.</p>
              </div>

              <button className="see-all" onClick={loadMyBooks}>
                Refresh
                <RotateCcw size={15} />
              </button>
            </div>

            {myBooksLoading && (
              <div className="empty">
                <BookOpen size={34} />

                <h3>Loading borrowing records...</h3>

                <p>Retrieving your library activity.</p>
              </div>
            )}

            {myBooksError && !myBooksLoading && (
              <div className="empty">
                <BookOpen size={34} />

                <h3>Unable to load borrowing history</h3>

                <p>{myBooksError}</p>
              </div>
            )}

            {returnMessage && (
              <div className="admin-message success">{returnMessage}</div>
            )}

            {!myBooksLoading && !myBooksError && myBooks.length === 0 && (
              <div className="empty">
                <BookOpen size={34} />

                <h3>No borrowing records</h3>

                <p>
                  Your borrowing activity will appear here once you borrow a
                  book.
                </p>
              </div>
            )}

            {!myBooksLoading && !myBooksError && myBooks.length > 0 && (
              <div className="borrowing-list">
                {myBooks.map((borrowing) => {
                  const book = borrowing.book;

                  return (
                    <article className="borrowing-row" key={borrowing.id}>
                      <div
                        className="borrowing-cover"
                        style={{
                          background: getBookColor(book.category.name),
                        }}
                      >
                        <span>LIBRARY</span>

                        <strong>{book.title}</strong>
                      </div>

                      <div className="borrowing-info">
                        <p className="eyebrow">{book.category.name}</p>

                        <h3>{book.title}</h3>

                        <p>by {book.author.name}</p>
                      </div>

                      <div className="borrowing-date">
                        <span>Borrowed</span>

                        <strong>{formatDate(borrowing.borrowedAt)}</strong>
                      </div>

                      <div className="borrowing-date">
                        <span>Due</span>

                        <strong>{formatDate(borrowing.dueDate)}</strong>
                      </div>

                      <div className="borrowing-status">
                        <span
                          className={`borrowing-badge ${borrowing.status.toLowerCase()}`}
                        >
                          {borrowing.status}
                        </span>

                        {borrowing.status === "BORROWED" && (
                          <button
                            className="borrow"
                            disabled={returnLoading === borrowing.id}
                            onClick={() => handleReturn(borrowing.id)}
                          >
                            {returnLoading === borrowing.id
                              ? "Returning..."
                              : "Return"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* =========================
    BOOK READER
========================= */}

        {page === "reader" && readingBook && (
          <section className="reader-page">
            <div className="reader-header">
              <button
                className="closeReader"
                onClick={() => {
                  closeReader();
                }}
              >
                ← Back to Browse
              </button>

              <div className="reader-title">
                <p className="eyebrow">NOW READING</p>
                <h1>{readingBook.title}</h1>
                <p>by {readingBook.author}</p>
              </div>
            </div>

            {readerError ? (
              <div className="empty">
                <BookOpen size={34} />

                <h3>Unable to open book</h3>

                <p>{readerError}</p>

                <button className="see-all" onClick={() => setPage("browse")}>
                  Back to Browse
                </button>
              </div>
            ) : readerLoading ? (
              <div className="empty">
                <BookOpen size={34} />

                <h3>Opening your book...</h3>

                <p>Please wait while the digital book loads.</p>
              </div>
            ) : readerUrl ? (
              <div className="reader-container">
                <iframe
                  src={readerUrl}
                  title={readingBook.title}
                  className="book-reader"
                />
              </div>
            ) : (
              <div className="empty">
                <BookOpen size={34} />

                <h3>Digital copy unavailable</h3>

                <p>This book does not have a readable digital file.</p>
              </div>
            )}
          </section>
        )}

        {/* =========================
            ADMIN DASHBOARD
        ========================= */}

        {page === "admin" && canManageLibrary && (
          <AdminDashboard
            token={token!}
            onBooks={() => setPage("admin-books")}
            onBorrowings={() => setPage("borrowings")}
            onUsers={() => setPage("users")}
            onLibraryData={() => setPage("library-data")}
          />
        )}

        {/* =========================
            ADMIN BOOKS
        ========================= */}

        {page === "admin-books" && canManageLibrary && (
          <AdminBooks token={token!} />
        )}

        {/* =========================
            LIBRARY DATA
        ========================= */}

        {page === "library-data" && canManageLibrary && (
          <AdminLibraryData token={token!} />
        )}

        {/* =========================
            BORROWINGS
        ========================= */}

        {page === "borrowings" && canManageLibrary && (
          <AdminBorrowings token={token!} />
        )}

        {/* =========================
            USERS
        ========================= */}

        {page === "users" && isAdmin && (
          <AdminUsers token={token!} currentUserId={user!.id} />
        )}
      </main>

      <footer>© 2026 E-Library · Your digital reading room</footer>

      {/* =========================
          BOOK DETAILS MODAL
      ========================= */}

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <button
              className="close"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              <X />
            </button>

            <div
              className="modal-cover"
              style={{
                background: selected.color,
              }}
            >
              {selected.title}
            </div>

            <div className="modal-info">
              <p className="eyebrow">{selected.category}</p>

              <h2>{selected.title}</h2>

              <p className="author">by {selected.author}</p>

              <p className="availability">
                {selected.available} of {selected.total} copies available
              </p>

              {borrowMessage && <p className="availability">{borrowMessage}</p>}

              <div className="book-modal-actions">
                {selectedBorrowing && (
                  <button
                    className="read-book"
                    disabled={readerLoading}
                    onClick={handleReadBook}
                  >
                    {readerLoading ? "Opening..." : "Read Book"}
                  </button>
                )}

                <button
                  className="borrow"
                  disabled={selected.available === 0 || borrowLoading}
                  onClick={handleBorrow}
                >
                  {borrowLoading
                    ? "Borrowing..."
                    : selected.available === 0
                      ? "Unavailable"
                      : "Borrow Book"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          AUTH MODAL
      ========================= */}

      {showAuth && (
        <div className="modal-backdrop" onClick={() => setShowAuth(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <button
              className="close"
              onClick={() => setShowAuth(false)}
              aria-label="Close"
            >
              <X />
            </button>

            <div className="modal-info">
              <p className="eyebrow">
                {authMode === "login" ? "WELCOME BACK" : "JOIN THE LIBRARY"}
              </p>

              <h2>{authMode === "login" ? "Sign in" : "Create account"}</h2>

              {authMode === "register" && (
                <input
                  className="auth-input"
                  value={authName}
                  onChange={(event) => setAuthName(event.target.value)}
                  placeholder="Full name"
                />
              )}

              <input
                className="auth-input"
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="Email address"
              />

              <input
                className="auth-input"
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="Password"
              />

              {authError && <p className="availability">{authError}</p>}

              <button
                className="borrow"
                disabled={authLoading}
                onClick={handleAuth}
              >
                {authLoading
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Sign In"
                    : "Create Account"}
              </button>

              <button
                className="see-all"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");

                  setAuthError("");
                }}
              >
                {authMode === "login"
                  ? "Need an account? Register"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
