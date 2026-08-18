import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  UserRound,
  Tags,
  Search,
} from "lucide-react";

type AdminLibraryDataProps = {
  token: string;
};

type Author = {
  id: number;
  name: string;
  biography: string | null;
  _count?: {
    books: number;
  };
};

type Category = {
  id: number;
  name: string;
  description: string | null;
  _count?: {
    books: number;
  };
};

type EditingItem =
  | {
      type: "author";
      item: Author | null;
    }
  | {
      type: "category";
      item: Category | null;
    }
  | null;

const API_URL = "http://localhost:5000";

export default function AdminLibraryData({
  token,
}: AdminLibraryDataProps) {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editing, setEditing] =
    useState<EditingItem>(null);

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");

  const [authorSearch, setAuthorSearch] =
    useState("");

  const [categorySearch, setCategorySearch] =
    useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        authorsResponse,
        categoriesResponse,
      ] = await Promise.all([
        fetch(
          `${API_URL}/api/admin/authors`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),

        fetch(
          `${API_URL}/api/admin/categories`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      ]);

      const authorsData =
        await authorsResponse.json();

      const categoriesData =
        await categoriesResponse.json();

      if (!authorsResponse.ok) {
        throw new Error(
          authorsData.message ||
            "Failed to load authors",
        );
      }

      if (!categoriesResponse.ok) {
        throw new Error(
          categoriesData.message ||
            "Failed to load categories",
        );
      }

      setAuthors(
        authorsData.authors ?? [],
      );

      setCategories(
        categoriesData.categories ?? [],
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load library data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [token]);

  const filteredAuthors = useMemo(() => {
    const search =
      authorSearch.trim().toLowerCase();

    if (!search) return authors;

    return authors.filter((author) =>
      author.name
        .toLowerCase()
        .includes(search),
    );
  }, [authors, authorSearch]);

  const filteredCategories = useMemo(() => {
    const search =
      categorySearch
        .trim()
        .toLowerCase();

    if (!search) return categories;

    return categories.filter(
      (category) =>
        category.name
          .toLowerCase()
          .includes(search) ||
        (category.description ?? "")
          .toLowerCase()
          .includes(search),
    );
  }, [
    categories,
    categorySearch,
  ]);

  function openAdd(
    type: "author" | "category",
  ) {
    setEditing({
      type,
      item: null,
    });

    setName("");
    setDescription("");
    setError("");
    setMessage("");
  }

  function openEdit(
    type: "author" | "category",
    item: Author | Category,
  ) {
    setEditing({
      type,
      item,
    });

    setName(item.name);
    setDescription(
      item.description ?? "",
    );

    setError("");
    setMessage("");
  }

  function closeForm() {
    if (saving) return;

    setEditing(null);
    setName("");
    setDescription("");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editing) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!name.trim()) {
        throw new Error(
          "Name is required.",
        );
      }

      const isAuthor =
        editing.type === "author";

      const baseUrl = isAuthor
        ? `${API_URL}/api/admin/authors`
        : `${API_URL}/api/admin/categories`;

      const url = editing.item
        ? `${baseUrl}/${editing.item.id}`
        : baseUrl;

      const response = await fetch(
        url,
        {
          method: editing.item
            ? "PUT"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: name.trim(),

            [
              isAuthor
                ? "biography"
                : "description"
            ]:
              description.trim() ||
              null,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to save ${
              isAuthor
                ? "author"
                : "category"
            }`,
        );
      }

      setMessage(
        editing.item
          ? `${
              isAuthor
                ? "Author"
                : "Category"
            } updated successfully.`
          : `${
              isAuthor
                ? "Author"
                : "Category"
            } added successfully.`,
      );

      await loadData();

      setTimeout(() => {
        setEditing(null);
        setName("");
        setDescription("");
        setMessage("");
      }, 600);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to save.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    type: "author" | "category",
    item: Author | Category,
  ) {
    const label =
      type === "author"
        ? "author"
        : "category";

    const bookCount =
      item._count?.books ?? 0;

    if (bookCount > 0) {
      setError(
        `This ${label} cannot be deleted because ${bookCount} ${
          bookCount === 1
            ? "book is"
            : "books are"
        } assigned to it.`,
      );

      setMessage("");

      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${label} "${item.name}"?`,
      );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const baseUrl =
        type === "author"
          ? `${API_URL}/api/admin/authors`
          : `${API_URL}/api/admin/categories`;

      const response = await fetch(
        `${baseUrl}/${item.id}`,
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
            `Unable to delete ${label}`,
        );
      }

      setMessage(
        `${
          type === "author"
            ? "Author"
            : "Category"
        } deleted successfully.`,
      );

      await loadData();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : `Unable to delete ${label}.`,
      );
    }
  }

  return (
    <section className="admin-library-data">
      {/* HEADER */}

      <div className="admin-library-heading">
        <div>
          <p className="eyebrow">
            LIBRARY ORGANIZATION
          </p>

          <h1>
            Authors & Categories
          </h1>

          <p>
            Organize the people and
            collections behind your
            books.
          </p>
        </div>

        <button
          className="admin-refresh"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Refresh
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

      {/* CONTENT */}

      {loading ? (
        <div className="admin-library-loading">
          <RefreshCw size={30} />

          <h2>
            Organizing the shelves...
          </h2>

          <p>
            Loading authors and
            categories.
          </p>
        </div>
      ) : (
        <div className="library-data-grid">
          {/* AUTHORS */}

          <section className="library-data-card">
            <div className="library-data-card-heading">
              <div>
                <div className="library-data-icon">
                  <UserRound size={19} />
                </div>

                <h2>Authors</h2>

                <p>
                  {authors.length}{" "}
                  {authors.length === 1
                    ? "author"
                    : "authors"}
                </p>
              </div>

              <button
                className="admin-add-button"
                onClick={() =>
                  openAdd("author")
                }
              >
                <Plus size={15} />
                Add
              </button>
            </div>

            {/* AUTHOR SEARCH */}

            <div className="library-data-search">
              <Search size={16} />

              <input
                value={authorSearch}
                onChange={(event) =>
                  setAuthorSearch(
                    event.target.value,
                  )
                }
                placeholder="Search authors..."
              />
            </div>

            <div className="library-data-list">
              {filteredAuthors.length ===
              0 ? (
                <div className="library-data-empty">
                  {authors.length === 0
                    ? "No authors yet."
                    : "No matching authors."}
                </div>
              ) : (
                filteredAuthors.map(
                  (author) => {
                    const bookCount =
                      author._count
                        ?.books ?? 0;

                    return (
                      <div
                        className="library-data-row"
                        key={author.id}
                      >
                        <div>
                          <strong>
                            {author.name}
                          </strong>

                          <span>
                            {bookCount}{" "}
                            {bookCount ===
                            1
                              ? "book"
                              : "books"}
                          </span>
                        </div>

                        <div className="library-data-controls">
                          <button
                            className="data-edit"
                            title="Edit author"
                            onClick={() =>
                              openEdit(
                                "author",
                                author,
                              )
                            }
                          >
                            <Pencil
                              size={13}
                            />
                          </button>

                          <button
                            className={
                              bookCount > 0
                                ? "data-delete disabled"
                                : "data-delete"
                            }
                            title={
                              bookCount > 0
                                ? "Cannot delete an author assigned to books"
                                : "Delete author"
                            }
                            onClick={() =>
                              handleDelete(
                                "author",
                                author,
                              )
                            }
                          >
                            <Trash2
                              size={13}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  },
                )
              )}
            </div>
          </section>

          {/* CATEGORIES */}

          <section className="library-data-card">
            <div className="library-data-card-heading">
              <div>
                <div className="library-data-icon">
                  <Tags size={19} />
                </div>

                <h2>Categories</h2>

                <p>
                  {categories.length}{" "}
                  {categories.length === 1
                    ? "category"
                    : "categories"}
                </p>
              </div>

              <button
                className="admin-add-button"
                onClick={() =>
                  openAdd("category")
                }
              >
                <Plus size={15} />
                Add
              </button>
            </div>

            {/* CATEGORY SEARCH */}

            <div className="library-data-search">
              <Search size={16} />

              <input
                value={categorySearch}
                onChange={(event) =>
                  setCategorySearch(
                    event.target.value,
                  )
                }
                placeholder="Search categories..."
              />
            </div>

            <div className="library-data-list">
              {filteredCategories.length ===
              0 ? (
                <div className="library-data-empty">
                  {categories.length ===
                  0
                    ? "No categories yet."
                    : "No matching categories."}
                </div>
              ) : (
                filteredCategories.map(
                  (category) => {
                    const bookCount =
                      category._count
                        ?.books ?? 0;

                    return (
                      <div
                        className="library-data-row"
                        key={
                          category.id
                        }
                      >
                        <div>
                          <strong>
                            {
                              category.name
                            }
                          </strong>

                          <span>
                            {bookCount}{" "}
                            {bookCount ===
                            1
                              ? "book"
                              : "books"}
                          </span>
                        </div>

                        <div className="library-data-controls">
                          <button
                            className="data-edit"
                            title="Edit category"
                            onClick={() =>
                              openEdit(
                                "category",
                                category,
                              )
                            }
                          >
                            <Pencil
                              size={13}
                            />
                          </button>

                          <button
                            className={
                              bookCount > 0
                                ? "data-delete disabled"
                                : "data-delete"
                            }
                            title={
                              bookCount > 0
                                ? "Cannot delete a category assigned to books"
                                : "Delete category"
                            }
                            onClick={() =>
                              handleDelete(
                                "category",
                                category,
                              )
                            }
                          >
                            <Trash2
                              size={13}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  },
                )
              )}
            </div>
          </section>
        </div>
      )}

      {/* FORM */}

      {editing && (
        <div
          className="admin-form-backdrop"
          onClick={closeForm}
        >
          <div
            className="library-data-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="admin-form-close"
              onClick={closeForm}
              disabled={saving}
            >
              <X size={19} />
            </button>

            <div className="admin-form-header">
              <p className="eyebrow">
                {editing.type ===
                "author"
                  ? "AUTHOR"
                  : "CATEGORY"}
              </p>

              <h2>
                {editing.item
                  ? "Edit"
                  : "Add"}{" "}
                {editing.type ===
                "author"
                  ? "Author"
                  : "Category"}
              </h2>

              <p>
                {editing.type ===
                "author"
                  ? "Add the author information for your collection."
                  : "Create a category for organizing books."}
              </p>
            </div>

            <form
              className="admin-book-form"
              onSubmit={
                handleSubmit
              }
            >
              <label>
                Name *
                <input
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value,
                    )
                  }
                  placeholder={
                    editing.type ===
                    "author"
                      ? "e.g. George Orwell"
                      : "e.g. Fiction"
                  }
                  autoFocus
                />
              </label>

              <label>
                {editing.type ===
                "author"
                  ? "Biography"
                  : "Description"}

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value,
                    )
                  }
                  placeholder={
                    editing.type ===
                    "author"
                      ? "Short biography..."
                      : "Short category description..."
                  }
                  rows={4}
                />
              </label>

              {error && (
                <div className="admin-message error">
                  {error}
                </div>
              )}

              <div className="admin-form-footer">
                <button
                  type="button"
                  className="admin-cancel"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-save"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editing.item
                      ? "Save Changes"
                      : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}