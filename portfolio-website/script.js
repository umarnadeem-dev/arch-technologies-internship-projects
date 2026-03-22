/* ============================================
   PORTFOLIO — script.js
   Dark mode, hamburger menu, scroll spy,
   IntersectionObserver reveals, form validation,
   blog modal, copy-to-clipboard, toast.
   ============================================ */

(function () {
  'use strict';

  // ─── DOM REFERENCES ───────────────────────
  const html = document.documentElement;
  const navbar = document.getElementById('navbar');
  const navLinks = document.getElementById('navLinks');
  const hamburger = document.getElementById('hamburger');
  const themeToggle = document.getElementById('themeToggle');
  const contactForm = document.getElementById('contactForm');
  const blogModal = document.getElementById('blogModal');
  const modalClose = document.getElementById('modalClose');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const toast = document.getElementById('toast');
  const allNavLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  // ─── DARK MODE ────────────────────────────
  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  // Load saved theme or default to light
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);

  themeToggle.addEventListener('click', function () {
    const current = html.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  // ─── NAVBAR SCROLL SHADOW ─────────────────
  function handleNavScroll() {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // ─── HAMBURGER MENU ──────────────────────
  hamburger.addEventListener('click', function () {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Close menu on link click
  allNavLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // Close menu on outside click
  document.addEventListener('click', function (e) {
    if (
      navLinks.classList.contains('open') &&
      !navLinks.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });

  // ─── ACTIVE NAV LINK ON SCROLL ────────────
  function updateActiveLink() {
    var scrollY = window.scrollY + 120;

    sections.forEach(function (section) {
      var top = section.offsetTop;
      var height = section.offsetHeight;
      var id = section.getAttribute('id');

      if (scrollY >= top && scrollY < top + height) {
        allNavLinks.forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();

  // ─── INTERSECTION OBSERVER — REVEAL ───────
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll('.reveal').forEach(function (el) {
    revealObserver.observe(el);
  });

  // ─── SKILL BAR LEVEL ANIMATION ────────────
  var skillObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var level = entry.target.getAttribute('data-level');
          if (level) {
            entry.target.style.setProperty('--level', level);
            entry.target.classList.add('visible');
          }
          skillObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  document.querySelectorAll('.skill-tag').forEach(function (el) {
    skillObserver.observe(el);
  });

  // ─── BLOG MODAL ───────────────────────────
  var articleContent = {
    'todo-article': {
      title: 'What I Learned Building a To-Do App with localStorage',
      body:
        '<p>Building a To-Do app was my first real JavaScript project. It taught me the fundamentals of DOM manipulation — how to create elements dynamically, handle user events, and update the UI in real time.</p>' +
        '<p>The most valuable lesson was implementing localStorage for data persistence. I learned how to serialize and deserialize data with JSON, handle edge cases when storage is empty, and keep the UI in sync with stored data.</p>' +
        '<p>Key takeaways: start simple, iterate often, and always think about the user experience. Even a "simple" app has surprising depth when you care about quality.</p>' +
        '<p><em>This article is a draft and will be expanded soon.</em></p>',
    },
    'dom-article': {
      title: 'JavaScript DOM Manipulation: My Notes',
      body:
        '<p>The Document Object Model (DOM) is the bridge between JavaScript and the web page. Understanding it deeply transformed how I build interactive features.</p>' +
        '<p>I practiced selecting elements with querySelector, creating and appending nodes, attaching event listeners, and traversing the DOM tree. Each concept clicked when I applied it to my To-Do app.</p>' +
        '<p>Tips I collected: batch DOM updates to avoid layout thrashing, use event delegation for dynamic lists, and always clean up event listeners when they are no longer needed.</p>' +
        '<p><em>This article is a draft and will be expanded soon.</em></p>',
    },
    'roadmap-article': {
      title: 'My Roadmap to Becoming a Full-Stack Developer',
      body:
        '<p>My roadmap starts with solidifying HTML, CSS, and JavaScript fundamentals — the holy trinity of the web. From there, I plan to learn React for building dynamic UIs and Node.js + Express for server-side logic.</p>' +
        '<p>Database skills (SQL & MongoDB) come next, followed by deployment, DevOps basics, and learning TypeScript for type-safe code. The goal is to ship at least one full-stack project by the end of 2026.</p>' +
        '<p>Milestones: complete certifications, contribute to open-source, and land a full-time development role after graduation.</p>' +
        '<p><em>This article is a draft and will be expanded soon.</em></p>',
    },
  };

  document.querySelectorAll('.blog-read-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var key = this.getAttribute('data-article');
      var data = articleContent[key];
      if (data) {
        modalTitle.textContent = data.title;
        modalBody.innerHTML = data.body;
        blogModal.classList.add('open');
        blogModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  function closeModal() {
    blogModal.classList.remove('open');
    blogModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  modalClose.addEventListener('click', closeModal);

  blogModal.addEventListener('click', function (e) {
    if (e.target === blogModal) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && blogModal.classList.contains('open')) {
      closeModal();
    }
  });

  // ─── TOAST NOTIFICATION ───────────────────
  var toastTimer = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 2500);
  }

  // ─── COPY EMAIL ───────────────────────────
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = this.getAttribute('data-copy');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () {
          showToast('Email copied to clipboard!');
        });
      } else {
        // Fallback
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Email copied to clipboard!');
      }
    });
  });

  // ─── CONTACT FORM VALIDATION ──────────────
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var nameInput = document.getElementById('name');
    var emailInput = document.getElementById('email');
    var messageInput = document.getElementById('message');
    var nameError = document.getElementById('nameError');
    var emailError = document.getElementById('emailError');
    var messageError = document.getElementById('messageError');
    var formSuccess = document.getElementById('formSuccess');

    var valid = true;

    // Reset
    nameInput.classList.remove('error');
    emailInput.classList.remove('error');
    messageInput.classList.remove('error');
    nameError.textContent = '';
    emailError.textContent = '';
    messageError.textContent = '';
    formSuccess.classList.remove('show');

    // Name
    if (nameInput.value.trim().length < 2) {
      nameError.textContent = 'Please enter your name (min 2 characters).';
      nameInput.classList.add('error');
      valid = false;
    }

    // Email
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailInput.value.trim())) {
      emailError.textContent = 'Please enter a valid email address.';
      emailInput.classList.add('error');
      valid = false;
    }

    // Message
    if (messageInput.value.trim().length < 10) {
      messageError.textContent = 'Message must be at least 10 characters.';
      messageInput.classList.add('error');
      valid = false;
    }

    if (valid) {
      formSuccess.classList.add('show');
      showToast('Message sent successfully!');
      contactForm.reset();

      // Hide success after 4s
      setTimeout(function () {
        formSuccess.classList.remove('show');
      }, 4000);
    }
  });
})();
