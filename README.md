# Myshop

Production-oriented ecommerce storefront built with Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase Auth/Postgres/Storage/Realtime, and Lucide icons.

## Shopify reference direction

Myshop uses established ecommerce patterns found in Shopify as product and UX references, not copied code or branding. Shopify documentation emphasizes persistent main/footer navigation, customer account navigation, collections for product discovery, storefront filtering, responsive themes, and inventory-aware checkout. citeturn0search0turn0search2turn0search5turn0search10

Myshop adapts those patterns to a custom Next.js + Supabase architecture.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Realtime-ready architecture
- Zod validation
- React Hook Form
- Lucide React icons
- GitHub Actions build verification

## Features

### Storefront

- Responsive homepage
- Product catalog and product detail pages
- Category navigation
- Product images and ratings/reviews
- Cart with stock-aware quantity changes
- Authenticated checkout
- Database-backed orders
- Customer account and order history
- Email/password authentication
- Google OAuth

### Admin

- Protected admin dashboard
- Product management
- Product categories
- Product activation and featured products
- Orders
- Customers
- Analytics
- Settings area
- Admin-only product image uploads

### Security

- Supabase Row Level Security on application tables
- Customer-owned cart and order access
- Admin authorization through database role checks
- Protected admin/account/cart/checkout routes
- Server-side Supabase client
- Public browser Supabase client
- Image MIME restrictions and 5 MB storage limits
- Database constraints for prices, stock, ratings, order status, and roles
- Transactional order placement with stock validation and decrement

## Database

The Myshop Supabase project contains six application tables:

- profiles
- categories
- products
- orders
- reviews
- cart_items

Storage buckets:

- product-images
- avatars

The canonical schema is stored in `supabase/schema.sql`.

## Environment variables

Create `.env.local` with:

    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_ROLE_KEY=

Never expose SUPABASE_SERVICE_ROLE_KEY to browser code or commit it to Git.

## Local development

    npm install
    npm run dev

Open http://localhost:3000.

Production build:

    npm run build
    npm start

## Supabase setup

1. Apply `supabase/schema.sql` to the Myshop Supabase project.
2. Configure Email authentication.
3. Configure Google OAuth if Google sign-in is required.
4. Add the application URL and `/auth/callback` to Supabase Auth redirect configuration.
5. Add environment variables to local and deployment environments.
6. Create the first administrator through a trusted administrative process by assigning the ADMIN role.

## Project structure

    app/
      (public)/
        account/
        cart/
        checkout/
        login/
        product/[slug]/
        products/
        register/
      (admin)/
        admin/
          analytics/
          categories/
          orders/
          products/
          users/
          settings/
      api/
        auth/
        cart/
      auth/callback/
    components/
    lib/
      supabase/
    supabase/
      schema.sql
    middleware.ts

## Commerce principles

Myshop keeps catalog and ordering data in Supabase rather than hard-coded demo data. Products, stock, carts, customers, and orders are persisted in the database.

Checkout uses a database transaction to validate authenticated ownership, verify inventory, create the order, decrement stock, and clear the cart. A payment provider can be connected later without replacing the underlying order model.

## UX reference notes

Shopify documents collections as a way to group products around categories, themes, customer intent, sales, and seasonal merchandising. Myshop's category/product model is designed to support the same discovery workflow. citeturn0search5turn0search6

Shopify also recommends clear descriptive navigation and mobile-friendly menus. Myshop follows that direction with responsive storefront navigation and mobile admin navigation. citeturn0search1turn0search4

## License

Private project.
