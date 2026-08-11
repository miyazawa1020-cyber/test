const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const port = 3001;

// ミドルウェア設定
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// JokeAPI のエンドポイント
const JOKE_API = 'https://v2.jokeapi.dev/joke/Any?type=single';

// ホームページ
app.get('/', (req, res) => {
  res.render('joke-index');
});

// ジョーク取得API
app.get('/api/joke', async (req, res) => {
  try {
    const response = await axios.get(JOKE_API);
    const joke = response.data.joke;
    res.json({ success: true, joke: joke });
  } catch (error) {
    console.error('Error fetching joke:', error.message);
    res.json({ 
      success: false, 
      joke: 'ジョークを取得できませんでした。もう一度試してください。',
      error: error.message
    });
  }
});

// プログラミングジョーク専用
app.get('/api/joke/programming', async (req, res) => {
  try {
    const response = await axios.get('https://v2.jokeapi.dev/joke/Programming?type=single');
    const joke = response.data.joke;
    res.json({ success: true, joke: joke });
  } catch (error) {
    console.error('Error fetching programming joke:', error.message);
    res.json({ 
      success: false, 
      joke: 'プログラミングジョークを取得できませんでした。',
      error: error.message
    });
  }
});

// サーバー起動
app.listen(port, () => {
  console.log(`🎭 ジョークジェネレータが http://localhost:${port} で起動しました`);
});
