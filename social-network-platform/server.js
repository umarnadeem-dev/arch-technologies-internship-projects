// ─────────────────────────────────────────────────
//  Social Network Platform — server.js
//  Express + Socket.io + JSON file database
// ─────────────────────────────────────────────────

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;
const DB_PATH = path.join(__dirname, 'database.json');

// ── Helpers ──────────────────────────────────────

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ── Middleware ────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const sessionMiddleware = session({
  secret: 'social-network-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
});
app.use(sessionMiddleware);

// Share session with Socket.io
io.engine.use(sessionMiddleware);

// Ensure uploads directory exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// ── Multer Config ────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
               allowed.test(file.mimetype.split('/')[1]);
    cb(null, !!ok);
  }
});

// ── Auth Middleware ───────────────────────────────

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

// ─────────────────────────────────────────────────
//  AUTH ROUTES
// ─────────────────────────────────────────────────

app.post('/api/register', upload.single('avatar'), (req, res) => {
  const { username, password, bio } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const db = readDB();
  if (db.users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already taken' });
  }

  const user = {
    id: uuidv4(),
    username,
    password, // plain text for simplicity
    bio: bio || '',
    avatar: req.file ? `/uploads/${req.file.filename}` : '/uploads/default-avatar.png',
    friends: [],
    friendRequests: [], // incoming
    sentRequests: [],   // outgoing
    createdAt: new Date().toISOString()
  };

  db.users.push(user);
  writeDB(db);
  res.json({ message: 'Registration successful' });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  req.session.userId = user.id;
  res.json({ message: 'Login successful', user: sanitizeUser(user) });
});

app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

app.get('/api/me', requireAuth, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.session.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(sanitizeUser(user));
});

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

// ─────────────────────────────────────────────────
//  USER / PROFILE ROUTES
// ─────────────────────────────────────────────────

app.get('/api/users', requireAuth, (req, res) => {
  const db = readDB();
  const me = req.session.userId;
  const users = db.users
    .filter(u => u.id !== me)
    .map(sanitizeUser);
  res.json(users);
});

app.get('/api/users/:id', requireAuth, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(sanitizeUser(user));
});

app.put('/api/profile', requireAuth, upload.single('avatar'), (req, res) => {
  const db = readDB();
  const idx = db.users.findIndex(u => u.id === req.session.userId);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });

  if (req.body.bio !== undefined) db.users[idx].bio = req.body.bio;
  if (req.file) db.users[idx].avatar = `/uploads/${req.file.filename}`;
  writeDB(db);
  res.json(sanitizeUser(db.users[idx]));
});

// ─────────────────────────────────────────────────
//  POST ROUTES
// ─────────────────────────────────────────────────

app.get('/api/posts', requireAuth, (req, res) => {
  const db = readDB();
  const me = db.users.find(u => u.id === req.session.userId);
  if (!me) return res.status(404).json({ error: 'User not found' });

  const friendIds = me.friends || [];

  const posts = db.posts
    .filter(p => {
      if (p.authorId === me.id) return true;            // own posts
      if (p.privacy === 'public') return true;           // public posts
      if (p.privacy === 'friends' && friendIds.includes(p.authorId)) return true;
      return false;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Attach author info
  const enriched = posts.map(p => {
    const author = db.users.find(u => u.id === p.authorId);
    return {
      ...p,
      authorName: author ? author.username : 'Unknown',
      authorAvatar: author ? author.avatar : '/uploads/default-avatar.png'
    };
  });

  res.json(enriched);
});

app.post('/api/posts', requireAuth, upload.single('image'), (req, res) => {
  const { text, privacy } = req.body;
  if (!text && !req.file) return res.status(400).json({ error: 'Post must have text or image' });

  const db = readDB();
  const author = db.users.find(u => u.id === req.session.userId);

  const post = {
    id: uuidv4(),
    authorId: req.session.userId,
    text: text || '',
    image: req.file ? `/uploads/${req.file.filename}` : null,
    privacy: privacy || 'public',
    likes: [],
    comments: [],
    createdAt: new Date().toISOString()
  };

  db.posts.push(post);
  writeDB(db);

  const enriched = {
    ...post,
    authorName: author.username,
    authorAvatar: author.avatar
  };

  // Broadcast to all connected users
  io.emit('new-post', enriched);
  res.json(enriched);
});

app.post('/api/posts/:id/like', requireAuth, (req, res) => {
  const db = readDB();
  const post = db.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const userId = req.session.userId;
  const idx = post.likes.indexOf(userId);
  if (idx === -1) {
    post.likes.push(userId);

    // Notify post author
    if (post.authorId !== userId) {
      const liker = db.users.find(u => u.id === userId);
      const notification = {
        id: uuidv4(),
        userId: post.authorId,
        type: 'like',
        message: `${liker.username} liked your post`,
        postId: post.id,
        fromUserId: userId,
        read: false,
        createdAt: new Date().toISOString()
      };
      db.notifications.push(notification);
      io.to(post.authorId).emit('notification', notification);
    }
  } else {
    post.likes.splice(idx, 1); // unlike
  }

  writeDB(db);
  io.emit('post-liked', { postId: post.id, likes: post.likes });
  res.json({ likes: post.likes });
});

app.post('/api/posts/:id/comment', requireAuth, (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Comment text required' });

  const db = readDB();
  const post = db.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const userId = req.session.userId;
  const commenter = db.users.find(u => u.id === userId);

  const comment = {
    id: uuidv4(),
    userId,
    username: commenter.username,
    avatar: commenter.avatar,
    text,
    createdAt: new Date().toISOString()
  };

  post.comments.push(comment);

  // Notify post author
  if (post.authorId !== userId) {
    const notification = {
      id: uuidv4(),
      userId: post.authorId,
      type: 'comment',
      message: `${commenter.username} commented on your post`,
      postId: post.id,
      fromUserId: userId,
      read: false,
      createdAt: new Date().toISOString()
    };
    db.notifications.push(notification);
    io.to(post.authorId).emit('notification', notification);
  }

  writeDB(db);
  io.emit('new-comment', { postId: post.id, comment });
  res.json(comment);
});

// ─────────────────────────────────────────────────
//  FRIEND ROUTES
// ─────────────────────────────────────────────────

app.post('/api/friends/request', requireAuth, (req, res) => {
  const { targetId } = req.body;
  const db = readDB();
  const me = db.users.find(u => u.id === req.session.userId);
  const target = db.users.find(u => u.id === targetId);

  if (!target) return res.status(404).json({ error: 'User not found' });
  if (me.id === target.id) return res.status(400).json({ error: 'Cannot friend yourself' });
  if (me.friends.includes(targetId)) return res.status(400).json({ error: 'Already friends' });
  if (me.sentRequests.includes(targetId)) return res.status(400).json({ error: 'Request already sent' });

  me.sentRequests.push(targetId);
  target.friendRequests.push(me.id);

  const notification = {
    id: uuidv4(),
    userId: targetId,
    type: 'friend-request',
    message: `${me.username} sent you a friend request`,
    fromUserId: me.id,
    read: false,
    createdAt: new Date().toISOString()
  };
  db.notifications.push(notification);

  writeDB(db);

  io.to(targetId).emit('friend-request', { from: sanitizeUser(me) });
  io.to(targetId).emit('notification', notification);

  res.json({ message: 'Friend request sent' });
});

app.post('/api/friends/accept', requireAuth, (req, res) => {
  const { fromId } = req.body;
  const db = readDB();
  const me = db.users.find(u => u.id === req.session.userId);
  const from = db.users.find(u => u.id === fromId);

  if (!from) return res.status(404).json({ error: 'User not found' });

  // Remove from requests
  me.friendRequests = me.friendRequests.filter(id => id !== fromId);
  from.sentRequests = from.sentRequests.filter(id => id !== me.id);

  // Add to friends
  if (!me.friends.includes(fromId)) me.friends.push(fromId);
  if (!from.friends.includes(me.id)) from.friends.push(me.id);

  const notification = {
    id: uuidv4(),
    userId: fromId,
    type: 'friend-accepted',
    message: `${me.username} accepted your friend request`,
    fromUserId: me.id,
    read: false,
    createdAt: new Date().toISOString()
  };
  db.notifications.push(notification);

  writeDB(db);

  io.to(fromId).emit('notification', notification);
  io.to(fromId).emit('friend-accepted', { user: sanitizeUser(me) });

  res.json({ message: 'Friend request accepted' });
});

app.post('/api/friends/reject', requireAuth, (req, res) => {
  const { fromId } = req.body;
  const db = readDB();
  const me = db.users.find(u => u.id === req.session.userId);
  const from = db.users.find(u => u.id === fromId);

  if (!from) return res.status(404).json({ error: 'User not found' });

  me.friendRequests = me.friendRequests.filter(id => id !== fromId);
  from.sentRequests = from.sentRequests.filter(id => id !== me.id);

  writeDB(db);
  res.json({ message: 'Friend request rejected' });
});

app.get('/api/friends', requireAuth, (req, res) => {
  const db = readDB();
  const me = db.users.find(u => u.id === req.session.userId);
  if (!me) return res.status(404).json({ error: 'User not found' });

  const friends = me.friends.map(fid => {
    const f = db.users.find(u => u.id === fid);
    return f ? sanitizeUser(f) : null;
  }).filter(Boolean);

  const requests = me.friendRequests.map(rid => {
    const r = db.users.find(u => u.id === rid);
    return r ? sanitizeUser(r) : null;
  }).filter(Boolean);

  res.json({ friends, requests });
});

// ─────────────────────────────────────────────────
//  NOTIFICATION ROUTES
// ─────────────────────────────────────────────────

app.get('/api/notifications', requireAuth, (req, res) => {
  const db = readDB();
  const notifs = db.notifications
    .filter(n => n.userId === req.session.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(notifs);
});

app.put('/api/notifications/read', requireAuth, (req, res) => {
  const db = readDB();
  db.notifications.forEach(n => {
    if (n.userId === req.session.userId) n.read = true;
  });
  writeDB(db);
  res.json({ message: 'All notifications marked as read' });
});

// ── Default route ────────────────────────────────

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// ─────────────────────────────────────────────────
//  SOCKET.IO
// ─────────────────────────────────────────────────

io.on('connection', (socket) => {
  const userId = socket.request.session?.userId;
  if (userId) {
    socket.join(userId); // join personal room for targeted notifications
    console.log(`✓ User ${userId} connected via WebSocket`);
  }

  socket.on('disconnect', () => {
    if (userId) console.log(`✗ User ${userId} disconnected`);
  });
});

// ─────────────────────────────────────────────────
//  START SERVER
// ─────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`\n🚀 Social Network Platform running on http://localhost:${PORT}\n`);
});
