I will implement the requested changes to user information display and address information validation.

### 1. Unified User Identity in Header
- Update `ViniHome.tsx` to handle "Anonimo" (Anonymous) users explicitly when not logged in.
- The header will display "Anônimo" as the name and "Visitante" as the status when no user is authenticated.
- Ensure the avatar placeholder reflects this "Anonymous" state.

### 2. Base Location on User Profile
- Modify the `useEffect` in `ViniHome.tsx` that loads city and plan.
- It will prioritize the `city` from the user's `profiles` table.
- If no user is logged in, it will continue to use the best-effort geolocation.

### 3. Missing Address Validation & Collection
- Implement a check before "essential processes" (like activating the Radar/Urgência or starting a Conversation with commercial intent) to verify if the user has address info (`cep`, `city`, `neighborhood`, `address`, `state`) in their profile.
- If info is missing for a logged-in user, a professional dialog will appear requesting the zip code (CEP), which will then auto-fill the address details using a public API (ViaCEP).
- Upon submission, the profile will be updated in Supabase, and the original process will continue.

### Technical details:
- **Files to modify**: `src/pages/ViniHome.tsx`, `src/contexts/AuthContext.tsx` (to expose more profile data if needed), and potentially creating a new component `src/components/vini/AddressCollectionModal.tsx`.
- **Database**: Uses existing columns in the `profiles` table (`cep`, `city`, `neighborhood`, `address`, `state`).
- **External API**: `https://viacep.com.br/ws/${cep}/json/` for address lookup.
