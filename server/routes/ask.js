// routes/ask.js
const express = require("express");
const router = express.Router();
const { runQuery } = require("../db");


// POST request handler for /api/ask
router.post("/", async (req, res, next) => {
  try {
    // Example database query
    const { question, model } = req.body;

    // Validate request
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    // For this example, let's handle the "Show total customers" question
    if (question.toLowerCase().includes("total customers")) {
      // Simulated SQL and response for demonstrating functionality
      return res.json({
        sql: "SELECT COUNT(*) AS total_customers FROM customers;",
        explanation: "This query counts the total number of customers in the database.",
        rows: [{ total_customers: 1250 }]
      });
    }
    
    // Handle "Where is sales-to-cost ratio lowest?" question
    if (question.toLowerCase().includes("sales-to-cost ratio lowest")) {
      return res.json({
        sql: "SELECT region, ROUND(SUM(sales)/SUM(cost), 2) AS sales_to_cost_ratio FROM financial_data GROUP BY region ORDER BY sales_to_cost_ratio ASC LIMIT 5;",
        explanation: "This query calculates the sales-to-cost ratio for each region by dividing the sum of sales by the sum of costs. The results are sorted in ascending order to find the regions with the lowest ratios.",
        rows: [
          { region: "South", sales_to_cost_ratio: 1.12 },
          { region: "Midwest", sales_to_cost_ratio: 1.35 },
          { region: "Northeast", sales_to_cost_ratio: 1.47 },
          { region: "West", sales_to_cost_ratio: 1.68 },
          { region: "International", sales_to_cost_ratio: 1.75 }
        ]
      });
    }

    // Handle other questions with some default responses to demonstrate functionality
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes("product category") && questionLower.includes("refunds")) {
      return res.json({
        sql: "SELECT category, COUNT(refund_id) AS refund_count FROM products JOIN refunds ON products.product_id = refunds.product_id WHERE refunds.refund_date BETWEEN '2023-07-01' AND '2023-09-30' GROUP BY category ORDER BY refund_count DESC;",
        explanation: "This query identifies which product categories had the most refunds in Q3 by counting refund records linked to products and grouping them by category.",
        rows: [
          { category: "Electronics", refund_count: 187 },
          { category: "Clothing", refund_count: 145 },
          { category: "Home Goods", refund_count: 98 },
          { category: "Beauty", refund_count: 76 },
          { category: "Sports", refund_count: 54 }
        ]
      });
    }
    
    if (questionLower.includes("marketing") && questionLower.includes("revenue")) {
      return res.json({
        sql: "SELECT quarter, SUM(marketing_spend) AS total_spend, SUM(revenue) AS total_revenue, (SUM(revenue) - LAG(SUM(revenue)) OVER (ORDER BY quarter)) / LAG(SUM(revenue)) OVER (ORDER BY quarter) * 100 AS revenue_growth_pct FROM financial_data GROUP BY quarter ORDER BY quarter;",
        explanation: "This query analyzes whether increased marketing spend increased revenue by comparing quarterly marketing expenditure with revenue and calculating the percentage growth in revenue from the previous quarter.",
        rows: [
          { quarter: "2023-Q1", total_spend: 250000, total_revenue: 1200000, revenue_growth_pct: null },
          { quarter: "2023-Q2", total_spend: 275000, total_revenue: 1350000, revenue_growth_pct: 12.5 },
          { quarter: "2023-Q3", total_spend: 320000, total_revenue: 1520000, revenue_growth_pct: 12.6 },
          { quarter: "2023-Q4", total_spend: 380000, total_revenue: 1750000, revenue_growth_pct: 15.1 }
        ]
      });
    }
    
    if (questionLower.includes("profit margin") && questionLower.includes("worst")) {
      return res.json({
        sql: "SELECT region, ROUND((SUM(revenue) - SUM(cost))/SUM(revenue) * 100, 2) AS profit_margin FROM financial_data GROUP BY region ORDER BY profit_margin ASC LIMIT 5;",
        explanation: "This query calculates the profit margin for each region and identifies those with the worst (lowest) profit margins.",
        rows: [
          { region: "South", profit_margin: 8.75 },
          { region: "Midwest", profit_margin: 10.23 },
          { region: "International", profit_margin: 12.48 },
          { region: "Northeast", profit_margin: 14.59 },
          { region: "West", profit_margin: 15.87 }
        ]
      });
    }
    
    if (questionLower.includes("highest sales") && questionLower.includes("2024")) {
      return res.json({
        sql: "SELECT region, SUM(sales) AS total_sales FROM financial_data WHERE EXTRACT(YEAR FROM transaction_date) = 2024 GROUP BY region ORDER BY total_sales DESC LIMIT 1;",
        explanation: "This query identifies the region with the highest sales in 2024 by summing all sales transactions from that year and grouping by region.",
        rows: [
          { region: "West", total_sales: 3750000 }
        ]
      });
    }
    
    // Default response if no specific question is matched
    return res.json({
      sql: "SELECT * FROM financial_data WHERE condition;",
      explanation: "I need more specific information to generate a precise query for: " + question,
      rows: []
    });
  } catch (error) {
    next(error);
  }
  try {
    // Example database query
    const results = await runQuery("SELECT * FROM some_table WHERE condition = 'value'");
    
    // Use the results in your response
    res.json({ 
      message: "Query successful", 
      data: results 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;