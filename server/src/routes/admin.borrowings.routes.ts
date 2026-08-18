import { Router } from "express";
import prisma from "../lib/prisma";
import {
  authenticate,
  requireRole,
} from "../middleware/auth";

import type { AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authenticate);
router.use(requireRole("ADMIN", "LIBRARIAN"));

// GET ALL BORROWINGS
router.get("/", async (_req: AuthRequest, res) => {
  try {
    const borrowings = await prisma.borrow.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    const now = new Date();

    const formattedBorrowings = borrowings.map(
      (borrowing) => ({
        ...borrowing,
        isOverdue:
          borrowing.status === "BORROWED" &&
          borrowing.dueDate < now,
      }),
    );

    res.json({
      success: true,
      borrowings: formattedBorrowings,
    });
  } catch (error) {
    console.error("Borrowings error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load borrowings",
    });
  }
});

// RETURN A BOOK
router.patch("/:id/return", async (req: AuthRequest, res) => {
  try {
    const borrowId = Number(req.params.id);

    const borrowing = await prisma.borrow.findUnique({
      where: {
        id: borrowId,
      },
    });

    if (!borrowing) {
      return res.status(404).json({
        success: false,
        message: "Borrowing record not found",
      });
    }

    if (borrowing.status === "RETURNED") {
      return res.status(400).json({
        success: false,
        message: "This book has already been returned",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const returnedBorrow = await tx.borrow.update({
        where: {
          id: borrowId,
        },
        data: {
          status: "RETURNED",
          returnedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          book: {
            include: {
              author: true,
              category: true,
            },
          },
        },
      });

      await tx.book.update({
        where: {
          id: borrowing.bookId,
        },
        data: {
          availableCopies: {
            increment: 1,
          },
        },
      });

      return returnedBorrow;
    });

    res.json({
      success: true,
      message: "Book returned successfully",
      borrowing: result,
    });
  } catch (error) {
    console.error("Admin return error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to return book",
    });
  }
});

export default router;