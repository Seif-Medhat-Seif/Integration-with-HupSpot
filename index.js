require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
const CUSTOM_OBJECT = process.env.CUSTOM_OBJECT_TYPE;
if (!HUBSPOT_TOKEN || !CUSTOM_OBJECT) {
  console.warn('Missing HUBSPOT_TOKEN or CUSTOM_OBJECT_TYPE in .env. Add them before running.');
}

const hubspotAxios = axios.create({
  baseURL: 'https://api.hubapi.com',
  headers: {
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Homepage: list custom objects
app.get('/', async (req, res) => {
  try {
    const properties = ['name', 'publisher', 'price'];
    const url = `/crm/v3/objects/${CUSTOM_OBJECT}?limit=100&properties=${properties.join(',')}`;
    const response = await hubspotAxios.get(url);
    const items = (response.data && response.data.results) || [];
    res.render('homepage', {
      title: 'Custom Object Table',
      items,
      properties
    });
  } catch (err) {
    console.error('Error fetching custom objects', err?.response?.data || err.message);
    res.status(500).send('Error retrieving data from HubSpot API. Check server logs.');
  }
});

// GET form to add new custom object record
app.get('/update-cobj', (req, res) => {
  res.render('updates', { title: 'Update Custom Object Form | Integrating With HubSpot I Practicum' });
});

// POST create new custom object record
app.post('/update-cobj', async (req, res) => {
  try {
    const { name, publisher, price } = req.body;
    const payload = { properties: { name: name || '', publisher: publisher || '', price: price || '' } };
    const createUrl = `/crm/v3/objects/${CUSTOM_OBJECT}`;
    await hubspotAxios.post(createUrl, payload);
    res.redirect('/');
  } catch (err) {
    console.error('Error creating custom object', err?.response?.data || err.message);
    res.status(500).send('Error creating record in HubSpot. Check server logs.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));