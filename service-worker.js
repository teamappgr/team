// public/service-worker.js

self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    const options = {
        body: data.message || 'You have a new notification!',
        icon: 'origin.png', // Path to an icon
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Notification', options)
    );
});

// Optionally, you can also handle notification click events
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    // Handle the click event
    event.waitUntil(
        clients.openWindow('http://localhost:3000/') // Change to your desired URL
    );
});
