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

// DASHBOARD STATISTICS
router.get("/dashboard", async (_req: AuthRequest, res) => {
  try {
    const now = new Date();

    const [
      totalBooks,
      availableBooks,
      activeBorrowings,
      overdueBooks,
      totalUsers,
    ] = await Promise.all([
      prisma.book.count(),

      prisma.book.aggregate({
        _sum: {
          availableCopies: true,
        },
      }),

      prisma.borrow.count({
        where: {
          status: "BORROWED",
        },
      }),

      prisma.borrow.count({
        where: {
          status: "BORROWED",
          dueDate: {
            lt: now,
          },
        },
      }),

      prisma.user.count(),
    ]);

    res.json({
      success: true,
      stats: {
        totalBooks,
        availableCopies:
          availableBooks._sum.availableCopies ?? 0,
        activeBorrowings,
        overdueBooks,
        totalUsers,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
});

// ALL USERS
router.get("/users", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Users error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load users",
    });
  }
});

// ALL BORROWINGS
router.get("/borrowings", async (_req, res) => {
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

    res.json({
      success: true,
      borrowings,
    });
  } catch (error) {
    console.error("Admin borrowings error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load borrowings",
    });
  }
});

export default router;