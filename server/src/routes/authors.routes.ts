import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const authors = await prisma.author.findMany({
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      authors,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch authors",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, biography } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Author name is required",
      });
    }

    const author = await prisma.author.create({
      data: {
        name,
        biography: biography || null,
      },
    });

    res.status(201).json({
      success: true,
      author,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create author",
    });
  }
});

export default router;