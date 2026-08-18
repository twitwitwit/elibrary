import express from "express";
import cors from "cors";
import booksRouter from "./routes/books.routes";
import authorsRouter from "./routes/authors.routes";
import categoriesRouter from "./routes/categories.routes";
import borrowingsRouter from "./routes/borrowings.routes";
import authRouter from "./routes/auth.routes";
import adminRouter from "./routes/admin.routes";
import adminBooksRouter from "./routes/admin.books.routes";
import adminAuthorsRouter from "./routes/admin.authors.routes";
import adminCategoriesRouter from "./routes/admin.categories.routes";
import adminBorrowingsRouter from "./routes/admin.borrowings.routes";
import adminUsersRouter from "./routes/admin.users.routes";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "E-Library API is running!",
  });
});

app.use("/api/books", booksRouter);
app.use("/api/authors", authorsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/borrowings", borrowingsRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin/books", adminBooksRouter);
app.use("/api/admin/authors", adminAuthorsRouter);
app.use("/api/admin/categories", adminCategoriesRouter);
app.use("/api/admin/borrowings", adminBorrowingsRouter);
app.use("/api/admin/users", adminUsersRouter);

app.listen(PORT, () => {
  console.log(`E-Library API running at http://localhost:${PORT}`);
});