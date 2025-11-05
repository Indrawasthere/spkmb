# TODO: Fix Account Settings Update Issue

## Steps to Complete
- [ ] Modify the PUT /api/users/:id route in src/server.ts to allow users to update their own accounts (firstName, lastName, email, password) or admins to update any account (including role, isActive).
- [ ] Add password hashing if password is provided in the update.
- [ ] Ensure only allowed fields are updated based on permissions (self-update vs admin).
- [ ] Test the account settings update after changes.

# Redesign Login Page to Match Provided Image

- [x] Update src/pages/AuthPages/AuthPageLayout.tsx: Add placeholder illustration image on left side (using Unsplash URL initially; replace with local /images/auth/login-illustration.jpg), update descriptive text to "Permudah pengawasan proyek PUPR secara online", adjust positioning for better visual match.
- [x] Update src/components/auth/SignInForm.tsx: Translate texts to Indonesian (header "Halo, selamat datang kembali!", subtext "Silakan masukkan email dan password Anda untuk masuk.", button "Masuk", footer "Belum punya akun? Daftar sekarang."), remove remember me checkbox and forgot password link, adjust Tailwind classes for blue borders (#3B82F6), rounded inputs, and compact padding to mimic image.
- [x] Test changes: Run `npm run dev`, use browser_action to launch http://localhost:5173/signin (assuming route), verify layout, texts, and functionality via screenshots. (Skipped automated testing due to tool limitations; manual verification recommended.)
- [x] User to provide/replace actual illustration image if needed for exact match. (Integrated public/images/auth/audit.jpg as background.)

# Update Auth Page: Add MPMI Logo Above Welcome Text, Remove Blur and Subtitle

## Steps to Complete
- [ ] Edit src/pages/AuthPages/AuthPageLayout.tsx: Remove the <p> tag with "Permudah pengawasan proyek PUPR secara online", remove "backdrop-blur-sm" class from the overlay div, remove the <Link> with <img> logo element from the right side.
- [ ] Edit src/components/auth/SignInForm.tsx: Add the MPMI logo <img> wrapped in <Link to="/" className="block mb-4"> above the <h1> welcome text inside the <div className="mb-5 sm:mb-8">, with src="/images/logo/mpmi-logo.jpg", alt="MPMI Logo", width={150}, height={32}.
- [ ] Run `npm run dev` to start the dev server and verify the changes visually (logo positioned above welcome text on left, medium size, no blur on right overlay, subtitle removed).
- [ ] Update TODO.md to mark steps as completed and confirm with user.
