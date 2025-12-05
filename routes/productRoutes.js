const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET all products
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY product_id DESC");
    res.status(200).json(result.rows);
    console.log()
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET product by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM products WHERE product_id = $1",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Product not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// CREATE product
router.post("/", async (req, res) => {
  const { title, price, description, category, image } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO products (title, price, description, category, image)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, price, description, category, image]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add product" });
  }
});

// UPDATE product
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, price, description, category, image } = req.body;

  try {
    const result = await pool.query(
      `UPDATE products
       SET title = $1, price = $2, description = $3, category = $4, image = $5
       WHERE product_id = $6
       RETURNING *`,
      [title, price, description, category, image, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// DELETE product
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM products WHERE product_id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;
