const PUBLIC_URL = 'https://teamappgr.github.io/team'; // Replace with your actual public URL

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

self.addEventListener('notificationclick', function(event) {
    event.notification.close(); // Close the notification when clicked

    // Example action: Open a specific URL
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // Check if any of the client tabs (open windows) are already open with the target URL
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url === process.env.PUBLIC_URL && 'focus' in client) {
                    return client.focus();
                }
            }
            // If the page isn't open, open a new tab/window
            if (clients.openWindow) {
                return clients.openWindow(process.env.PUBLIC_URL);
            }
        })
    );
});
