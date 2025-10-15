# **App Name**: AuthStation

## Core Features:

- Super Admin Login: Allow pre-created super admins to log in via a dedicated page.
- Admin Login: Enable admins to log in via a separate login page after their accounts have been created by a super admin.
- Super Admin Dashboard: Provide a dashboard accessible only to super admins after login.
- Create Admin Feature: Implement a UI, accessible from the Super Admin Dashboard, that allows super admins to create new admin accounts.
- Firebase Auth Integration: Integrate with Firebase Authentication to manage user authentication, including creating admin users with specific roles via Firebase Functions or API.
- Route Protection: Secure the dashboard and admin creation routes to ensure only authenticated super admins can access them.
- Form Validation: Implement real-time form validation on login and admin creation forms to provide immediate feedback to users and enhance security.

## Style Guidelines:

- Primary color: Deep indigo (#3F51B5) to convey trust and security.
- Background color: Very light gray (#F5F5F5) to maintain a clean and professional look.
- Accent color: Teal (#009688) for interactive elements to highlight actions.
- Headline font: 'Waltograph' (sans-serif, custom font specified by user) for headings; Note: currently only Google Fonts are supported.
- Body font: 'Inter' (sans-serif) for body text.
- Use a responsive layout optimized for both mobile and desktop devices.
- Utilize simple and professional icons from a library like FontAwesome for indicating security levels.