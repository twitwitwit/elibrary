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

// GET AUTHORS
router.get("/", async (_req: AuthRequest, res) => {
  try {
    const authors = await prisma.author.findMany({
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
      authors,
    });
  } catch (error) {
    console.error("Authors error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load authors",
    });
  }
});

// ADD AUTHOR
router.post("/", async (req: AuthRequest, res) => {
  try {
    const { name, biography } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Author name is required",
      });
    }

    const existing = await prisma.author.findFirst({
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
        message: "An author with this name already exists",
      });
    }

    const author = await prisma.author.create({
      data: {
        name: String(name).trim(),
        biography: biography
          ? String(biography).trim()
          : null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Author added successfully",
      author,
    });
  } catch (error) {
    console.error("Add author error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add author",
    });
  }
});

// EDIT AUTHOR
router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { name, biography } = req.body;

    const existing = await prisma.author.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Author not found",
      });
    }

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Author name is required",
      });
    }

    const duplicate = await prisma.author.findFirst({
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
        message: "An author with this name already exists",
      });
    }

    const author = await prisma.author.update({
      where: { id },
      data: {
        name: String(name).trim(),
        biography: biography
          ? String(biography).trim()
          : null,
      },
    });

    res.json({
      success: true,
      message: "Author updated successfully",
      author,
    });
  } catch (error) {
    console.error("Update author error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update author",
    });
  }
});

// DELETE AUTHOR
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);

    const author = await prisma.author.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            books: true,
          },
        },
      },
    });

    if (!author) {
      return res.status(404).json({
        success: false,
        message: "Author not found",
      });
    }

    if (author._count.books > 0) {
      return res.status(400).json({
        success: false,
        message:
          "This author cannot be deleted because books are assigned to this author",
      });
    }

    await prisma.author.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Author deleted successfully",
    });
  } catch (error) {
    console.error("Delete author error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete author",
    });
  }
});

export default router;