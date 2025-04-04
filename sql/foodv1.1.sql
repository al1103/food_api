PGDMP  -    9                }         	   food_lps0    16.8 (Debian 16.8-1.pgdg120+1)    17.4 y    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    16389 	   food_lps0    DATABASE     t   CREATE DATABASE food_lps0 WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.UTF8';
    DROP DATABASE food_lps0;
                     food_lps0_user    false            �           0    0 	   food_lps0    DATABASE PROPERTIES     2   ALTER DATABASE food_lps0 SET "TimeZone" TO 'utc';
                          food_lps0_user    false                        2615    2200    public    SCHEMA     2   -- *not* creating schema, since initdb creates it
 2   -- *not* dropping schema, since initdb creates it
                     food_lps0_user    false                        3079    16582 	   uuid-ossp 	   EXTENSION     ?   CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
    DROP EXTENSION "uuid-ossp";
                        false    6            �           0    0    EXTENSION "uuid-ossp"    COMMENT     W   COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';
                             false    2                       1255    16770    update_timestamp()    FUNCTION     �   CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
 )   DROP FUNCTION public.update_timestamp();
       public               food_lps0_user    false    6            �           0    0    FUNCTION uuid_generate_v1()    ACL     C   GRANT ALL ON FUNCTION public.uuid_generate_v1() TO food_lps0_user;
          public               postgres    false    252            �           0    0    FUNCTION uuid_generate_v1mc()    ACL     E   GRANT ALL ON FUNCTION public.uuid_generate_v1mc() TO food_lps0_user;
          public               postgres    false    253            �           0    0 4   FUNCTION uuid_generate_v3(namespace uuid, name text)    ACL     \   GRANT ALL ON FUNCTION public.uuid_generate_v3(namespace uuid, name text) TO food_lps0_user;
          public               postgres    false    254            �           0    0    FUNCTION uuid_generate_v4()    ACL     C   GRANT ALL ON FUNCTION public.uuid_generate_v4() TO food_lps0_user;
          public               postgres    false    255            �           0    0 4   FUNCTION uuid_generate_v5(namespace uuid, name text)    ACL     \   GRANT ALL ON FUNCTION public.uuid_generate_v5(namespace uuid, name text) TO food_lps0_user;
          public               postgres    false    256            �           0    0    FUNCTION uuid_nil()    ACL     ;   GRANT ALL ON FUNCTION public.uuid_nil() TO food_lps0_user;
          public               postgres    false    247            �           0    0    FUNCTION uuid_ns_dns()    ACL     >   GRANT ALL ON FUNCTION public.uuid_ns_dns() TO food_lps0_user;
          public               postgres    false    248            �           0    0    FUNCTION uuid_ns_oid()    ACL     >   GRANT ALL ON FUNCTION public.uuid_ns_oid() TO food_lps0_user;
          public               postgres    false    250            �           0    0    FUNCTION uuid_ns_url()    ACL     >   GRANT ALL ON FUNCTION public.uuid_ns_url() TO food_lps0_user;
          public               postgres    false    249            �           0    0    FUNCTION uuid_ns_x500()    ACL     ?   GRANT ALL ON FUNCTION public.uuid_ns_x500() TO food_lps0_user;
          public               postgres    false    251            �            1259    16687    dishes    TABLE     �  CREATE TABLE public.dishes (
    dish_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    image_url character varying(255),
    rating numeric(3,2) DEFAULT 0.00,
    category character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
    DROP TABLE public.dishes;
       public         heap r       food_lps0_user    false    6            �            1259    16686    dishes_dish_id_seq    SEQUENCE     �   CREATE SEQUENCE public.dishes_dish_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public.dishes_dish_id_seq;
       public               food_lps0_user    false    6    228            �           0    0    dishes_dish_id_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public.dishes_dish_id_seq OWNED BY public.dishes.dish_id;
          public               food_lps0_user    false    227            �            1259    16721    order_details    TABLE       CREATE TABLE public.order_details (
    id integer NOT NULL,
    order_id integer,
    dish_id integer,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    special_requests character varying(255),
    created_at timestamp without time zone DEFAULT now()
);
 !   DROP TABLE public.order_details;
       public         heap r       food_lps0_user    false    6            �            1259    16720    order_details_id_seq    SEQUENCE     �   CREATE SEQUENCE public.order_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.order_details_id_seq;
       public               food_lps0_user    false    6    232            �           0    0    order_details_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.order_details_id_seq OWNED BY public.order_details.id;
          public               food_lps0_user    false    231            �            1259    16699    orders    TABLE     �  CREATE TABLE public.orders (
    order_id integer NOT NULL,
    user_id uuid,
    total_price numeric(10,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    table_id integer,
    order_date timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
    DROP TABLE public.orders;
       public         heap r       food_lps0_user    false    6            �            1259    16777    order_items_view    VIEW     �  CREATE VIEW public.order_items_view AS
 SELECT od.id,
    od.order_id,
    o.user_id,
    od.dish_id,
    d.name AS dish_name,
    d.category AS dish_category,
    od.quantity,
    od.price,
    (od.price * (od.quantity)::numeric) AS subtotal,
    od.special_requests,
    od.created_at
   FROM ((public.order_details od
     JOIN public.orders o ON ((od.order_id = o.order_id)))
     JOIN public.dishes d ON ((od.dish_id = d.dish_id)));
 #   DROP VIEW public.order_items_view;
       public       v       food_lps0_user    false    232    232    232    232    230    230    228    232    232    232    228    228    6            �            1259    16698    orders_order_id_seq    SEQUENCE     �   CREATE SEQUENCE public.orders_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.orders_order_id_seq;
       public               food_lps0_user    false    230    6            �           0    0    orders_order_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public.orders_order_id_seq OWNED BY public.orders.order_id;
          public               food_lps0_user    false    229            �            1259    16640 	   referrals    TABLE     I  CREATE TABLE public.referrals (
    id integer NOT NULL,
    referrer_id uuid,
    referred_id uuid,
    commission numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
    DROP TABLE public.referrals;
       public         heap r       food_lps0_user    false    6            �            1259    16639    referrals_id_seq    SEQUENCE     �   CREATE SEQUENCE public.referrals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public.referrals_id_seq;
       public               food_lps0_user    false    222    6            �           0    0    referrals_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public.referrals_id_seq OWNED BY public.referrals.id;
          public               food_lps0_user    false    221            �            1259    16625    refresh_tokens    TABLE     �   CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    token character varying(500) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);
 "   DROP TABLE public.refresh_tokens;
       public         heap r       food_lps0_user    false    6            �            1259    16624    refresh_tokens_id_seq    SEQUENCE     �   CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ,   DROP SEQUENCE public.refresh_tokens_id_seq;
       public               food_lps0_user    false    220    6            �           0    0    refresh_tokens_id_seq    SEQUENCE OWNED BY     O   ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;
          public               food_lps0_user    false    219            �            1259    16739    reservations    TABLE     �  CREATE TABLE public.reservations (
    reservation_id integer NOT NULL,
    user_id uuid,
    table_id integer,
    reservation_time timestamp without time zone NOT NULL,
    party_size integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    customer_name character varying(100),
    phone_number character varying(20),
    special_requests text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
     DROP TABLE public.reservations;
       public         heap r       food_lps0_user    false    6            �            1259    16738    reservations_reservation_id_seq    SEQUENCE     �   CREATE SEQUENCE public.reservations_reservation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 6   DROP SEQUENCE public.reservations_reservation_id_seq;
       public               food_lps0_user    false    234    6            �           0    0    reservations_reservation_id_seq    SEQUENCE OWNED BY     c   ALTER SEQUENCE public.reservations_reservation_id_seq OWNED BY public.reservations.reservation_id;
          public               food_lps0_user    false    233            �            1259    16675    tables    TABLE     =  CREATE TABLE public.tables (
    table_id integer NOT NULL,
    table_number integer NOT NULL,
    capacity integer NOT NULL,
    status character varying(20) DEFAULT 'available'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
    DROP TABLE public.tables;
       public         heap r       food_lps0_user    false    6            �            1259    16674    tables_table_id_seq    SEQUENCE     �   CREATE SEQUENCE public.tables_table_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.tables_table_id_seq;
       public               food_lps0_user    false    226    6            �           0    0    tables_table_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public.tables_table_id_seq OWNED BY public.tables.table_id;
          public               food_lps0_user    false    225            �            1259    16593    users    TABLE     T  CREATE TABLE public.users (
    user_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(100),
    phone_number character varying(20),
    referral_code character varying(20),
    referred_by uuid,
    wallet_balance numeric(10,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    role character varying(20) DEFAULT 'customer'::character varying
);
    DROP TABLE public.users;
       public         heap r       food_lps0_user    false    2    6    6            �            1259    16616    verification_codes    TABLE     \  CREATE TABLE public.verification_codes (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    code character varying(10) NOT NULL,
    type character varying(20) NOT NULL,
    expiration_time timestamp without time zone NOT NULL,
    is_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);
 &   DROP TABLE public.verification_codes;
       public         heap r       food_lps0_user    false    6            �            1259    16615    verification_codes_id_seq    SEQUENCE     �   CREATE SEQUENCE public.verification_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public.verification_codes_id_seq;
       public               food_lps0_user    false    218    6            �           0    0    verification_codes_id_seq    SEQUENCE OWNED BY     W   ALTER SEQUENCE public.verification_codes_id_seq OWNED BY public.verification_codes.id;
          public               food_lps0_user    false    217            �            1259    16660    wallet_transactions    TABLE     (  CREATE TABLE public.wallet_transactions (
    id integer NOT NULL,
    user_id uuid,
    amount numeric(10,2) NOT NULL,
    transaction_type character varying(20) NOT NULL,
    reference_id character varying(255),
    description text,
    created_at timestamp without time zone DEFAULT now()
);
 '   DROP TABLE public.wallet_transactions;
       public         heap r       food_lps0_user    false    6            �            1259    16659    wallet_transactions_id_seq    SEQUENCE     �   CREATE SEQUENCE public.wallet_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public.wallet_transactions_id_seq;
       public               food_lps0_user    false    6    224            �           0    0    wallet_transactions_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.wallet_transactions_id_seq OWNED BY public.wallet_transactions.id;
          public               food_lps0_user    false    223            �           2604    16690    dishes dish_id    DEFAULT     p   ALTER TABLE ONLY public.dishes ALTER COLUMN dish_id SET DEFAULT nextval('public.dishes_dish_id_seq'::regclass);
 =   ALTER TABLE public.dishes ALTER COLUMN dish_id DROP DEFAULT;
       public               food_lps0_user    false    227    228    228            �           2604    16724    order_details id    DEFAULT     t   ALTER TABLE ONLY public.order_details ALTER COLUMN id SET DEFAULT nextval('public.order_details_id_seq'::regclass);
 ?   ALTER TABLE public.order_details ALTER COLUMN id DROP DEFAULT;
       public               food_lps0_user    false    231    232    232            �           2604    16702    orders order_id    DEFAULT     r   ALTER TABLE ONLY public.orders ALTER COLUMN order_id SET DEFAULT nextval('public.orders_order_id_seq'::regclass);
 >   ALTER TABLE public.orders ALTER COLUMN order_id DROP DEFAULT;
       public               food_lps0_user    false    230    229    230            �           2604    16643    referrals id    DEFAULT     l   ALTER TABLE ONLY public.referrals ALTER COLUMN id SET DEFAULT nextval('public.referrals_id_seq'::regclass);
 ;   ALTER TABLE public.referrals ALTER COLUMN id DROP DEFAULT;
       public               food_lps0_user    false    222    221    222            �           2604    16628    refresh_tokens id    DEFAULT     v   ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);
 @   ALTER TABLE public.refresh_tokens ALTER COLUMN id DROP DEFAULT;
       public               food_lps0_user    false    220    219    220            �           2604    16742    reservations reservation_id    DEFAULT     �   ALTER TABLE ONLY public.reservations ALTER COLUMN reservation_id SET DEFAULT nextval('public.reservations_reservation_id_seq'::regclass);
 J   ALTER TABLE public.reservations ALTER COLUMN reservation_id DROP DEFAULT;
       public               food_lps0_user    false    234    233    234            �           2604    16678    tables table_id    DEFAULT     r   ALTER TABLE ONLY public.tables ALTER COLUMN table_id SET DEFAULT nextval('public.tables_table_id_seq'::regclass);
 >   ALTER TABLE public.tables ALTER COLUMN table_id DROP DEFAULT;
       public               food_lps0_user    false    225    226    226            �           2604    16619    verification_codes id    DEFAULT     ~   ALTER TABLE ONLY public.verification_codes ALTER COLUMN id SET DEFAULT nextval('public.verification_codes_id_seq'::regclass);
 D   ALTER TABLE public.verification_codes ALTER COLUMN id DROP DEFAULT;
       public               food_lps0_user    false    218    217    218            �           2604    16663    wallet_transactions id    DEFAULT     �   ALTER TABLE ONLY public.wallet_transactions ALTER COLUMN id SET DEFAULT nextval('public.wallet_transactions_id_seq'::regclass);
 E   ALTER TABLE public.wallet_transactions ALTER COLUMN id DROP DEFAULT;
       public               food_lps0_user    false    223    224    224            �          0    16687    dishes 
   TABLE DATA           x   COPY public.dishes (dish_id, name, description, price, image_url, rating, category, created_at, updated_at) FROM stdin;
    public               food_lps0_user    false    228   |�       �          0    16721    order_details 
   TABLE DATA           m   COPY public.order_details (id, order_id, dish_id, quantity, price, special_requests, created_at) FROM stdin;
    public               food_lps0_user    false    232   b�       �          0    16699    orders 
   TABLE DATA           v   COPY public.orders (order_id, user_id, total_price, status, table_id, order_date, created_at, updated_at) FROM stdin;
    public               food_lps0_user    false    230   p�       �          0    16640 	   referrals 
   TABLE DATA           m   COPY public.referrals (id, referrer_id, referred_id, commission, status, created_at, updated_at) FROM stdin;
    public               food_lps0_user    false    222   )�       �          0    16625    refresh_tokens 
   TABLE DATA           H   COPY public.refresh_tokens (id, user_id, token, created_at) FROM stdin;
    public               food_lps0_user    false    220   ��       �          0    16739    reservations 
   TABLE DATA           �   COPY public.reservations (reservation_id, user_id, table_id, reservation_time, party_size, status, customer_name, phone_number, special_requests, created_at, updated_at) FROM stdin;
    public               food_lps0_user    false    234   ՟       �          0    16675    tables 
   TABLE DATA           b   COPY public.tables (table_id, table_number, capacity, status, created_at, updated_at) FROM stdin;
    public               food_lps0_user    false    226   ʠ       �          0    16593    users 
   TABLE DATA           �   COPY public.users (user_id, username, email, password, full_name, phone_number, referral_code, referred_by, wallet_balance, created_at, updated_at, role) FROM stdin;
    public               food_lps0_user    false    216   R�       �          0    16616    verification_codes 
   TABLE DATA           m   COPY public.verification_codes (id, email, code, type, expiration_time, is_verified, created_at) FROM stdin;
    public               food_lps0_user    false    218   l�       �          0    16660    wallet_transactions 
   TABLE DATA           {   COPY public.wallet_transactions (id, user_id, amount, transaction_type, reference_id, description, created_at) FROM stdin;
    public               food_lps0_user    false    224   ��       �           0    0    dishes_dish_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.dishes_dish_id_seq', 15, true);
          public               food_lps0_user    false    227            �           0    0    order_details_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.order_details_id_seq', 17, true);
          public               food_lps0_user    false    231            �           0    0    orders_order_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.orders_order_id_seq', 5, true);
          public               food_lps0_user    false    229            �           0    0    referrals_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public.referrals_id_seq', 3, true);
          public               food_lps0_user    false    221            �           0    0    refresh_tokens_id_seq    SEQUENCE SET     D   SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 1, false);
          public               food_lps0_user    false    219            �           0    0    reservations_reservation_id_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public.reservations_reservation_id_seq', 4, true);
          public               food_lps0_user    false    233            �           0    0    tables_table_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.tables_table_id_seq', 10, true);
          public               food_lps0_user    false    225            �           0    0    verification_codes_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.verification_codes_id_seq', 1, false);
          public               food_lps0_user    false    217            �           0    0    wallet_transactions_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.wallet_transactions_id_seq', 4, true);
          public               food_lps0_user    false    223                        2606    16697    dishes dishes_pkey 
   CONSTRAINT     U   ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_pkey PRIMARY KEY (dish_id);
 <   ALTER TABLE ONLY public.dishes DROP CONSTRAINT dishes_pkey;
       public                 food_lps0_user    false    228                       2606    16727     order_details order_details_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.order_details DROP CONSTRAINT order_details_pkey;
       public                 food_lps0_user    false    232                       2606    16709    orders orders_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);
 <   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_pkey;
       public                 food_lps0_user    false    230            �           2606    16648    referrals referrals_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);
 B   ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_pkey;
       public                 food_lps0_user    false    222            �           2606    16633 "   refresh_tokens refresh_tokens_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);
 L   ALTER TABLE ONLY public.refresh_tokens DROP CONSTRAINT refresh_tokens_pkey;
       public                 food_lps0_user    false    220                       2606    16749    reservations reservations_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (reservation_id);
 H   ALTER TABLE ONLY public.reservations DROP CONSTRAINT reservations_pkey;
       public                 food_lps0_user    false    234            �           2606    16683    tables tables_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (table_id);
 <   ALTER TABLE ONLY public.tables DROP CONSTRAINT tables_pkey;
       public                 food_lps0_user    false    226            �           2606    16685    tables tables_table_number_key 
   CONSTRAINT     a   ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_table_number_key UNIQUE (table_number);
 H   ALTER TABLE ONLY public.tables DROP CONSTRAINT tables_table_number_key;
       public                 food_lps0_user    false    226            �           2606    16607    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public                 food_lps0_user    false    216            �           2606    16603    users users_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public                 food_lps0_user    false    216            �           2606    16609    users users_referral_code_key 
   CONSTRAINT     a   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);
 G   ALTER TABLE ONLY public.users DROP CONSTRAINT users_referral_code_key;
       public                 food_lps0_user    false    216            �           2606    16605    users users_username_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);
 B   ALTER TABLE ONLY public.users DROP CONSTRAINT users_username_key;
       public                 food_lps0_user    false    216            �           2606    16623 *   verification_codes verification_codes_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.verification_codes
    ADD CONSTRAINT verification_codes_pkey PRIMARY KEY (id);
 T   ALTER TABLE ONLY public.verification_codes DROP CONSTRAINT verification_codes_pkey;
       public                 food_lps0_user    false    218            �           2606    16668 ,   wallet_transactions wallet_transactions_pkey 
   CONSTRAINT     j   ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);
 V   ALTER TABLE ONLY public.wallet_transactions DROP CONSTRAINT wallet_transactions_pkey;
       public                 food_lps0_user    false    224                       1259    16763    idx_dishes_category    INDEX     J   CREATE INDEX idx_dishes_category ON public.dishes USING btree (category);
 '   DROP INDEX public.idx_dishes_category;
       public                 food_lps0_user    false    228                       1259    16766    idx_order_details_order_id    INDEX     X   CREATE INDEX idx_order_details_order_id ON public.order_details USING btree (order_id);
 .   DROP INDEX public.idx_order_details_order_id;
       public                 food_lps0_user    false    232                       1259    16765    idx_orders_status    INDEX     F   CREATE INDEX idx_orders_status ON public.orders USING btree (status);
 %   DROP INDEX public.idx_orders_status;
       public                 food_lps0_user    false    230                       1259    16764    idx_orders_user_id    INDEX     H   CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);
 &   DROP INDEX public.idx_orders_user_id;
       public                 food_lps0_user    false    230            	           1259    16768 !   idx_reservations_reservation_time    INDEX     f   CREATE INDEX idx_reservations_reservation_time ON public.reservations USING btree (reservation_time);
 5   DROP INDEX public.idx_reservations_reservation_time;
       public                 food_lps0_user    false    234            
           1259    16767    idx_reservations_user_id    INDEX     T   CREATE INDEX idx_reservations_user_id ON public.reservations USING btree (user_id);
 ,   DROP INDEX public.idx_reservations_user_id;
       public                 food_lps0_user    false    234            �           1259    16760    idx_users_email    INDEX     B   CREATE INDEX idx_users_email ON public.users USING btree (email);
 #   DROP INDEX public.idx_users_email;
       public                 food_lps0_user    false    216            �           1259    16762    idx_users_referral_code    INDEX     R   CREATE INDEX idx_users_referral_code ON public.users USING btree (referral_code);
 +   DROP INDEX public.idx_users_referral_code;
       public                 food_lps0_user    false    216            �           1259    16761    idx_users_username    INDEX     H   CREATE INDEX idx_users_username ON public.users USING btree (username);
 &   DROP INDEX public.idx_users_username;
       public                 food_lps0_user    false    216            �           1259    16769    idx_wallet_transactions_user_id    INDEX     b   CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions USING btree (user_id);
 3   DROP INDEX public.idx_wallet_transactions_user_id;
       public                 food_lps0_user    false    224                       2620    16773    dishes update_dishes_timestamp    TRIGGER        CREATE TRIGGER update_dishes_timestamp BEFORE UPDATE ON public.dishes FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
 7   DROP TRIGGER update_dishes_timestamp ON public.dishes;
       public               food_lps0_user    false    228    257                       2620    16774    orders update_orders_timestamp    TRIGGER        CREATE TRIGGER update_orders_timestamp BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
 7   DROP TRIGGER update_orders_timestamp ON public.orders;
       public               food_lps0_user    false    257    230                       2620    16776 $   referrals update_referrals_timestamp    TRIGGER     �   CREATE TRIGGER update_referrals_timestamp BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
 =   DROP TRIGGER update_referrals_timestamp ON public.referrals;
       public               food_lps0_user    false    222    257                       2620    16775 *   reservations update_reservations_timestamp    TRIGGER     �   CREATE TRIGGER update_reservations_timestamp BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
 C   DROP TRIGGER update_reservations_timestamp ON public.reservations;
       public               food_lps0_user    false    234    257                       2620    16772    tables update_tables_timestamp    TRIGGER        CREATE TRIGGER update_tables_timestamp BEFORE UPDATE ON public.tables FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
 7   DROP TRIGGER update_tables_timestamp ON public.tables;
       public               food_lps0_user    false    226    257                       2620    16771    users update_users_timestamp    TRIGGER     }   CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
 5   DROP TRIGGER update_users_timestamp ON public.users;
       public               food_lps0_user    false    257    216                       2606    16733 (   order_details order_details_dish_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(dish_id) ON DELETE CASCADE;
 R   ALTER TABLE ONLY public.order_details DROP CONSTRAINT order_details_dish_id_fkey;
       public               food_lps0_user    false    3328    232    228                       2606    16728 )   order_details order_details_order_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE;
 S   ALTER TABLE ONLY public.order_details DROP CONSTRAINT order_details_order_id_fkey;
       public               food_lps0_user    false    3333    230    232                       2606    16715    orders orders_table_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(table_id);
 E   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_table_id_fkey;
       public               food_lps0_user    false    230    3324    226                       2606    16710    orders orders_user_id_fkey    FK CONSTRAINT     ~   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 D   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_user_id_fkey;
       public               food_lps0_user    false    3309    216    230                       2606    16654 $   referrals referrals_referred_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES public.users(user_id);
 N   ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_referred_id_fkey;
       public               food_lps0_user    false    3309    222    216                       2606    16649 $   referrals referrals_referrer_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.users(user_id);
 N   ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_referrer_id_fkey;
       public               food_lps0_user    false    3309    222    216                       2606    16634 *   refresh_tokens refresh_tokens_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
 T   ALTER TABLE ONLY public.refresh_tokens DROP CONSTRAINT refresh_tokens_user_id_fkey;
       public               food_lps0_user    false    220    216    3309                       2606    16755 '   reservations reservations_table_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(table_id);
 Q   ALTER TABLE ONLY public.reservations DROP CONSTRAINT reservations_table_id_fkey;
       public               food_lps0_user    false    3324    226    234                       2606    16750 &   reservations reservations_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 P   ALTER TABLE ONLY public.reservations DROP CONSTRAINT reservations_user_id_fkey;
       public               food_lps0_user    false    3309    216    234                       2606    16610    users users_referred_by_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.users(user_id);
 F   ALTER TABLE ONLY public.users DROP CONSTRAINT users_referred_by_fkey;
       public               food_lps0_user    false    216    216    3309                       2606    16669 4   wallet_transactions wallet_transactions_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 ^   ALTER TABLE ONLY public.wallet_transactions DROP CONSTRAINT wallet_transactions_user_id_fkey;
       public               food_lps0_user    false    3309    224    216            3           826    16391     DEFAULT PRIVILEGES FOR SEQUENCES    DEFAULT ACL     U   ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO food_lps0_user;
                        postgres    false            5           826    16393    DEFAULT PRIVILEGES FOR TYPES    DEFAULT ACL     Q   ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO food_lps0_user;
                        postgres    false            4           826    16392     DEFAULT PRIVILEGES FOR FUNCTIONS    DEFAULT ACL     U   ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO food_lps0_user;
                        postgres    false            2           826    16390    DEFAULT PRIVILEGES FOR TABLES    DEFAULT ACL     �   ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO food_lps0_user;
                        postgres    false            �   �  x����n�@��7O1/�Ď���W��h���fbO<C�k�.����D,h@H�*�ɂ�Q��o�u�6AH�J*y1�>�{��x>�L��O8WiLވ�-<F�R~���'#���m[�U�,�I��F���Q������h�L#��:�U�YpZV���l�YΞ��9��٫w-�e���UkB?�I��|�Z�!�I���_F�T@���tE�ݕ�)�P7�$�g��<��R�1��c�"<� ���8�ׯ�+a��4"�|�-��V&Kі��B�.���<�R[��a������Z±f�k!�U��p-�Zz(�J��Z�1K��ׁ۪����@gk�RmB��d�⾟�#@u�ͦ�W���Gp����O�5�x!�Ħ&Ы �G'~EG�P,�T�m;ۃ!�ɻ�d�nҿ��eA`�WA�d��y�}d7�tq��?��!Y<.��"K��EJ��(*q��u��Ni[�}].�[I�w�)�˳/)��2��*�t)�pu��%�&���.�m�H���)9):=�1�Pi�3c�N���وF4]A5-8*���%v�[��C6��
�0
v�i�Կ�!�d�]0]ll�_o��n�y>�AK��%Ma���c��eOI�I�o#N�Y��c�b���ɋ��&��/�G}EL����SAH�%��dٙ������C*7��x!^j��Jp#*����U�V���/�e      �   �   x����n�0E��W���;N�g���6�-RD*j���[�(���cu��q�(#�U�QI����S��}��bR��_�i�O�ںD�ԅ���s�������)�tyoO9�Is(U͕1���h��C�Щ��bN�P	6Ӣb<��˚�+8���|v?7�N�FC�Ɵ��2�lok~ H�PT�Q,��x�a�N`nU3<#��(
��ƌ��ᛁ�]���1f�
W<
�z2�+�s�0�1Ҷ,���[��      �   �   x���M
�0�דS���I4�,�t�T�VE{�F\�TK��}���#P�Yc]�:�Z����ɖ��&	x'&��@�ؿ�g~���-�%��\��PT���o�0��k��5���~�d���Ysy��2���i;;�}3�i�&�~�d�1;�;C�R�5����Vc>d�      �      x���1�0E��\�ѷ������I�@0pѝ����=�O��w��p�0����,5Nf�Z�XE��%u�����ٿ�9�.e���۶�����{u.��(MèD�ܧ�\���E�!�{"��n}      �      x������ � �      �   �   x����j!���S���]��vS�&�Q�B�A'��}�!�4�݁��.C�8o-��:"a1�9�vκ �Gq���0��xj��nO�d��>�%�3�|�k>C��	�f����C,�g�����2�1����h����,��5�5�@
1}t�[�f\H��{L!�p�yŗ���m3���:C����n���F=�ؠ�v��-���F=\kLP+nE�����4M�b��      �   x   x���;�0D��)r�����,i�p��
$Ο�)�h�[�i�1�v�}�utI�H'���"5����+�1���P�nJ�&�M��x�m��KAy�K�}G?�q��OȂL�.�����!�/���(      �   
  x���Ak�0�s�~���K�IO�����[/��R�uԎ��/�Z�ɠ����3j�9[iMu�
�(jmZ��Zmk��0$�G�ZwasZ�/Ӿ�\Ru-y�������T
�~}W� ��~K�� �8e<f|��$L�՚Q�L����K�t���g����Dǁ��1�z�.H5M�n�t���a�k_fJ��7��]?k�����=����К�)@��!Ļ�]��3=��ϯ/ۡ����[�t%�D���	GG�$��o�      �      x������ � �      �   	  x���?K�0��9}�7��?m/���&�[�&m�ݥPstvrG߀���P�}����;�����HcT��8͈�V*�8Q*U�")E1OH�j��Gj~�Ъ�Pݣ+��C�d���{�W|�ݳݿ��g�[_�L� FX�	Ô���2.���iX=?���^y�翤�d"���+��G����M���M��?�6֗���ܢ�9��[~�9�|����)��}uK���g�NI���(N"=��:��-��i     