// ─────────────────────────────────────────────────
//  Social Network Platform — Client-Side App
//  Handles auth, posts, friends, notifications,
//  and Socket.io real-time updates.
// ─────────────────────────────────────────────────

let currentUser = null;
let socket = null;

// ── Init ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/me');
    if (!res.ok) {
      window.location.href = 'login.html';
      return;
    }
    currentUser = await res.json();
    initDashboard();
  } catch {
    window.location.href = 'login.html';
  }
});

// ── Dashboard Init ───────────────────────────────

function initDashboard() {
  // Populate nav
  document.getElementById('navUsername').textContent = currentUser.username;
  document.getElementById('navAvatar').style.backgroundImage = `url('${currentUser.avatar}')`;

  // Populate profile sidebar
  document.getElementById('profileAvatar').src = currentUser.avatar;
  document.getElementById('profileName').textContent = currentUser.username;
  document.getElementById('profileBio').textContent = currentUser.bio || 'No bio yet';

  // Composer avatar
  document.getElementById('composerAvatar').src = currentUser.avatar;

  // Edit profile form
  document.getElementById('editBio').value = currentUser.bio || '';

  // Wire up events
  setupNavigation();
  setupPostComposer();
  setupEditProfile();
  setupLogout();
  setupSearch();
  setupNotifications();

  // Load data
  loadFeed();
  loadFriendsSidebar();
  loadNotifications();

  // Connect socket
  connectSocket();
}

// ── Navigation ───────────────────────────────────

function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;

      // Toggle active
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // Show section
      document.getElementById('feedSection').style.display = section === 'feed' ? '' : 'none';
      document.getElementById('friendsSection').style.display = section === 'friends' ? '' : 'none';
      document.getElementById('profileSection').style.display = section === 'profile' ? '' : 'none';

      if (section === 'friends') loadFriendsPage();
      if (section === 'feed') loadFeed();
    });
  });
}

// ── Post Composer ────────────────────────────────

function setupPostComposer() {
  const postImage = document.getElementById('postImage');
  postImage.addEventListener('change', () => {
    document.getElementById('postImageName').textContent = postImage.files[0]?.name || '';
  });

  document.getElementById('postBtn').addEventListener('click', createPost);
}

async function createPost() {
  const text = document.getElementById('postText').value.trim();
  const imageFile = document.getElementById('postImage').files[0];
  const privacy = document.getElementById('postPrivacy').value;

  if (!text && !imageFile) return;

  const formData = new FormData();
  if (text) formData.append('text', text);
  if (imageFile) formData.append('image', imageFile);
  formData.append('privacy', privacy);

  try {
    const res = await fetch('/api/posts', { method: 'POST', body: formData });
    if (res.ok) {
      document.getElementById('postText').value = '';
      document.getElementById('postImage').value = '';
      document.getElementById('postImageName').textContent = '';
    }
  } catch (err) {
    console.error('Error creating post:', err);
  }
}

// ── Feed ─────────────────────────────────────────

async function loadFeed() {
  try {
    const res = await fetch('/api/posts');
    const posts = await res.json();
    renderFeed(posts);
  } catch (err) {
    console.error('Error loading feed:', err);
  }
}

function renderFeed(posts) {
  const container = document.getElementById('feedContainer');
  if (!posts.length) {
    container.innerHTML = '<div class="empty-state">No posts yet. Be the first to post!</div>';
    return;
  }
  container.innerHTML = posts.map(post => renderPostCard(post)).join('');
}

function renderPostCard(post) {
  const isLiked = post.likes.includes(currentUser.id);
  const timeAgo = getTimeAgo(post.createdAt);
  const privacyIcon = post.privacy === 'friends' ? '🔒 Friends' : '🌍 Public';

  const commentsHTML = post.comments.map(c => `
    <div class="comment-item">
      <img src="${escapeHTML(c.avatar)}" alt="${escapeHTML(c.username)}">
      <div>
        <div class="comment-bubble">
          <strong>${escapeHTML(c.username)}</strong>
          <p>${escapeHTML(c.text)}</p>
        </div>
        <div class="comment-time">${getTimeAgo(c.createdAt)}</div>
      </div>
    </div>
  `).join('');

  return `
    <div class="post-card" id="post-${post.id}">
      <div class="post-header">
        <img src="${escapeHTML(post.authorAvatar)}" alt="${escapeHTML(post.authorName)}">
        <div>
          <div class="post-author">${escapeHTML(post.authorName)}</div>
          <div class="post-meta">${timeAgo} <span class="post-privacy-badge">${privacyIcon}</span></div>
        </div>
      </div>
      <div class="post-body">
        ${post.text ? `<p>${escapeHTML(post.text)}</p>` : ''}
        ${post.image ? `<img src="${escapeHTML(post.image)}" alt="Post image" class="post-image">` : ''}
      </div>
      <div class="post-stats">
        <span>❤️ ${post.likes.length} like${post.likes.length !== 1 ? 's' : ''}</span>
        <span>💬 ${post.comments.length} comment${post.comments.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="post-actions">
        <button class="post-action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
          ${isLiked ? '❤️' : '🤍'} Like
        </button>
        <button class="post-action-btn" onclick="toggleComments('${post.id}')">
          💬 Comment
        </button>
      </div>
      <div class="comments-section" id="comments-${post.id}" style="display:none;">
        <div id="comments-list-${post.id}">${commentsHTML}</div>
        <div class="comment-input-row">
          <img src="${escapeHTML(currentUser.avatar)}" alt="" class="avatar-sm" style="width:32px;height:32px;">
          <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." onkeydown="if(event.key==='Enter')submitComment('${post.id}')">
          <button class="btn btn-primary btn-sm" onclick="submitComment('${post.id}')">Send</button>
        </div>
      </div>
    </div>
  `;
}

// ── Like ─────────────────────────────────────────

async function toggleLike(postId) {
  try {
    await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
  } catch (err) {
    console.error('Error toggling like:', err);
  }
}

// ── Comments ─────────────────────────────────────

function toggleComments(postId) {
  const el = document.getElementById(`comments-${postId}`);
  el.style.display = el.style.display === 'none' ? '' : 'none';
  if (el.style.display !== 'none') {
    document.getElementById(`comment-input-${postId}`)?.focus();
  }
}

async function submitComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const text = input.value.trim();
  if (!text) return;

  try {
    await fetch(`/api/posts/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    input.value = '';
  } catch (err) {
    console.error('Error submitting comment:', err);
  }
}

// ── Friends ──────────────────────────────────────

async function loadFriendsSidebar() {
  try {
    const res = await fetch('/api/friends');
    const data = await res.json();

    // Mini list in sidebar
    const container = document.getElementById('friendsListContent');
    if (data.friends.length === 0) {
      container.innerHTML = '<div class="empty-state">No friends yet</div>';
    } else {
      container.innerHTML = data.friends.map(f => `
        <div class="friend-mini">
          <img src="${escapeHTML(f.avatar)}" alt="${escapeHTML(f.username)}">
          <span>${escapeHTML(f.username)}</span>
        </div>
      `).join('');
    }

    // Sidebar friend requests
    const reqContainer = document.getElementById('sidebarFriendRequests');
    if (data.requests.length === 0) {
      reqContainer.innerHTML = '<div class="empty-state">No pending requests</div>';
    } else {
      reqContainer.innerHTML = data.requests.map(r => `
        <div class="user-card">
          <img src="${escapeHTML(r.avatar)}" alt="${escapeHTML(r.username)}">
          <div class="user-card-info">
            <h4>${escapeHTML(r.username)}</h4>
          </div>
          <div class="user-card-actions">
            <button class="btn btn-success btn-sm" onclick="acceptFriend('${r.id}')">Accept</button>
            <button class="btn btn-outline btn-sm" onclick="rejectFriend('${r.id}')">Decline</button>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading friends:', err);
  }
}

async function loadFriendsPage() {
  try {
    const [friendsRes, usersRes] = await Promise.all([
      fetch('/api/friends'),
      fetch('/api/users')
    ]);
    const friendsData = await friendsRes.json();
    const allUsers = await usersRes.json();

    // Friend requests
    const reqList = document.getElementById('friendRequestsList');
    if (friendsData.requests.length === 0) {
      reqList.innerHTML = '<div class="empty-state">No pending requests</div>';
    } else {
      reqList.innerHTML = friendsData.requests.map(r => `
        <div class="user-card">
          <img src="${escapeHTML(r.avatar)}" alt="${escapeHTML(r.username)}">
          <div class="user-card-info">
            <h4>${escapeHTML(r.username)}</h4>
            <p>${escapeHTML(r.bio || '')}</p>
          </div>
          <div class="user-card-actions">
            <button class="btn btn-success btn-sm" onclick="acceptFriend('${r.id}')">Accept</button>
            <button class="btn btn-danger btn-sm" onclick="rejectFriend('${r.id}')">Decline</button>
          </div>
        </div>
      `).join('');
    }

    // All users (exclude friends and self)
    const friendIds = currentUser.friends || [];
    const nonFriends = allUsers.filter(u => !friendIds.includes(u.id));

    const allList = document.getElementById('allUsersList');
    if (nonFriends.length === 0) {
      allList.innerHTML = '<div class="empty-state">No other users found</div>';
    } else {
      allList.innerHTML = nonFriends.map(u => {
        const isPending = (currentUser.sentRequests || []).includes(u.id);
        const hasRequest = (currentUser.friendRequests || []).includes(u.id);
        let btnHTML = '';
        if (isPending) {
          btnHTML = '<button class="btn btn-ghost btn-sm" disabled>Pending</button>';
        } else if (hasRequest) {
          btnHTML = `<button class="btn btn-success btn-sm" onclick="acceptFriend('${u.id}')">Accept</button>`;
        } else {
          btnHTML = `<button class="btn btn-primary btn-sm" onclick="sendFriendRequest('${u.id}')">Add Friend</button>`;
        }
        return `
          <div class="user-card">
            <img src="${escapeHTML(u.avatar)}" alt="${escapeHTML(u.username)}">
            <div class="user-card-info">
              <h4>${escapeHTML(u.username)}</h4>
              <p>${escapeHTML(u.bio || '')}</p>
            </div>
            <div class="user-card-actions">${btnHTML}</div>
          </div>
        `;
      }).join('');
    }

    // My friends
    const myFriendsList = document.getElementById('myFriendsFullList');
    if (friendsData.friends.length === 0) {
      myFriendsList.innerHTML = '<div class="empty-state">No friends yet</div>';
    } else {
      myFriendsList.innerHTML = friendsData.friends.map(f => `
        <div class="user-card">
          <img src="${escapeHTML(f.avatar)}" alt="${escapeHTML(f.username)}">
          <div class="user-card-info">
            <h4>${escapeHTML(f.username)}</h4>
            <p>${escapeHTML(f.bio || '')}</p>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading friends page:', err);
  }
}

async function sendFriendRequest(targetId) {
  try {
    const res = await fetch('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId })
    });
    if (res.ok) {
      currentUser.sentRequests = currentUser.sentRequests || [];
      currentUser.sentRequests.push(targetId);
      loadFriendsPage();
    }
  } catch (err) {
    console.error('Error sending friend request:', err);
  }
}

async function acceptFriend(fromId) {
  try {
    const res = await fetch('/api/friends/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromId })
    });
    if (res.ok) {
      currentUser.friends = currentUser.friends || [];
      currentUser.friends.push(fromId);
      currentUser.friendRequests = (currentUser.friendRequests || []).filter(id => id !== fromId);
      loadFriendsPage();
      loadFriendsSidebar();
    }
  } catch (err) {
    console.error('Error accepting friend:', err);
  }
}

async function rejectFriend(fromId) {
  try {
    const res = await fetch('/api/friends/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromId })
    });
    if (res.ok) {
      currentUser.friendRequests = (currentUser.friendRequests || []).filter(id => id !== fromId);
      loadFriendsPage();
      loadFriendsSidebar();
    }
  } catch (err) {
    console.error('Error rejecting friend:', err);
  }
}

// ── Profile Edit ─────────────────────────────────

function setupEditProfile() {
  document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('bio', document.getElementById('editBio').value.trim());
    const avatarFile = document.getElementById('editAvatar').files[0];
    if (avatarFile) formData.append('avatar', avatarFile);

    try {
      const res = await fetch('/api/profile', { method: 'PUT', body: formData });
      if (res.ok) {
        const updatedUser = await res.json();
        currentUser = { ...currentUser, ...updatedUser };
        document.getElementById('profileAvatar').src = currentUser.avatar;
        document.getElementById('profileName').textContent = currentUser.username;
        document.getElementById('profileBio').textContent = currentUser.bio || 'No bio yet';
        document.getElementById('navAvatar').style.backgroundImage = `url('${currentUser.avatar}')`;
        document.getElementById('composerAvatar').src = currentUser.avatar;
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  });
}

// ── Notifications ────────────────────────────────

function setupNotifications() {
  document.getElementById('markReadBtn').addEventListener('click', async () => {
    try {
      await fetch('/api/notifications/read', { method: 'PUT' });
      document.getElementById('notifBadge').style.display = 'none';
      document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  });
}

async function loadNotifications() {
  try {
    const res = await fetch('/api/notifications');
    const notifs = await res.json();
    renderNotifications(notifs);
  } catch (err) {
    console.error('Error loading notifications:', err);
  }
}

function renderNotifications(notifs) {
  const container = document.getElementById('notificationsPanel');
  const badge = document.getElementById('notifBadge');
  const unreadCount = notifs.filter(n => !n.read).length;

  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }

  if (notifs.length === 0) {
    container.innerHTML = '<div class="empty-state">No notifications</div>';
    return;
  }

  container.innerHTML = notifs.slice(0, 20).map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}">
      ${n.read ? '' : '<div class="notif-dot"></div>'}
      <div>
        <div>${escapeHTML(n.message)}</div>
        <div class="notif-time">${getTimeAgo(n.createdAt)}</div>
      </div>
    </div>
  `).join('');
}

// ── Search ───────────────────────────────────────

function setupSearch() {
  const input = document.getElementById('searchUsers');
  const results = document.getElementById('searchResults');
  let timeout;

  input.addEventListener('input', () => {
    clearTimeout(timeout);
    const q = input.value.trim().toLowerCase();
    if (!q) { results.style.display = 'none'; return; }

    timeout = setTimeout(async () => {
      try {
        const res = await fetch('/api/users');
        const users = await res.json();
        const matches = users.filter(u => u.username.toLowerCase().includes(q));
        if (matches.length === 0) {
          results.innerHTML = '<div class="empty-state">No users found</div>';
        } else {
          results.innerHTML = matches.map(u => `
            <div class="search-item" onclick="viewUserFromSearch('${u.id}')">
              <img src="${escapeHTML(u.avatar)}" alt="" class="avatar-sm" style="width:32px;height:32px;border-radius:50%;">
              <div>
                <strong>${escapeHTML(u.username)}</strong>
                <div class="text-muted text-sm">${escapeHTML(u.bio || '')}</div>
              </div>
            </div>
          `).join('');
        }
        results.style.display = 'block';
      } catch (err) {
        console.error('Error searching:', err);
      }
    }, 300);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.topnav-center')) results.style.display = 'none';
  });
}

function viewUserFromSearch(userId) {
  document.getElementById('searchResults').style.display = 'none';
  document.getElementById('searchUsers').value = '';

  // Switch to friends tab to show the user
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector('[data-section="friends"]').classList.add('active');
  document.getElementById('feedSection').style.display = 'none';
  document.getElementById('friendsSection').style.display = '';
  document.getElementById('profileSection').style.display = 'none';
  loadFriendsPage();
}

// ── Logout ───────────────────────────────────────

function setupLogout() {
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/logout');
    window.location.href = 'login.html';
  });
}

// ═══════════════════════════════════════════════
//  SOCKET.IO — Real-Time Updates
// ═══════════════════════════════════════════════

function connectSocket() {
  socket = io();

  socket.on('connect', () => {
    console.log('🔌 Socket connected');
  });

  // New post — prepend to feed
  socket.on('new-post', (post) => {
    const container = document.getElementById('feedContainer');
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const temp = document.createElement('div');
    temp.innerHTML = renderPostCard(post);
    const newCard = temp.firstElementChild;
    container.prepend(newCard);
  });

  // Like update
  socket.on('post-liked', ({ postId, likes }) => {
    const postEl = document.getElementById(`post-${postId}`);
    if (!postEl) return;

    const isLiked = likes.includes(currentUser.id);
    const statsEl = postEl.querySelector('.post-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <span>❤️ ${likes.length} like${likes.length !== 1 ? 's' : ''}</span>
        <span>${statsEl.querySelectorAll('span')[1]?.textContent || ''}</span>
      `;
    }
    const likeBtn = postEl.querySelector('.post-action-btn');
    if (likeBtn) {
      likeBtn.className = `post-action-btn ${isLiked ? 'liked' : ''}`;
      likeBtn.innerHTML = `${isLiked ? '❤️' : '🤍'} Like`;
      if (isLiked) likeBtn.classList.add('like-anim');
    }
  });

  // New comment
  socket.on('new-comment', ({ postId, comment }) => {
    const listEl = document.getElementById(`comments-list-${postId}`);
    if (!listEl) return;

    listEl.innerHTML += `
      <div class="comment-item">
        <img src="${escapeHTML(comment.avatar)}" alt="${escapeHTML(comment.username)}">
        <div>
          <div class="comment-bubble">
            <strong>${escapeHTML(comment.username)}</strong>
            <p>${escapeHTML(comment.text)}</p>
          </div>
          <div class="comment-time">Just now</div>
        </div>
      </div>
    `;

    // Update comment count in stats
    const postEl = document.getElementById(`post-${postId}`);
    if (postEl) {
      const statsSpans = postEl.querySelectorAll('.post-stats span');
      if (statsSpans[1]) {
        const count = (listEl.querySelectorAll('.comment-item').length);
        statsSpans[1].textContent = `💬 ${count} comment${count !== 1 ? 's' : ''}`;
      }
    }

    // Show comments section
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (commentsSection) commentsSection.style.display = '';
  });

  // Friend request / notification
  socket.on('friend-request', () => {
    loadFriendsSidebar();
    loadNotifications();
  });

  socket.on('friend-accepted', () => {
    loadFriendsSidebar();
    loadNotifications();
    // Refresh me to update friend list
    refreshCurrentUser();
  });

  socket.on('notification', (notif) => {
    loadNotifications();
  });
}

async function refreshCurrentUser() {
  try {
    const res = await fetch('/api/me');
    if (res.ok) currentUser = await res.json();
  } catch (e) { /* ignore */ }
}

// ── Utilities ────────────────────────────────────

function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
