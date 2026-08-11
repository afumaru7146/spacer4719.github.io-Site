'use strict';

// Navigation bar collapsion
const navbarCollapser = document.getElementById('navbar-collapse');
const navbarList = document.getElementById('navbar-list');
let isCollapsed = true;

navbarCollapser.addEventListener("click", () => {
  isCollapsed = !isCollapsed
  updateNavbarState();
})

function updateNavbarState() {
  navbarCollapser.ariaExpanded = !isCollapsed
  if (isCollapsed) {
    navbarList.classList.remove("navbar-active");
  } else {
    navbarList.classList.add("navbar-active");
  }
}