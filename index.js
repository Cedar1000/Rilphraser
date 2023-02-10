const dotenv = require('dotenv');
dotenv.config({ path: 'config.env' });
const express = require('express');
const cors = require('cors');

const cheerio = require('cheerio');
const axios = require('axios');

const app = express();

app.use(cors());
app.use(express.json());

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
    const response = await axios.get(url);

    const $ = cheerio.load(response.data);
    const text = $('p')
      .text()
      .match(/.{1,2000}/g);

    const textSplitted = text.map(async (sentence) => {
      const rephrase = await axios.post(
        'https://api.apilayer.com/paraphraser',
        sentence,
        {
          headers: {
            // apikey: `3ZO4hkweC4pfVN3ZIE9pBbbXyrcPdoVe`,
            apiKey: process.env.API_KEY,
          },
        }
      );

      return rephrase.data;
    });

    const paraphrase = await Promise.all(textSplitted);

    const result = paraphrase.map((result) => result.paraphrased);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error(error);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
