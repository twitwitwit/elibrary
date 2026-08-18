import { Router } from "express";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";
import path from "path";
import fs from "fs";
const router = Router();

// BORROW A BOOK
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { bookId, days = 14 } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: "Book ID is required",
      });
    }

    const userId = req.user.userId;

    const book = await prisma.book.findUnique({
      where: {
        id: Number(bookId),
      },
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: "No copies of this book are currently available",
      });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const result = await prisma.$transaction(async (tx) => {
      const borrowing = await tx.borrow.create({
        data: {
          userId,
          bookId: book.id,
          dueDate,
          status: "BORROWED",
        },
        include: {
          book: {
            include: {
              author: true,
              category: true,
            },
          },
        },
      });

      const updatedBook = await tx.book.update({
        where: {
          id: book.id,
        },
        data: {
          availableCopies: {
            decrement: 1,
          },
        },
      });

      return {
        borrowing,
        book: updatedBook,
      };
    });

    res.status(201).json({
      success: true,
      message: "Book borrowed successfully",
      ...result,
    });
  } catch (error) {
    console.error("Borrow error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to borrow book",
    });
  }
});

// GET CURRENT USER'S BOOKS
router.get("/my-books", authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const borrowings = await prisma.borrow.findMany({
      where: {
        userId: req.user.userId,
        status: "BORROWED",
      },
      include: {
        book: {
          include: {
            author: true,
            category: true,
          },
        },
      },
      orderBy: {
        borrowedAt: "desc",
      },
    });

    res.json({
      success: true,
      borrowings,
    });
  } catch (error) {
    console.error("My books error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch your books",
    });
  }
});

// READ A BORROWED BOOK
// READ A BORROWED BOOK
router.get(
  "/:bookId/read",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const bookId = Number(req.params.bookId);

      if (!Number.isInteger(bookId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid book ID",
        });
      }

      // User must currently have this book borrowed
      const borrowing = await prisma.borrow.findFirst({
        where: {
          userId: req.user.userId,
          bookId,
          status: "BORROWED",
        },
        include: {
          book: true,
        },
      });

      if (!borrowing) {
        return res.status(403).json({
          success: false,
          message:
            "You must borrow this book before you can read it",
        });
      }

      if (!borrowing.book.fileUrl) {
        return res.status(404).json({
          success: false,
          message:
            "This book does not have a digital file available",
        });
      }

      // Get only the filename from the stored URL
      const filename = path.basename(
        borrowing.book.fileUrl,
      );

      const filePath = path.join(
        process.cwd(),
        "uploads",
        "books",
        filename,
      );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message:
            "The digital book file could not be found",
        });
      }

      // Stream the PDF directly to the authenticated user
      res.setHeader(
        "Content-Type",
        "application/pdf",
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${filename}"`,
      );

      res.sendFile(filePath);
    } catch (error) {
      console.error("Read book error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to open book",
      });
    }
  },
);

// RETURN A BOOK
router.patch("/:id/return", authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const borrowingId = Number(req.params.id);

    const borrowing = await prisma.borrow.findUnique({
      where: {
        id: borrowingId,
      },
      include: {
        book: true,
      },
    });

    if (!borrowing) {
      return res.status(404).json({
        success: false,
        message: "Borrowing record not found",
      });
    }

    if (borrowing.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You cannot return another user's book",
      });
    }

    if (borrowing.status === "RETURNED") {
      return res.status(400).json({
        success: false,
        message: "This book has already been returned",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const returnedBorrowing = await tx.borrow.update({
        where: {
          id: borrowingId,
        },
        data: {
          returnedAt: new Date(),
          status: "RETURNED",
        },
        include: {
          book: {
            include: {
              author: true,
              category: true,
            },
          },
        },
      });

      const updatedBook = await tx.book.update({
        where: {
          id: borrowing.bookId,
        },
        data: {
          availableCopies: {
            increment: 1,
          },
        },
      });

      return {
        borrowing: returnedBorrowing,
        book: updatedBook,
      };
    });

    res.json({
      success: true,
      message: "Book returned successfully",
      ...result,
    });
  } catch (error) {
    console.error("Return error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to return book",
    });
  }
});

export default router;
