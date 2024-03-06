const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/:formId/filteredResponses',validateFilterParams, async (req, res) => {
  try {
      const formId = req.params.formId;
      const filters = req.query.filters ? JSON.parse(JSON.parse(req.query.filters)) : [];
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
    console.log(error)
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

function validateFilterParams(req, res, next) {
    const filters = req.query.filters ? JSON.parse(req.query.filters) : [];
    if (!filters || !filters.length) {
        next();
        return;
    }

    try {
        const parsedFilters = JSON.parse(filters);
        if (!Array.isArray(parsedFilters)) {
            throw new Error('Filters must be an array');
        }
        for (const filter of parsedFilters) {
            if (!filter.id || !filter.condition || !filter.value) {
                throw new Error('Each filter object must have id, condition, and value properties');
            }
        }
        req.parsedFilters = parsedFilters;
        next();
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

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
