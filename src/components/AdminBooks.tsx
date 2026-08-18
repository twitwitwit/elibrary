import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  BookOpen,
  Search,
} from "lucide-react";

type AdminBooksProps = {
  token: string;
};

type Author = {
  id: number;
  name: string;
};

type Category = {
  id: number;
  name: string;
};

type Book = {
  id: number;
  title: string;
  isbn: string | null;
  description: string | null;
  coverImage: string | null;
  fileUrl: string | null;
  publishedYear: number | null;
  totalCopies: number;
  availableCopies: number;
  authorId: number;
  categoryId: number;
  author: Author;
  category: Category;
};

type CategoryFilter = "ALL" | string;

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
  return categoryColors[category] ?? "#4c1d4f";
}

const emptyForm = {
  title: "",
  isbn: "",
  description: "",
  coverImage: "",
  fileUrl: "",
  publishedYear: "",
  totalCopies: "1",
  authorId: "",
  categoryId: "",
};

export default function AdminBooks({ token }: AdminBooksProps) {
  const [books, setBooks] = useState<Book[]>([]);

  const [authors, setAuthors] = useState<Author[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const [form, setForm] = useState(emptyForm);

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploadingFile, setUploadingFile] = useState(false);

  async function loadBooks() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/admin/books`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load books");
      }

      setBooks(data.books ?? []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Unable to load books.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadAuthorsAndCategories() {
    try {
      const [authorsResponse, categoriesResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/authors`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch(`${API_URL}/api/admin/categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (authorsResponse.ok) {
        const authorsData = await authorsResponse.json();

        setAuthors(authorsData.authors ?? []);
      }

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();

        setCategories(categoriesData.categories ?? []);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadBooks();
    loadAuthorsAndCategories();
  }, [token]);

  const filteredBooks = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return books.filter((book) => {
      const matchesSearch =
        !searchText ||
        book.title.toLowerCase().includes(searchText) ||
        book.author.name.toLowerCase().includes(searchText) ||
        (book.isbn ?? "").toLowerCase().includes(searchText);

      const matchesCategory =
        categoryFilter === "ALL" || book.category.name === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [books, search, categoryFilter]);

  function openAddForm() {
    setEditingBook(null);
    setSelectedFile(null);

    setForm({
      ...emptyForm,
      authorId: authors[0] ? String(authors[0].id) : "",
      categoryId: categories[0] ? String(categories[0].id) : "",
    });

    setMessage("");
    setError("");
    setShowForm(true);
  }

  function openEditForm(book: Book) {
    setEditingBook(book);
    setSelectedFile(null);

    setForm({
      title: book.title,
      isbn: book.isbn ?? "",
      description: book.description ?? "",
      coverImage: book.coverImage ?? "",
      fileUrl: book.fileUrl ?? "",
      publishedYear: book.publishedYear ? String(book.publishedYear) : "",
      totalCopies: String(book.totalCopies),
      authorId: String(book.authorId),
      categoryId: String(book.categoryId),
    });

    setMessage("");
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingBook(null);
    setForm(emptyForm);
    setSelectedFile(null);
  }

  function updateForm(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function uploadDigitalBook() {
    if (!selectedFile) {
      return form.fileUrl || null;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploadingFile(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/books/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload PDF");
      }

      return data.fileUrl as string;
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!form.title.trim()) {
        throw new Error("Book title is required.");
      }

      if (!form.authorId) {
        throw new Error("Please select an author.");
      }

      if (!form.categoryId) {
        throw new Error("Please select a category.");
      }

      const totalCopies = Number(form.totalCopies);

      if (!Number.isInteger(totalCopies) || totalCopies < 1) {
        throw new Error("Total copies must be at least 1.");
      }

      const uploadedFileUrl = await uploadDigitalBook();

      const payload = {
        title: form.title.trim(),
        isbn: form.isbn.trim() || null,
        description: form.description.trim() || null,
        coverImage: form.coverImage.trim() || null,
        fileUrl: uploadedFileUrl || null,
        publishedYear: form.publishedYear ? Number(form.publishedYear) : null,
        totalCopies,
        authorId: Number(form.authorId),
        categoryId: Number(form.categoryId),
      };

      const url = editingBook
        ? `${API_URL}/api/admin/books/${editingBook.id}`
        : `${API_URL}/api/admin/books`;

      const response = await fetch(url, {
        method: editingBook ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save book");
      }

      setMessage(
        editingBook ? "Book updated successfully." : "Book added successfully.",
      );

      await loadBooks();

      setTimeout(() => {
        setShowForm(false);
        setEditingBook(null);
        setForm(emptyForm);
        setSelectedFile(null);
        setMessage("");
      }, 600);
    } catch (error) {
      console.error(error);

      setError(error instanceof Error ? error.message : "Unable to save book.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(book: Book) {
    const confirmed = window.confirm(`Delete "${book.title}"?`);

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/api/admin/books/${book.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete book");
      }

      setMessage("Book deleted successfully.");

      await loadBooks();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Unable to delete book.",
      );
    }
  }

  return (
    <section className="admin-books">
      {/* HEADER */}

      <div className="admin-books-heading">
        <div>
          <p className="eyebrow">COLLECTION MANAGEMENT</p>

          <h2>Books</h2>

          <p>Add, edit, and manage the books in your library.</p>
        </div>

        <div className="admin-books-actions">
          <button
            className="admin-refresh"
            onClick={loadBooks}
            disabled={loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button className="admin-add-button" onClick={openAddForm}>
            <Plus size={16} />
            Add Book
          </button>
        </div>
      </div>

      {/* SEARCH + FILTER */}

      <div className="admin-books-toolbar">
        <div className="admin-books-search">
          <Search size={18} />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, author, or ISBN..."
          />
        </div>

        <select
          className="admin-books-category-filter"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="ALL">All categories</option>

          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* RESULTS */}

      {!loading && books.length > 0 && (
        <p className="admin-books-result-count">
          Showing <strong>{filteredBooks.length}</strong> of{" "}
          <strong>{books.length}</strong> books
        </p>
      )}

      {message && <div className="admin-message success">{message}</div>}

      {error && <div className="admin-message error">{error}</div>}

      {/* LOADING */}

      {loading ? (
        <div className="admin-books-empty">
          <BookOpen size={34} />

          <h3>Opening the collection...</h3>

          <p>Loading books from the database.</p>
        </div>
      ) : books.length === 0 ? (
        <div className="admin-books-empty">
          <BookOpen size={34} />

          <h3>No books yet</h3>

          <p>Add your first book to the library.</p>

          <button className="admin-add-button" onClick={openAddForm}>
            <Plus size={16} />
            Add First Book
          </button>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="admin-books-empty">
          <Search size={34} />

          <h3>No matching books</h3>

          <p>Try a different search or category.</p>
        </div>
      ) : (
        <div className="admin-book-list">
          {filteredBooks.map((book) => {
            const isAvailable = book.availableCopies > 0;

            return (
              <article className="admin-book-row" key={book.id}>
                {/* COVER */}

                <div
                  className="admin-book-cover"
                  style={{
                    background: getBookColor(book.category.name),
                  }}
                >
                  <span>LIBRARY</span>

                  <strong>{book.title}</strong>

                  <small>{book.author.name}</small>
                </div>

                {/* DETAILS */}

                <div className="admin-book-details">
                  <p className="eyebrow">{book.category.name}</p>

                  <h3>{book.title}</h3>

                  <p className="admin-book-author">{book.author.name}</p>

                  <div className="admin-book-meta">
                    {book.publishedYear && (
                      <span>Published {book.publishedYear}</span>
                    )}

                    <span>
                      {book.totalCopies}{" "}
                      {book.totalCopies === 1 ? "copy" : "copies"}
                    </span>

                    <span
                      className={
                        isAvailable ? "book-available" : "book-unavailable"
                      }
                    >
                      {book.availableCopies} available
                    </span>

                    {book.isbn && <span>ISBN {book.isbn}</span>}
                  </div>
                </div>

                {/* AVAILABILITY */}

                <div className="admin-book-availability">
                  <span
                    className={
                      isAvailable
                        ? "availability-dot available"
                        : "availability-dot unavailable"
                    }
                  />

                  <div>
                    <strong>
                      {book.availableCopies} / {book.totalCopies}
                    </strong>

                    <span>{isAvailable ? "Available" : "Unavailable"}</span>
                  </div>
                </div>

                {/* CONTROLS */}

                <div className="admin-book-controls">
                  <button
                    className="admin-edit"
                    onClick={() => openEditForm(book)}
                  >
                    <Pencil size={15} />
                    Edit
                  </button>

                  <button
                    className="admin-delete"
                    onClick={() => handleDelete(book)}
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT MODAL */}

      {showForm && (
        <div className="admin-form-backdrop" onClick={closeForm}>
          <div
            className="admin-form-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="admin-form-close"
              onClick={closeForm}
              disabled={saving || uploadingFile}
            >
              <X size={19} />
            </button>

            <div className="admin-form-header">
              <p className="eyebrow">
                {editingBook ? "EDIT COLLECTION" : "NEW COLLECTION"}
              </p>

              <h2>{editingBook ? "Edit Book" : "Add Book"}</h2>

              <p>Enter the details for this library book.</p>
            </div>

            <form className="admin-book-form" onSubmit={handleSubmit}>
              <label>
                Book Title *
                <input
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  placeholder="e.g. The Great Gatsby"
                />
              </label>

              <div className="admin-form-grid">
                <label>
                  Author *
                  <select
                    value={form.authorId}
                    onChange={(event) =>
                      updateForm("authorId", event.target.value)
                    }
                  >
                    <option value="">Select author</option>

                    {authors.map((author) => (
                      <option key={author.id} value={author.id}>
                        {author.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Category *
                  <select
                    value={form.categoryId}
                    onChange={(event) =>
                      updateForm("categoryId", event.target.value)
                    }
                  >
                    <option value="">Select category</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="admin-form-grid">
                <label>
                  Published Year
                  <input
                    type="number"
                    value={form.publishedYear}
                    onChange={(event) =>
                      updateForm("publishedYear", event.target.value)
                    }
                    placeholder="1925"
                  />
                </label>

                <label>
                  Total Copies *
                  <input
                    type="number"
                    min="1"
                    value={form.totalCopies}
                    onChange={(event) =>
                      updateForm("totalCopies", event.target.value)
                    }
                  />
                </label>
              </div>

              <label>
                ISBN
                <input
                  value={form.isbn}
                  onChange={(event) => updateForm("isbn", event.target.value)}
                  placeholder="978-..."
                />
              </label>

              <label>
                Description
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  placeholder="Short description of the book..."
                  rows={4}
                />
              </label>

              <label>
                Cover Image URL
                <input
                  value={form.coverImage}
                  onChange={(event) =>
                    updateForm("coverImage", event.target.value)
                  }
                  placeholder="https://..."
                />
              </label>

              <label>
                Digital Book (PDF)
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;

                    setSelectedFile(file);
                  }}
                />
                {selectedFile && (
                  <small className="admin-file-name">
                    Selected: {selectedFile.name}
                  </small>
                )}
                {!selectedFile && form.fileUrl && (
                  <small className="admin-file-name">
                    A digital file is already attached.
                  </small>
                )}
              </label>

              {error && <div className="admin-message error">{error}</div>}

              {message && (
                <div className="admin-message success">{message}</div>
              )}

              <div className="admin-form-footer">
                <button
                  type="button"
                  className="admin-cancel"
                  onClick={closeForm}
                  disabled={saving || uploadingFile}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-save"
                  disabled={saving || uploadingFile}
                >
                  {uploadingFile
                    ? "Uploading PDF..."
                    : saving
                      ? "Saving..."
                      : editingBook
                        ? "Save Changes"
                        : "Add Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
