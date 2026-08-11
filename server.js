const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const port = 3000;

// ミドルウェア設定
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// セッション設定
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }
}));

// データベース初期化
const db = new sqlite3.Database('./login.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('SQLite データベースに接続しました');
    initializeDB();
  }
});

function initializeDB() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// ルート
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

// ログインページ
app.get('/login', (req, res) => {
  res.render('login', { message: '' });
});

// ログイン処理
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('login', { message: 'ユーザー名とパスワードを入力してください' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.render('login', { message: 'エラーが発生しました' });
    }

    if (!user) {
      return res.render('login', { message: 'ユーザー名またはパスワードが正しくありません' });
    }

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.render('login', { message: 'エラーが発生しました' });
      }

      if (isMatch) {
        req.session.userId = user.id;
        req.session.username = user.username;
        res.redirect('/dashboard');
      } else {
        res.render('login', { message: 'ユーザー名またはパスワードが正しくありません' });
      }
    });
  });
});

// 登録ページ
app.get('/register', (req, res) => {
  res.render('register', { message: '' });
});

// 登録処理
app.post('/register', (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (!username || !password || !confirmPassword) {
    return res.render('register', { message: '全てのフィールドを入力してください' });
  }

  if (password !== confirmPassword) {
    return res.render('register', { message: 'パスワードが一致しません' });
  }

  if (password.length < 6) {
    return res.render('register', { message: 'パスワードは6文字以上にしてください' });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.render('register', { message: 'エラーが発生しました' });
    }

    db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.render('register', { message: 'このユーザー名は既に使用されています' });
          }
          return res.render('register', { message: 'エラーが発生しました' });
        }

        req.session.userId = this.lastID;
        req.session.username = username;
        res.redirect('/dashboard');
      }
    );
  });
});

// ダッシュボード
app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  res.render('dashboard', { username: req.session.username });
});

// ログアウト
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send('ログアウトに失敗しました');
    }
    res.redirect('/login');
  });
});

// サーバー起動
app.listen(port, () => {
  console.log(`アプリケーションが http://localhost:${port} で起動しました`);
});