const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET CART (JOIN with products table)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.product_id,
        c.quantity,
        c.total_price,
        p.title,
        p.price,
        p.image
      FROM cart_items c
      JOIN products p ON c.product_id = p.product_id
      ORDER BY c.id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// ADD TO CART
router.post("/add", async (req, res) => {
  const { product_id } = req.body;

  try {
    const existing = await pool.query(
      "SELECT * FROM cart_items WHERE product_id = $1",
      [product_id]
    );

    // If already in cart → increase qty
    if (existing.rows.length > 0) {
      const updated = await pool.query(
        `UPDATE cart_items 
         SET quantity = quantity + 1,
             total_price = (quantity + 1) * (SELECT price FROM products WHERE product_id = $1)
         WHERE product_id = $1
         RETURNING *`,
        [product_id]
      );

      return res.json(updated.rows[0]);
    }

    // Insert new cart item
    const inserted = await pool.query(
      `INSERT INTO cart_items (product_id, quantity, total_price)
       VALUES ($1, 1, (SELECT price FROM products WHERE product_id = $1))
       RETURNING *`,
      [product_id]
    );

    res.json(inserted.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

// INCREASE QUANTITY
router.put("/increase/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const updated = await pool.query(
      `UPDATE cart_items
       SET quantity = quantity + 1,
           total_price = (quantity + 1) * (SELECT price FROM products WHERE product_id = cart_items.product_id)
       WHERE id = $1
       RETURNING *`,
      [id]
    );
console.log(updated);
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to increase quantity" });
  }
});

// DECREASE QUANTITY
router.put("/decrease/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const updated = await pool.query(
      `UPDATE cart_items
       SET quantity = quantity - 1,
           total_price = (quantity - 1) * (SELECT price FROM products WHERE product_id = cart_items.product_id)
       WHERE id = $1 AND quantity > 1
       RETURNING *`,
      [id]
    );

    if (updated.rows.length === 0)
      return res.json({ message: "Quantity already 1" });

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to decrease quantity" });
  }
});

// REMOVE item
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM cart_items WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove item" });
  }
});

module.exports = router;
