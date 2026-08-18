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

// GET CATEGORIES
router.get("/", async (_req: AuthRequest, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            books: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Categories error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load categories",
    });
  }
});

// ADD CATEGORY
router.post("/", async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const existing = await prisma.category.findFirst({
      where: {
        name: {
          equals: String(name).trim(),
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A category with this name already exists",
      });
    }

    const category = await prisma.category.create({
      data: {
        name: String(name).trim(),
        description: description
          ? String(description).trim()
          : null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Category added successfully",
      category,
    });
  } catch (error) {
    console.error("Add category error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add category",
    });
  }
});

// EDIT CATEGORY
router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description } = req.body;

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const duplicate = await prisma.category.findFirst({
      where: {
        name: {
          equals: String(name).trim(),
          mode: "insensitive",
        },
        NOT: {
          id,
        },
      },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "A category with this name already exists",
      });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: String(name).trim(),
        description: description
          ? String(description).trim()
          : null,
      },
    });

    res.json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Update category error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
});

// DELETE CATEGORY
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            books: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (category._count.books > 0) {
      return res.status(400).json({
        success: false,
        message:
          "This category cannot be deleted because books are assigned to it",
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
});

export default router;