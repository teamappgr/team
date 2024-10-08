const VAPID_PUBLIC_KEY = 'BBNR2P3xPR7stkE7U12C_JBH4RDHY0LOb4Tgp2596qNShGNjxa0XNvyFwwPBoFx4ZmhIA2dkqwc84crdR1C__nw'; // Replace with your actual VAPID public key
const PUBLIC_URL = 'https://teamappgr.github.io/team'; // Replace with your actual public URL

self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    const options = {
        body: data.message || 'You have a new notification!',
        icon: 'origin.png', // Ensure this path is correct
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Notification', options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close(); // Close the notification when clicked

    // Open the specific URL defined by PUBLIC_URL
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // Check if any of the client tabs (open windows) are already open with the target URL
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === PUBLIC_URL && 'focus' in client) {
                    return client.focus(); // Focus the existing tab if it's already open
                }
            }
            // If the page isn't open, open a new tab/window
            if (clients.openWindow) {
                return clients.openWindow(PUBLIC_URL);
            }
        })
    );
});
