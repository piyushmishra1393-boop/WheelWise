-- Run this optional seed once in Supabase SQL Editor to activate the original homepage brand cards.
-- Safe to run repeatedly. It does not delete articles or other records.
insert into public.brands (name, slug, description, status, display_order)
values
 ('Maruti Suzuki','maruti-suzuki','Explore Maruti Suzuki news, launches and videos.', 'active',1),
 ('Hyundai','hyundai','Explore Hyundai news, launches and videos.', 'active',2),
 ('Tata','tata','Explore Tata news, launches and videos.', 'active',3),
 ('Mahindra','mahindra','Explore Mahindra news, launches and videos.', 'active',4),
 ('Honda','honda','Explore Honda news, launches and videos.', 'active',5),
 ('Toyota','toyota','Explore Toyota news, launches and videos.', 'active',6),
 ('BMW','bmw','Explore BMW news, launches and videos.', 'active',7),
 ('Mercedes-Benz','mercedes-benz','Explore Mercedes-Benz news, launches and videos.', 'active',8),
 ('Audi','audi','Explore Audi news, launches and videos.', 'active',9),
 ('Kia','kia','Explore Kia news, launches and videos.', 'active',10)
on conflict (name) do update set status='active', display_order=excluded.display_order;
