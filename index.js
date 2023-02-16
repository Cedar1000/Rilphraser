const { Configuration, OpenAIApi } = require('openai');

const dotenv = require('dotenv');
dotenv.config({ path: 'config.env' });

const express = require('express');
const cors = require('cors');

const cheerio = require('cheerio');
const axios = require('axios');
const puppeteer = require('puppeteer');

const app = express();

app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const url = 'https://renaissancelabs.org/';

app.post('/scrape-only', async (req, res) => {
  const { url } = req.body;
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    const text = await page.evaluate(() => document.body.innerText);

    await browser.close();

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
    // const html = await axios.get(url);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    const text = await page.evaluate(() => document.body.innerText);

    await browser.close();
    // const $ = cheerio.load(html.data);
    const inputArray = text.split('.');
    const middleIndex = Math.round(inputArray.length / 2);

    const firstPart = inputArray.slice(0, middleIndex).join('. ');
    const secondPart = inputArray.slice(middleIndex).join('. ');

    // const response = await openai.createEdit({
    //   model: 'code-davinci-edit-001',
    //   input: text.replace(/[\r\n]/gm, ''),
    //   instruction: 'rewrite this differently',
    // });

    const options = (text) => ({
      method: 'POST',
      url: 'https://api.textcortex.com/v1/texts/paraphrases',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TEXT_CORTEX_API_KEY}`,
      },
      data: {
        keywords: ['string'],
        max_tokens: 500,
        n: 1,
        source_lang: 'en',
        target_lang: 'en',
        temperature: 0.8,
        text,
      },
    });

    const response1 = await axios.request(options(firstPart));

    const [data1] = response1.data.data.outputs;

    const response2 = await axios.request(options(secondPart));

    const [data2] = response2.data.data.outputs;

    // console.log(response.data.choices);

    // const [result] = response.data.choices;

    res.status(200).json({
      status: 'success',
      // data: result.text,
      data: `${data1.text} ${data2.text}`,
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
    const inputArray = input.split('.');
    const middleIndex = Math.round(inputArray.length / 2);

    const firstPart = inputArray.slice(0, middleIndex).join('. ');
    const secondPart = inputArray.slice(middleIndex).join('. ');

    // const response = await openai.createEdit({
    //   model: 'code-davinci-edit-001',
    //   input: text.replace(/[\r\n]/gm, ''),
    //   instruction: 'rewrite this differently',
    // });

    const options = (text) => ({
      method: 'POST',
      url: 'https://api.textcortex.com/v1/texts/paraphrases',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TEXT_CORTEX_API_KEY}`,
      },
      data: {
        keywords: ['string'],
        max_tokens: 500,
        n: 1,
        source_lang: 'en',
        target_lang: 'en',
        temperature: 0.8,
        text,
      },
    });

    const response1 = await axios.request(options(firstPart));

    const [data1] = response1.data.data.outputs;

    const response2 = await axios.request(options(secondPart));

    const [data2] = response2.data.data.outputs;

    // console.log(response.data.choices);

    // const [result] = response.data.choices;

    res.status(200).json({
      status: 'success',
      // data: result.text,
      data: `${data1.text} ${data2.text}`,
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
