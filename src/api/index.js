const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/:formId/filteredResponses', async (req, res) => {
  try {
      const formId = req.params.formId;
      const filters = JSON.parse(JSON.parse(req.query.filters || '[]'));
      const response = await axios.get(`https://api.fillout.com/v1/api/forms/${formId}/submissions`, {
          headers: {
              Authorization: `Bearer ${process.env.API_KEY}`
          }
      });
      const filteredResponses = response.data.responses.filter(response => {
          return satisfiesFilters(response.questions, filters);
      });

      res.json({
          responses: filteredResponses,
          totalResponses: filteredResponses.length,
          pageCount: 1
      });
  } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

function satisfiesFilters(questions, filters) {
  return filters.every(filter => {
      const question = questions.find(q => q.id === filter.id);
      if (!question) return false;

      switch (filter.condition) {
          case 'equals':
              return question.value === filter.value;
          case 'does_not_equal':
              return question.value !== filter.value;
          case 'greater_than':
              return new Date(question.value) > new Date(filter.value);
          case 'less_than':
              return new Date(question.value) < new Date(filter.value);
          default:
              return false;
      }
  });
}


module.exports = router;
