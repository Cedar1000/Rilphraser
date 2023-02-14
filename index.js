const { Configuration, OpenAIApi, createEdit } = require('openai');

const dotenv = require('dotenv');
dotenv.config({ path: 'config.env' });

const express = require('express');
const cors = require('cors');

const cheerio = require('cheerio');
const axios = require('axios');

const app = express();

app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  organization: 'org-pR5f7p7el93EFBbWk8OJ8QOa',
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const url = 'https://renaissancelabs.org/';

app.post('/scrape-only', async (req, res) => {
  const { url } = req.body;
  try {
    const response = await axios.get(url);

    const $ = cheerio.load(response.data);
    const text = $('p').text();

    res.status(200).json({
      status: 'success',
      data: text,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 'error',
      message: error.response,
    });
  }
});

app.post('/scrape-and-rewrite', async (req, res) => {
  const { url } = req.body;

  try {
    const html = await axios.get(url);

    const $ = cheerio.load(html.data);
    const input = $('p').text();
    console.log(input);

    const response = await openai.createEdit({
      model: 'code-davinci-edit-001',
      input,
      instruction: 'rewrite the sentence in another way',
    });

    const [result] = response.data.choices;

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: 'failed',
      data: error,
    });
  }
});

app.post('/rewrite-only', async (req, res) => {
  const { input } = req.body;

  try {
    const response = await openai.createEdit({
      model: 'code-davinci-edit-001',
      input,
      instruction: 'rewrite the sentence in another way',
    });

    const [result] = response.data.choices;

    res.status(200).json({
      status: 'success',
      data: result.text.replace(/[\r\n]/gm, ''),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'Failed',
      data: error,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
