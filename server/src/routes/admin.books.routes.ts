import path from "path";
import fs from "fs";
import multer from "multer";
import { Router } from "express";
import prisma from "../lib/prisma";
import {
  authenticate,
  requireRole,
} from "../middleware/auth";

import type { AuthRequest } from "../middleware/auth";

const router = Router();

const uploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "books",
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (_req, file, cb) => {
    const safeName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9.-]/g, "-");

    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,

  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(
        new Error("Only PDF files are allowed"),
      );
    }

    cb(null, true);
  },

  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

router.use(authenticate);
router.use(requireRole("ADMIN", "LIBRARIAN"));
// UPLOAD DIGITAL BOOK
router.post(
  "/upload",
  (req, res, next) => {
    upload.single("file")(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message:
              "PDF file is too large. Maximum size is 100 MB.",
          });
        }

        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error) {
        return res.status(400).json({
          success: false,
          message:
            error.message || "Failed to upload PDF",
        });
      }

      next();
    });
  },
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "PDF file is required",
        });
      }

      const fileUrl = `/uploads/books/${req.file.filename}`;

      return res.status(201).json({
        success: true,
        message: "Digital book uploaded successfully",
        fileUrl,
      });
    } catch (error) {
      console.error(
        "Digital book upload error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to upload digital book",
      });
    }
  },
);

// GET ALL BOOKS FOR ADMIN
router.get("/", async (_req: AuthRequest, res) => {
  try {
    const books = await prisma.book.findMany({
      include: {
        author: true,
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      books,
    });
  } catch (error) {
    console.error("Admin books error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load books",
    });
  }
});

// ADD BOOK
router.post("/", async (req: AuthRequest, res) => {
  try {
    const {
      title,
      isbn,
      description,
      coverImage,
      fileUrl,
      publishedYear,
      totalCopies,
      authorId,
      categoryId,
    } = req.body;

    if (!title || !authorId || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "Title, author, and category are required",
      });
    }

    const copies = Number(totalCopies);

    if (!copies || copies < 1) {
      return res.status(400).json({
        success: false,
        message: "Total copies must be at least 1",
      });
    }

    const author = await prisma.author.findUnique({
      where: {
        id: Number(authorId),
      },
    });

    if (!author) {
      return res.status(404).json({
        success: false,
        message: "Author not found",
      });
    }

    const category = await prisma.category.findUnique({
      where: {
        id: Number(categoryId),
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const book = await prisma.book.create({
      data: {
        title: String(title),
        isbn: isbn || null,
        description: description || null,
        coverImage: coverImage || null,
        fileUrl: fileUrl || null,
        publishedYear: publishedYear
          ? Number(publishedYear)
          : null,
        totalCopies: copies,
        availableCopies: copies,
        authorId: Number(authorId),
        categoryId: Number(categoryId),
      },
      include: {
        author: true,
        category: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Book added successfully",
      book,
    });
  } catch (error) {
    console.error("Add book error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add book",
    });
  }
});

// EDIT BOOK
router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const bookId = Number(req.params.id);

    const existingBook = await prisma.book.findUnique({
      where: {
        id: bookId,
      },
    });

    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const {
      title,
      isbn,
      description,
      coverImage,
      fileUrl,
      publishedYear,
      totalCopies,
      authorId,
      categoryId,
    } = req.body;

    const updateData: any = {};

    if (title !== undefined) {
      updateData.title = String(title);
    }

    if (isbn !== undefined) {
      updateData.isbn = isbn || null;
    }

    if (description !== undefined) {
      updateData.description = description || null;
    }

    if (coverImage !== undefined) {
      updateData.coverImage = coverImage || null;
    }

    if (fileUrl !== undefined) {
      updateData.fileUrl = fileUrl || null;
    }

    if (publishedYear !== undefined) {
      updateData.publishedYear = publishedYear
        ? Number(publishedYear)
        : null;
    }

    if (authorId !== undefined) {
      const author = await prisma.author.findUnique({
        where: {
          id: Number(authorId),
        },
      });

      if (!author) {
        return res.status(404).json({
          success: false,
          message: "Author not found",
        });
      }

      updateData.authorId = Number(authorId);
    }

    if (categoryId !== undefined) {
      const category = await prisma.category.findUnique({
        where: {
          id: Number(categoryId),
        },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      updateData.categoryId = Number(categoryId);
    }

    if (totalCopies !== undefined) {
      const newTotal = Number(totalCopies);

      if (!newTotal || newTotal < 1) {
        return res.status(400).json({
          success: false,
          message: "Total copies must be at least 1",
        });
      }

      const borrowedCopies =
        existingBook.totalCopies -
        existingBook.availableCopies;

      if (newTotal < borrowedCopies) {
        return res.status(400).json({
          success: false,
          message:
            "Total copies cannot be lower than currently borrowed copies",
        });
      }

      updateData.totalCopies = newTotal;

      updateData.availableCopies =
        newTotal - borrowedCopies;
    }

    const book = await prisma.book.update({
      where: {
        id: bookId,
      },
      data: updateData,
      include: {
        author: true,
        category: true,
      },
    });

    res.json({
      success: true,
      message: "Book updated successfully",
      book,
    });
  } catch (error) {
    console.error("Update book error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update book",
    });
  }
});

// DELETE BOOK
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const bookId = Number(req.params.id);

    const book = await prisma.book.findUnique({
      where: {
        id: bookId,
      },
      include: {
        _count: {
          select: {
            borrows: true,
          },
        },
      },
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (book._count.borrows > 0) {
      return res.status(400).json({
        success: false,
        message:
          "This book cannot be deleted because it has borrowing history",
      });
    }

    await prisma.book.delete({
      where: {
        id: bookId,
      },
    });

    res.json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("Delete book error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete book",
    });
  }
});

export default router;