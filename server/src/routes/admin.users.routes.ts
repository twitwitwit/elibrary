import { Router } from "express";
import prisma from "../lib/prisma";
import {
  authenticate,
  requireRole,
} from "../middleware/auth";

import type { AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authenticate);
router.use(requireRole("ADMIN"));

/* GET ALL USERS */
router.get("/", async (_req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            borrows: true,
          },
        },
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
    console.error("Admin users error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load users",
    });
  }
});

/* CHANGE USER ROLE */
router.patch("/:id/role", async (req: AuthRequest, res) => {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;

    const allowedRoles = [
      "STUDENT",
      "LIBRARIAN",
      "ADMIN",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    if (req.user?.userId === userId) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot change your own role",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Role update error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update user role",
    });
  }
});

/* DELETE USER */
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = Number(req.params.id);

    if (req.user?.userId === userId) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot delete your own account",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        _count: {
          select: {
            borrows: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user._count.borrows > 0) {
      return res.status(400).json({
        success: false,
        message:
          "This user cannot be deleted because they have borrowing history",
      });
    }

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
});

export default router;