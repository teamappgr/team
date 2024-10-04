const PUBLIC_URL = 'https://teamappgr.github.io/team'; // Replace with your actual public URL

self.addEventListener('notificationclick', function(event) {
    event.notification.close(); // Close the notification when clicked

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url === PUBLIC_URL && 'focus' in client) {
                    return client.focus();
                }
            }
            // If the page isn't open, open a new tab/window
            if (clients.openWindow) {
                return clients.openWindow(PUBLIC_URL);
            }
        })
    );
});
