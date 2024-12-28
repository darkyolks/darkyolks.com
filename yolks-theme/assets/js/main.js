document.addEventListener('DOMContentLoaded', function() {
    // Search functionality
    const searchButton = document.querySelector('.search-button');
    const searchModal = document.querySelector('.search-modal');
    
    if (searchButton && searchModal) {
        searchButton.addEventListener('click', function() {
            searchModal.classList.toggle('active');
        });
    }
    
    // Mobile menu toggle
    const menuButton = document.querySelector('.menu-button');
    const nav = document.querySelector('.nav');
    
    if (menuButton && nav) {
        menuButton.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
    }
});