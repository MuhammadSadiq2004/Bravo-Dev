# Email Setup Instructions (Gmail)

To send real emails for free using your Gmail account, follow these steps:

1.  **Enable 2-Step Verification** on your Google Account if you haven't already.
    *   Go to [Google Account Security](https://myaccount.google.com/security).
    *   Under "How you sign in to Google", select **2-Step Verification**.

2.  **Generate an App Password**:
    *   Go to [App Passwords](https://myaccount.google.com/apppasswords).
    *   **App name**: Enter "Video Call App" (or any name).
    *   Click **Create**.
    *   Copy the 16-character password generated (e.g., `abcd efgh ijkl mnop`).

3.  **Update `.env.local`**:
    *   Open the `.env.local` file in your project.
    *   Fill in the SMTP details:
        ```dotenv
        SMTP_HOST=smtp.gmail.com
        SMTP_PORT=465
        SMTP_USER=your_email@gmail.com
        SMTP_PASS=your_16_char_app_password_here
        ```
    *   **Note**: Remove spaces from the app password if you want, though usually it works with them. It's safer to remove them.

4.  **Restart Server**:
    *   Stop the server (Ctrl+C) and run `npm run dev` again.

Now, when you send an invite from the app, it will actually email the recipient!
