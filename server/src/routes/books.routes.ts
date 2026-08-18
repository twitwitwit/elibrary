import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

// GET all books
router.get("/", async (_req, res) => {
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
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch books",
    });
  }
});
// CREATE a book
router.post("/", async (req, res) => {
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

    const book = await prisma.book.create({
      data: {
        title,
        isbn: isbn || null,
        description: description || null,
        coverImage: coverImage || null,
        fileUrl: fileUrl || null,
        publishedYear: publishedYear || null,
        totalCopies: totalCopies || 1,
        availableCopies: totalCopies || 1,
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
      book,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create book",
    });
  }
});
// GET one book
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        author: true,
        category: true,
      },
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.json({
      success: true,
      book,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch book",
    });
  }
});

export default router;