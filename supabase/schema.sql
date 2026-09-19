create extension if not exists pgcrypto;

create table if not exists profiles(id uuid primary key references auth.users(id) on delete cascade,email text unique,full_name text,avatar_url text,role text not null default 'CUSTOMER' check(role in ('CUSTOMER','ADMIN')),phone text,created_at timestamptz not null default now());
create table if not exists categories(id uuid primary key default gen_random_uuid(),name text unique not null,slug text unique not null,image_url text,created_at timestamptz not null default now());
create table if not exists products(id uuid primary key default gen_random_uuid(),title text not null,slug text unique not null,description text not null,price numeric(12,2) not null check(price>=0),compare_price numeric(12,2),stock integer not null default 0 check(stock>=0),sku text unique,category_id uuid references categories(id) on delete set null,images text[] not null default '{}',rating numeric(3,2) not null default 0,review_count integer not null default 0,is_featured boolean not null default false,is_active boolean not null default true,created_at timestamptz not null default now());
create table if not exists orders(id uuid primary key default gen_random_uuid(),user_id uuid not null references profiles(id) on delete restrict,order_number text unique not null,total numeric(12,2) not null check(total>=0),status text not null default 'PENDING' check(status in ('PENDING','PAID','SHIPPED','DELIVERED','CANCELLED')),items jsonb not null,shipping_address jsonb,created_at timestamptz not null default now());
create table if not exists reviews(id uuid primary key default gen_random_uuid(),product_id uuid not null references products(id) on delete cascade,user_id uuid not null references profiles(id) on delete cascade,rating int not null check(rating between 1 and 5),comment text,created_at timestamptz not null default now());
create table if not exists cart_items(id uuid primary key default gen_random_uuid(),user_id uuid not null references profiles(id) on delete cascade,product_id uuid not null references products(id) on delete cascade,quantity int not null default 1 check(quantity>0),created_at timestamptz not null default now(),unique(user_id,product_id));

alter table profiles enable row level security; alter table categories enable row level security; alter table products enable row level security; alter table orders enable row level security; alter table reviews enable row level security; alter table cart_items enable row level security;

create policy profiles_access on profiles for select to authenticated using((select auth.uid())=id or exists(select 1 from profiles p where p.id=(select auth.uid()) and p.role='ADMIN'));
create policy profiles_insert on profiles for insert to authenticated with check((select auth.uid())=id);
create policy profiles_update on profiles for update to authenticated using((select auth.uid())=id or exists(select 1 from profiles p where p.id=(select auth.uid()) and p.role='ADMIN')) with check((select auth.uid())=id or exists(select 1 from profiles p where p.id=(select auth.uid()) and p.role='ADMIN'));
create policy categories_read on categories for select to anon,authenticated using(true);
create policy categories_admin_insert on categories for insert to authenticated with check(exists(select 1 from profiles p where p.id=(select auth.uid()) and p.role='ADMIN'));
create policy categories_admin_update on categories for update to authenticated using(exists(select 1 from profiles p where p.id=(select auth.uid()) and p.role='ADMIN')) with check(exists(select 1 from profiles p where p.id=(select auth.uid()) and p.role='ADMIN'));
create policy categories_admin_delete on categories for delete to authenticated using(exists(select 1 from profiles p where p.id=(select auth.uid()) and p.role='ADMIN'));
create policy products_read on products for select to anon,authenticated using(is_active=true or exists(select 1 from profiles p where p.id=(select auth.uid()) and p.role='ADMIN'));
create policy products_admin_insert on products for insert to authenticated with check(exists(select 1 from profiles p where p.id=(select auth.uid()) and p.role='ADMIN'));
create policy products_admin_update on products for update to authenticated using(exists(select 1 from profiles p where p.id=(select auth.uid()) and p.role='ADMIN')) with check(exists(select 1 from profiles p where p.id=(select auth.uid()) and p.role='ADMIN'));
create policy products_admin_delete on products for delete to authenticated using(exists(select 1 from profiles p where p.id=(select auth.uid()) and p.role='ADMIN'));
create policy cart_own on cart_items for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy orders_read on orders for select to authenticated using((select auth.uid())=user_id or exists(select 1 from profiles p where p.id=(select auth.uid()) and p.role='ADMIN'));
create policy orders_insert on orders for insert to authenticated with check((select auth.uid())=user_id);
create policy orders_admin_update on orders for update to authenticated using(exists(select 1 from profiles p where p.id=(select auth.uid()) and p.role='ADMIN')) with check(exists(select 1 from profiles p where p.id=(select auth.uid()) and p.role='ADMIN'));
create policy orders_admin_delete on orders for delete to authenticated using(exists(select 1 from profiles p where p.id=(select auth.uid()) and p.role='ADMIN'));
create policy reviews_read on reviews for select to anon,authenticated using(true);
create policy reviews_insert on reviews for insert to authenticated with check((select auth.uid())=user_id);

create index if not exists products_category_idx on products(category_id); create index if not exists products_active_idx on products(is_active); create index if not exists orders_user_idx on orders(user_id); create index if not exists cart_user_idx on cart_items(user_id); create index if not exists cart_product_idx on cart_items(product_id); create index if not exists reviews_product_idx on reviews(product_id); create index if not exists reviews_user_idx on reviews(user_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security invoker set search_path=public as $$ begin insert into public.profiles(id,email,full_name) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name','')) on conflict(id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users; create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.place_order(shipping_address jsonb) returns uuid language plpgsql security invoker set search_path=public as $$
declare uid uuid := (select auth.uid()); oid uuid; onum text; total numeric(12,2); payload jsonb;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 select coalesce(sum(c.quantity*p.price),0) into total from cart_items c join products p on p.id=c.product_id where c.user_id=uid and p.is_active=true;
 if total<=0 then raise exception 'Cart is empty'; end if;
 if exists(select 1 from cart_items c join products p on p.id=c.product_id where c.user_id=uid and (not p.is_active or p.stock<c.quantity)) then raise exception 'One or more products are unavailable'; end if;
 select jsonb_agg(jsonb_build_object('product_id',p.id,'title',p.title,'price',p.price,'quantity',c.quantity,'image',coalesce(p.images[1],null))) into payload from cart_items c join products p on p.id=c.product_id where c.user_id=uid;
 onum:='ORD-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
 insert into orders(user_id,order_number,total,status,items,shipping_address) values(uid,onum,total,'PAID',payload,shipping_address) returning id into oid;
 update products p set stock=p.stock-c.quantity from cart_items c where c.product_id=p.id and c.user_id=uid;
 delete from cart_items where user_id=uid; return oid;
end; $$;
grant execute on function public.place_order(jsonb) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=true,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=true,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
create policy product_images_read on storage.objects for select to anon,authenticated using(bucket_id='product-images');
create policy product_images_admin on storage.objects for all to authenticated using(bucket_id='product-images' and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='ADMIN')) with check(bucket_id='product-images' and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='ADMIN'));
create policy avatars_read on storage.objects for select to anon,authenticated using(bucket_id='avatars');
create policy avatars_own_write on storage.objects for all to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);


-- Advanced catalog extensions: options, variants, media, SEO and merchandising.
create table if not exists product_options(id uuid primary key default gen_random_uuid(),product_id uuid not null references products(id) on delete cascade,name text not null,position integer not null default 0,unique(product_id,name));
create table if not exists product_option_values(id uuid primary key default gen_random_uuid(),option_id uuid not null references product_options(id) on delete cascade,value text not null,swatch_hex text,position integer not null default 0,unique(option_id,value));
create table if not exists product_variants(id uuid primary key default gen_random_uuid(),product_id uuid not null references products(id) on delete cascade,title text not null,sku text unique,price numeric(12,2) not null check(price>=0),compare_price numeric(12,2),stock integer not null default 0 check(stock>=0),option_values jsonb not null default '{}'::jsonb,image_url text,barcode text,weight_grams integer,is_active boolean not null default true,created_at timestamptz not null default now());
create table if not exists product_media(id uuid primary key default gen_random_uuid(),product_id uuid not null references products(id) on delete cascade,url text not null,alt_text text,media_type text not null default 'image' check(media_type in ('image','video')),position integer not null default 0,is_featured boolean not null default false,created_at timestamptz not null default now());
alter table cart_items add column if not exists variant_id uuid references product_variants(id) on delete cascade;
alter table orders add column if not exists currency text not null default 'GHS';
alter table products add column if not exists brand text;
alter table products add column if not exists tags text[] not null default '{}';
alter table products add column if not exists features text[] not null default '{}';
alter table products add column if not exists specifications jsonb not null default '{}'::jsonb;
alter table products add column if not exists seo_title text;
alter table products add column if not exists seo_description text;
alter table product_options enable row level security;
alter table product_option_values enable row level security;
alter table product_variants enable row level security;
alter table product_media enable row level security;
drop policy if exists product_options_read on product_options;
create policy product_options_read on product_options for select to anon,authenticated using(exists(select 1 from products p where p.id=product_id and (p.is_active=true or exists(select 1 from profiles pr where pr.id=(select auth.uid()) and pr.role='ADMIN'))));
drop policy if exists product_options_admin_write on product_options;
create policy product_options_admin_write on product_options for all to authenticated using(exists(select 1 from profiles pr where pr.id=(select auth.uid()) and pr.role='ADMIN')) with check(exists(select 1 from profiles pr where pr.id=(select auth.uid()) and pr.role='ADMIN'));
drop policy if exists product_option_values_read on product_option_values;
create policy product_option_values_read on product_option_values for select to anon,authenticated using(exists(select 1 from product_options o join products p on p.id=o.product_id where o.id=option_id and (p.is_active=true or exists(select 1 from profiles pr where pr.id=(select auth.uid()) and pr.role='ADMIN'))));
drop policy if exists product_option_values_admin_write on product_option_values;
create policy product_option_values_admin_write on product_option_values for all to authenticated using(exists(select 1 from profiles pr where pr.id=(select auth.uid()) and pr.role='ADMIN')) with check(exists(select 1 from profiles pr where pr.id=(select auth.uid()) and pr.role='ADMIN'));
drop policy if exists product_variants_read on product_variants;
create policy product_variants_read on product_variants for select to anon,authenticated using(exists(select 1 from products p where p.id=product_id and (p.is_active=true or exists(select 1 from profiles pr where pr.id=(select auth.uid()) and pr.role='ADMIN'))));
drop policy if exists product_variants_admin_write on product_variants;
create policy product_variants_admin_write on product_variants for all to authenticated using(exists(select 1 from profiles pr where pr.id=(select auth.uid()) and pr.role='ADMIN')) with check(exists(select 1 from profiles pr where pr.id=(select auth.uid()) and pr.role='ADMIN'));
drop policy if exists product_media_read on product_media;
create policy product_media_read on product_media for select to anon,authenticated using(exists(select 1 from products p where p.id=product_id and (p.is_active=true or exists(select 1 from profiles pr where pr.id=(select auth.uid()) and pr.role='ADMIN'))));
drop policy if exists product_media_admin_write on product_media;
create policy product_media_admin_write on product_media for all to authenticated using(exists(select 1 from profiles pr where pr.id=(select auth.uid()) and pr.role='ADMIN')) with check(exists(select 1 from profiles pr where pr.id=(select auth.uid()) and pr.role='ADMIN'));
create index if not exists product_options_product_idx on product_options(product_id);
create index if not exists product_option_values_option_idx on product_option_values(option_id);
create index if not exists product_variants_product_idx on product_variants(product_id);
create index if not exists product_variants_active_idx on product_variants(is_active);
create index if not exists product_media_product_idx on product_media(product_id);
alter table cart_items drop constraint if exists cart_items_user_id_product_id_key;
create unique index if not exists cart_items_user_product_variant_uidx on cart_items(user_id,product_id,variant_id);
