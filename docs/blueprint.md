# **App Name**: Class Commander

## Core Features:

- Weekly Class Calendar: Display a weekly calendar view of available classes.
- User Booking Highlighting: Highlight classes already booked by the user in the calendar view.
- Class Booking Modal: Show class details and confirmation options in a modal upon selection.
- User Authentication: Manage user authentication via email/password. Uses Firebase Authentication for user management.
- My Bookings: List upcoming booked classes with options to modify or cancel reservations. Modification only allows changing the time of the existing booking; a reservation can only be moved within its originally-scheduled class.
- Real-time Booking Management: Handle booking creation and cancellation; ensures booking limits aren't exceeded using data from the firestore database.

## Style Guidelines:

- Primary color: HSL(210, 65%, 50%), which converts to hex code #38A3A5; this is a vibrant blue intended to evoke feelings of trust and reliability.
- Background color: HSL(210, 20%, 95%), which converts to hex code #F0F6FF; it harmonizes with the primary while providing a soft, neutral backdrop.
- Accent color: HSL(180, 55%, 40%), which converts to hex code #3391FF; this cyan green serves as a contrasting color for interactive elements and highlights.
- Font pairing: 'Poppins' (sans-serif) for headlines, and 'PT Sans' (sans-serif) for body text.
- Use simple, clear icons from a library like FontAwesome to represent class types and actions.
- Design a responsive, mobile-first layout that adapts to various screen sizes, ensuring a seamless experience on both touch screen kiosk and mobile devices.
- Use subtle transitions and animations to provide feedback on user interactions and improve the overall user experience.