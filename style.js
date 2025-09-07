  const randomPages = [
    "https://spacer4719.f5.si/",
    "https://spacer4719.f5.si/aboutme/",
    "https://spacer4719.f5.si/notifications",
    "https://spacer4719.f5.si/vidnotifi",
    "https://spacer4719.f5.si/links",
    "https://spacer4719.f5.si/blog",
    "https://spacer4719.f5.si/comingsoon",
    "https://spacer4719.f5.si/404"
  ];
  document.getElementById('random-link-image').onclick = function() {
    const url = randomPages[Math.floor(Math.random() * randomPages.length)];
    window.location.href = url;
  };

    const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');

  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });
