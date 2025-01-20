document.addEventListener('DOMContentLoaded', function() {
    fetch('/check-auth')
        .then(response => response.json())
        .then(data => {
            if (data.isAuthenticated) {
                document.getElementById('loginLink').style.display = 'none';
                document.getElementById('logoutLink').style.display = 'block';
                document.getElementById('profileLink').style.display = 'block';
                document.getElementById('refreshLink').style.display = 'block';
            } else {
                document.getElementById('loginLink').style.display = 'block';
                document.getElementById('logoutLink').style.display = 'none';
                document.getElementById('profileLink').style.display = 'none';
                document.getElementById('refreshLink').style.display = 'none';
            }
        })
        .catch(error => console.error('Error checking auth status:', error));
});
