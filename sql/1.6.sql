PGDMP                      }            food_db    17.4    17.4 �               0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false                       0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false                       0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false                       1262    16628    food_db    DATABASE     m   CREATE DATABASE food_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en-US';
    DROP DATABASE food_db;
                     postgres    false                        3079    16629 	   uuid-ossp 	   EXTENSION     ?   CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
    DROP EXTENSION "uuid-ossp";
                        false                       0    0    EXTENSION "uuid-ossp"    COMMENT     W   COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';
                             false    2            �            1259    17306    cart    TABLE     &  CREATE TABLE public.cart (
    cart_id integer NOT NULL,
    user_id uuid NOT NULL,
    dish_id integer NOT NULL,
    size_id integer,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
    DROP TABLE public.cart;
       public         heap r       postgres    false            �            1259    17312    cart_cart_id_seq    SEQUENCE     �   CREATE SEQUENCE public.cart_cart_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public.cart_cart_id_seq;
       public               postgres    false    218                        0    0    cart_cart_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public.cart_cart_id_seq OWNED BY public.cart.cart_id;
          public               postgres    false    219            �            1259    25850    dish_ratings    TABLE     n  CREATE TABLE public.dish_ratings (
    id integer NOT NULL,
    dish_id integer NOT NULL,
    user_id uuid NOT NULL,
    rating integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT dish_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);
     DROP TABLE public.dish_ratings;
       public         heap r       postgres    false            �            1259    25849    dish_ratings_id_seq    SEQUENCE     �   CREATE SEQUENCE public.dish_ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.dish_ratings_id_seq;
       public               postgres    false    245            !           0    0    dish_ratings_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public.dish_ratings_id_seq OWNED BY public.dish_ratings.id;
          public               postgres    false    244            �            1259    25805 
   dish_sizes    TABLE       CREATE TABLE public.dish_sizes (
    id integer NOT NULL,
    dish_id integer NOT NULL,
    size_name character varying(50) NOT NULL,
    price_adjustment numeric(10,2) DEFAULT 0.00 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
    DROP TABLE public.dish_sizes;
       public         heap r       postgres    false            �            1259    25804    dish_sizes_id_seq    SEQUENCE     �   CREATE SEQUENCE public.dish_sizes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.dish_sizes_id_seq;
       public               postgres    false    239            "           0    0    dish_sizes_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.dish_sizes_id_seq OWNED BY public.dish_sizes.id;
          public               postgres    false    238            �            1259    25830    dish_toppings    TABLE     �   CREATE TABLE public.dish_toppings (
    id integer NOT NULL,
    dish_id integer NOT NULL,
    topping_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
 !   DROP TABLE public.dish_toppings;
       public         heap r       postgres    false            �            1259    25829    dish_toppings_id_seq    SEQUENCE     �   CREATE SEQUENCE public.dish_toppings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.dish_toppings_id_seq;
       public               postgres    false    243            #           0    0    dish_toppings_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.dish_toppings_id_seq OWNED BY public.dish_toppings.id;
          public               postgres    false    242            �            1259    25892    dishes    TABLE     �  CREATE TABLE public.dishes (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    category character varying(100) NOT NULL,
    price numeric(10,2) NOT NULL,
    preparation_time integer NOT NULL,
    image character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    available boolean DEFAULT true
);
    DROP TABLE public.dishes;
       public         heap r       postgres    false            �            1259    25891    dishes_id_seq    SEQUENCE     �   CREATE SEQUENCE public.dishes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public.dishes_id_seq;
       public               postgres    false    247            $           0    0    dishes_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public.dishes_id_seq OWNED BY public.dishes.id;
          public               postgres    false    246            �            1259    17409    order_details    TABLE       CREATE TABLE public.order_details (
    id integer NOT NULL,
    order_id integer,
    dish_id integer,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    special_requests character varying(255),
    created_at timestamp without time zone DEFAULT now()
);
 !   DROP TABLE public.order_details;
       public         heap r       postgres    false            �            1259    17413    order_details_id_seq    SEQUENCE     �   CREATE SEQUENCE public.order_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.order_details_id_seq;
       public               postgres    false    223            %           0    0    order_details_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.order_details_id_seq OWNED BY public.order_details.id;
          public               postgres    false    224            �            1259    17414    orders    TABLE     �  CREATE TABLE public.orders (
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
       public         heap r       postgres    false            �            1259    17427    orders_order_id_seq    SEQUENCE     �   CREATE SEQUENCE public.orders_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.orders_order_id_seq;
       public               postgres    false    225            &           0    0    orders_order_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public.orders_order_id_seq OWNED BY public.orders.order_id;
          public               postgres    false    226            �            1259    17313    referral_commission_rates    TABLE     �   CREATE TABLE public.referral_commission_rates (
    level integer NOT NULL,
    rate numeric(5,2) NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);
 -   DROP TABLE public.referral_commission_rates;
       public         heap r       postgres    false            �            1259    17317    referral_tree    TABLE     �   CREATE TABLE public.referral_tree (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    ancestor_id uuid NOT NULL,
    level integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);
 !   DROP TABLE public.referral_tree;
       public         heap r       postgres    false            �            1259    17321    referral_tree_id_seq    SEQUENCE     �   CREATE SEQUENCE public.referral_tree_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.referral_tree_id_seq;
       public               postgres    false    221            '           0    0    referral_tree_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.referral_tree_id_seq OWNED BY public.referral_tree.id;
          public               postgres    false    222            �            1259    17428 	   referrals    TABLE     f  CREATE TABLE public.referrals (
    id integer NOT NULL,
    referrer_id uuid,
    referred_id uuid,
    commission numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    level integer DEFAULT 1
);
    DROP TABLE public.referrals;
       public         heap r       postgres    false            �            1259    17435    referrals_id_seq    SEQUENCE     �   CREATE SEQUENCE public.referrals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public.referrals_id_seq;
       public               postgres    false    227            (           0    0    referrals_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public.referrals_id_seq OWNED BY public.referrals.id;
          public               postgres    false    228            �            1259    17436    refresh_tokens    TABLE     �   CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    token character varying(500) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);
 "   DROP TABLE public.refresh_tokens;
       public         heap r       postgres    false            �            1259    17442    refresh_tokens_id_seq    SEQUENCE     �   CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ,   DROP SEQUENCE public.refresh_tokens_id_seq;
       public               postgres    false    229            )           0    0    refresh_tokens_id_seq    SEQUENCE OWNED BY     O   ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;
          public               postgres    false    230            �            1259    17443    reservations    TABLE     �  CREATE TABLE public.reservations (
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
       public         heap r       postgres    false            �            1259    17451    reservations_reservation_id_seq    SEQUENCE     �   CREATE SEQUENCE public.reservations_reservation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 6   DROP SEQUENCE public.reservations_reservation_id_seq;
       public               postgres    false    231            *           0    0    reservations_reservation_id_seq    SEQUENCE OWNED BY     c   ALTER SEQUENCE public.reservations_reservation_id_seq OWNED BY public.reservations.reservation_id;
          public               postgres    false    232            �            1259    17452    tables    TABLE     =  CREATE TABLE public.tables (
    table_id integer NOT NULL,
    table_number integer NOT NULL,
    capacity integer NOT NULL,
    status character varying(20) DEFAULT 'available'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
    DROP TABLE public.tables;
       public         heap r       postgres    false            �            1259    17458    tables_table_id_seq    SEQUENCE     �   CREATE SEQUENCE public.tables_table_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.tables_table_id_seq;
       public               postgres    false    233            +           0    0    tables_table_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public.tables_table_id_seq OWNED BY public.tables.table_id;
          public               postgres    false    234            �            1259    25819    toppings    TABLE     F  CREATE TABLE public.toppings (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    price numeric(10,2) DEFAULT 0.00 NOT NULL,
    available boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
    DROP TABLE public.toppings;
       public         heap r       postgres    false            �            1259    25818    toppings_id_seq    SEQUENCE     �   CREATE SEQUENCE public.toppings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 &   DROP SEQUENCE public.toppings_id_seq;
       public               postgres    false    241            ,           0    0    toppings_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public.toppings_id_seq OWNED BY public.toppings.id;
          public               postgres    false    240            �            1259    17459    users    TABLE     w  CREATE TABLE public.users (
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
    role character varying(20) DEFAULT 'customer'::character varying,
    avatar character varying(255)
);
    DROP TABLE public.users;
       public         heap r       postgres    false    2            �            1259    25919    verification_codes    TABLE     '  CREATE TABLE public.verification_codes (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    code character varying(6) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_data jsonb
);
 &   DROP TABLE public.verification_codes;
       public         heap r       postgres    false            �            1259    25918    verification_codes_id_seq    SEQUENCE     �   CREATE SEQUENCE public.verification_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public.verification_codes_id_seq;
       public               postgres    false    249            -           0    0    verification_codes_id_seq    SEQUENCE OWNED BY     W   ALTER SEQUENCE public.verification_codes_id_seq OWNED BY public.verification_codes.id;
          public               postgres    false    248            �            1259    17475    wallet_transactions    TABLE     (  CREATE TABLE public.wallet_transactions (
    id integer NOT NULL,
    user_id uuid,
    amount numeric(10,2) NOT NULL,
    transaction_type character varying(20) NOT NULL,
    reference_id character varying(255),
    description text,
    created_at timestamp without time zone DEFAULT now()
);
 '   DROP TABLE public.wallet_transactions;
       public         heap r       postgres    false            �            1259    17481    wallet_transactions_id_seq    SEQUENCE     �   CREATE SEQUENCE public.wallet_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public.wallet_transactions_id_seq;
       public               postgres    false    236            .           0    0    wallet_transactions_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.wallet_transactions_id_seq OWNED BY public.wallet_transactions.id;
          public               postgres    false    237            �           2604    17482    cart cart_id    DEFAULT     l   ALTER TABLE ONLY public.cart ALTER COLUMN cart_id SET DEFAULT nextval('public.cart_cart_id_seq'::regclass);
 ;   ALTER TABLE public.cart ALTER COLUMN cart_id DROP DEFAULT;
       public               postgres    false    219    218                       2604    25853    dish_ratings id    DEFAULT     r   ALTER TABLE ONLY public.dish_ratings ALTER COLUMN id SET DEFAULT nextval('public.dish_ratings_id_seq'::regclass);
 >   ALTER TABLE public.dish_ratings ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    245    244    245                       2604    25808    dish_sizes id    DEFAULT     n   ALTER TABLE ONLY public.dish_sizes ALTER COLUMN id SET DEFAULT nextval('public.dish_sizes_id_seq'::regclass);
 <   ALTER TABLE public.dish_sizes ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    238    239    239                       2604    25833    dish_toppings id    DEFAULT     t   ALTER TABLE ONLY public.dish_toppings ALTER COLUMN id SET DEFAULT nextval('public.dish_toppings_id_seq'::regclass);
 ?   ALTER TABLE public.dish_toppings ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    243    242    243                       2604    25895 	   dishes id    DEFAULT     f   ALTER TABLE ONLY public.dishes ALTER COLUMN id SET DEFAULT nextval('public.dishes_id_seq'::regclass);
 8   ALTER TABLE public.dishes ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    247    246    247            �           2604    17486    order_details id    DEFAULT     t   ALTER TABLE ONLY public.order_details ALTER COLUMN id SET DEFAULT nextval('public.order_details_id_seq'::regclass);
 ?   ALTER TABLE public.order_details ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    224    223            �           2604    17487    orders order_id    DEFAULT     r   ALTER TABLE ONLY public.orders ALTER COLUMN order_id SET DEFAULT nextval('public.orders_order_id_seq'::regclass);
 >   ALTER TABLE public.orders ALTER COLUMN order_id DROP DEFAULT;
       public               postgres    false    226    225            �           2604    17488    referral_tree id    DEFAULT     t   ALTER TABLE ONLY public.referral_tree ALTER COLUMN id SET DEFAULT nextval('public.referral_tree_id_seq'::regclass);
 ?   ALTER TABLE public.referral_tree ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    222    221            �           2604    17489    referrals id    DEFAULT     l   ALTER TABLE ONLY public.referrals ALTER COLUMN id SET DEFAULT nextval('public.referrals_id_seq'::regclass);
 ;   ALTER TABLE public.referrals ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    228    227            �           2604    17490    refresh_tokens id    DEFAULT     v   ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);
 @   ALTER TABLE public.refresh_tokens ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    230    229            �           2604    17491    reservations reservation_id    DEFAULT     �   ALTER TABLE ONLY public.reservations ALTER COLUMN reservation_id SET DEFAULT nextval('public.reservations_reservation_id_seq'::regclass);
 J   ALTER TABLE public.reservations ALTER COLUMN reservation_id DROP DEFAULT;
       public               postgres    false    232    231            �           2604    17492    tables table_id    DEFAULT     r   ALTER TABLE ONLY public.tables ALTER COLUMN table_id SET DEFAULT nextval('public.tables_table_id_seq'::regclass);
 >   ALTER TABLE public.tables ALTER COLUMN table_id DROP DEFAULT;
       public               postgres    false    234    233                       2604    25822    toppings id    DEFAULT     j   ALTER TABLE ONLY public.toppings ALTER COLUMN id SET DEFAULT nextval('public.toppings_id_seq'::regclass);
 :   ALTER TABLE public.toppings ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    241    240    241                       2604    25922    verification_codes id    DEFAULT     ~   ALTER TABLE ONLY public.verification_codes ALTER COLUMN id SET DEFAULT nextval('public.verification_codes_id_seq'::regclass);
 D   ALTER TABLE public.verification_codes ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    249    248    249                       2604    17494    wallet_transactions id    DEFAULT     �   ALTER TABLE ONLY public.wallet_transactions ALTER COLUMN id SET DEFAULT nextval('public.wallet_transactions_id_seq'::regclass);
 E   ALTER TABLE public.wallet_transactions ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    237    236            �          0    17306    cart 
   TABLE DATA           d   COPY public.cart (cart_id, user_id, dish_id, size_id, quantity, created_at, updated_at) FROM stdin;
    public               postgres    false    218   ��                 0    25850    dish_ratings 
   TABLE DATA           \   COPY public.dish_ratings (id, dish_id, user_id, rating, created_at, updated_at) FROM stdin;
    public               postgres    false    245   ��                 0    25805 
   dish_sizes 
   TABLE DATA           Z   COPY public.dish_sizes (id, dish_id, size_name, price_adjustment, created_at) FROM stdin;
    public               postgres    false    239   ��                 0    25830    dish_toppings 
   TABLE DATA           L   COPY public.dish_toppings (id, dish_id, topping_id, created_at) FROM stdin;
    public               postgres    false    243   ��                 0    25892    dishes 
   TABLE DATA           �   COPY public.dishes (id, name, description, category, price, preparation_time, image, created_at, updated_at, available) FROM stdin;
    public               postgres    false    247   -�       �          0    17409    order_details 
   TABLE DATA           m   COPY public.order_details (id, order_id, dish_id, quantity, price, special_requests, created_at) FROM stdin;
    public               postgres    false    223   a�                  0    17414    orders 
   TABLE DATA           v   COPY public.orders (order_id, user_id, total_price, status, table_id, order_date, created_at, updated_at) FROM stdin;
    public               postgres    false    225   o�       �          0    17313    referral_commission_rates 
   TABLE DATA           L   COPY public.referral_commission_rates (level, rate, updated_at) FROM stdin;
    public               postgres    false    220   (�       �          0    17317    referral_tree 
   TABLE DATA           T   COPY public.referral_tree (id, user_id, ancestor_id, level, created_at) FROM stdin;
    public               postgres    false    221   w�                 0    17428 	   referrals 
   TABLE DATA           t   COPY public.referrals (id, referrer_id, referred_id, commission, status, created_at, updated_at, level) FROM stdin;
    public               postgres    false    227   ��                 0    17436    refresh_tokens 
   TABLE DATA           H   COPY public.refresh_tokens (id, user_id, token, created_at) FROM stdin;
    public               postgres    false    229   w�                 0    17443    reservations 
   TABLE DATA           �   COPY public.reservations (reservation_id, user_id, table_id, reservation_time, party_size, status, customer_name, phone_number, special_requests, created_at, updated_at) FROM stdin;
    public               postgres    false    231   ��                 0    17452    tables 
   TABLE DATA           b   COPY public.tables (table_id, table_number, capacity, status, created_at, updated_at) FROM stdin;
    public               postgres    false    233   ��                 0    25819    toppings 
   TABLE DATA           V   COPY public.toppings (id, name, price, available, created_at, updated_at) FROM stdin;
    public               postgres    false    241   +�       
          0    17459    users 
   TABLE DATA           �   COPY public.users (user_id, username, email, password, full_name, phone_number, referral_code, referred_by, wallet_balance, created_at, updated_at, role, avatar) FROM stdin;
    public               postgres    false    235   ��                 0    25919    verification_codes 
   TABLE DATA           `   COPY public.verification_codes (id, email, code, expires_at, created_at, user_data) FROM stdin;
    public               postgres    false    249   y�                 0    17475    wallet_transactions 
   TABLE DATA           {   COPY public.wallet_transactions (id, user_id, amount, transaction_type, reference_id, description, created_at) FROM stdin;
    public               postgres    false    236   ��       /           0    0    cart_cart_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.cart_cart_id_seq', 10, true);
          public               postgres    false    219            0           0    0    dish_ratings_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.dish_ratings_id_seq', 2, true);
          public               postgres    false    244            1           0    0    dish_sizes_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.dish_sizes_id_seq', 13, true);
          public               postgres    false    238            2           0    0    dish_toppings_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.dish_toppings_id_seq', 4, true);
          public               postgres    false    242            3           0    0    dishes_id_seq    SEQUENCE SET     ;   SELECT pg_catalog.setval('public.dishes_id_seq', 6, true);
          public               postgres    false    246            4           0    0    order_details_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.order_details_id_seq', 17, true);
          public               postgres    false    224            5           0    0    orders_order_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.orders_order_id_seq', 5, true);
          public               postgres    false    226            6           0    0    referral_tree_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.referral_tree_id_seq', 9, true);
          public               postgres    false    222            7           0    0    referrals_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public.referrals_id_seq', 3, true);
          public               postgres    false    228            8           0    0    refresh_tokens_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 2, true);
          public               postgres    false    230            9           0    0    reservations_reservation_id_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public.reservations_reservation_id_seq', 4, true);
          public               postgres    false    232            :           0    0    tables_table_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.tables_table_id_seq', 10, true);
          public               postgres    false    234            ;           0    0    toppings_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.toppings_id_seq', 4, true);
          public               postgres    false    240            <           0    0    verification_codes_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.verification_codes_id_seq', 1, true);
          public               postgres    false    248            =           0    0    wallet_transactions_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.wallet_transactions_id_seq', 4, true);
          public               postgres    false    237                       2606    17336    cart cart_pkey 
   CONSTRAINT     Q   ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (cart_id);
 8   ALTER TABLE ONLY public.cart DROP CONSTRAINT cart_pkey;
       public                 postgres    false    218            M           2606    25862 -   dish_ratings dish_ratings_dish_id_user_id_key 
   CONSTRAINT     t   ALTER TABLE ONLY public.dish_ratings
    ADD CONSTRAINT dish_ratings_dish_id_user_id_key UNIQUE (dish_id, user_id);
 W   ALTER TABLE ONLY public.dish_ratings DROP CONSTRAINT dish_ratings_dish_id_user_id_key;
       public                 postgres    false    245    245            O           2606    25860    dish_ratings dish_ratings_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public.dish_ratings
    ADD CONSTRAINT dish_ratings_pkey PRIMARY KEY (id);
 H   ALTER TABLE ONLY public.dish_ratings DROP CONSTRAINT dish_ratings_pkey;
       public                 postgres    false    245            B           2606    25812    dish_sizes dish_sizes_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.dish_sizes
    ADD CONSTRAINT dish_sizes_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.dish_sizes DROP CONSTRAINT dish_sizes_pkey;
       public                 postgres    false    239            G           2606    25838 2   dish_toppings dish_toppings_dish_id_topping_id_key 
   CONSTRAINT     |   ALTER TABLE ONLY public.dish_toppings
    ADD CONSTRAINT dish_toppings_dish_id_topping_id_key UNIQUE (dish_id, topping_id);
 \   ALTER TABLE ONLY public.dish_toppings DROP CONSTRAINT dish_toppings_dish_id_topping_id_key;
       public                 postgres    false    243    243            I           2606    25836     dish_toppings dish_toppings_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.dish_toppings
    ADD CONSTRAINT dish_toppings_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.dish_toppings DROP CONSTRAINT dish_toppings_pkey;
       public                 postgres    false    243            S           2606    25901    dishes dishes_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.dishes DROP CONSTRAINT dishes_pkey;
       public                 postgres    false    247            "           2606    17502     order_details order_details_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.order_details DROP CONSTRAINT order_details_pkey;
       public                 postgres    false    223            &           2606    17504    orders orders_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);
 <   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_pkey;
       public                 postgres    false    225                       2606    17338 8   referral_commission_rates referral_commission_rates_pkey 
   CONSTRAINT     y   ALTER TABLE ONLY public.referral_commission_rates
    ADD CONSTRAINT referral_commission_rates_pkey PRIMARY KEY (level);
 b   ALTER TABLE ONLY public.referral_commission_rates DROP CONSTRAINT referral_commission_rates_pkey;
       public                 postgres    false    220                       2606    17340     referral_tree referral_tree_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.referral_tree
    ADD CONSTRAINT referral_tree_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.referral_tree DROP CONSTRAINT referral_tree_pkey;
       public                 postgres    false    221                       2606    17342 3   referral_tree referral_tree_user_id_ancestor_id_key 
   CONSTRAINT     ~   ALTER TABLE ONLY public.referral_tree
    ADD CONSTRAINT referral_tree_user_id_ancestor_id_key UNIQUE (user_id, ancestor_id);
 ]   ALTER TABLE ONLY public.referral_tree DROP CONSTRAINT referral_tree_user_id_ancestor_id_key;
       public                 postgres    false    221    221            (           2606    17506    referrals referrals_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);
 B   ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_pkey;
       public                 postgres    false    227            *           2606    17508 "   refresh_tokens refresh_tokens_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);
 L   ALTER TABLE ONLY public.refresh_tokens DROP CONSTRAINT refresh_tokens_pkey;
       public                 postgres    false    229            .           2606    17510    reservations reservations_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (reservation_id);
 H   ALTER TABLE ONLY public.reservations DROP CONSTRAINT reservations_pkey;
       public                 postgres    false    231            0           2606    17512    tables tables_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (table_id);
 <   ALTER TABLE ONLY public.tables DROP CONSTRAINT tables_pkey;
       public                 postgres    false    233            2           2606    17514    tables tables_table_number_key 
   CONSTRAINT     a   ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_table_number_key UNIQUE (table_number);
 H   ALTER TABLE ONLY public.tables DROP CONSTRAINT tables_table_number_key;
       public                 postgres    false    233            E           2606    25828    toppings toppings_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.toppings
    ADD CONSTRAINT toppings_pkey PRIMARY KEY (id);
 @   ALTER TABLE ONLY public.toppings DROP CONSTRAINT toppings_pkey;
       public                 postgres    false    241            7           2606    17516    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public                 postgres    false    235            9           2606    17518    users users_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public                 postgres    false    235            ;           2606    17520    users users_referral_code_key 
   CONSTRAINT     a   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);
 G   ALTER TABLE ONLY public.users DROP CONSTRAINT users_referral_code_key;
       public                 postgres    false    235            =           2606    17522    users users_username_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);
 B   ALTER TABLE ONLY public.users DROP CONSTRAINT users_username_key;
       public                 postgres    false    235            V           2606    25929 /   verification_codes verification_codes_email_key 
   CONSTRAINT     k   ALTER TABLE ONLY public.verification_codes
    ADD CONSTRAINT verification_codes_email_key UNIQUE (email);
 Y   ALTER TABLE ONLY public.verification_codes DROP CONSTRAINT verification_codes_email_key;
       public                 postgres    false    249            X           2606    25927 *   verification_codes verification_codes_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.verification_codes
    ADD CONSTRAINT verification_codes_pkey PRIMARY KEY (id);
 T   ALTER TABLE ONLY public.verification_codes DROP CONSTRAINT verification_codes_pkey;
       public                 postgres    false    249            @           2606    17526 ,   wallet_transactions wallet_transactions_pkey 
   CONSTRAINT     j   ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);
 V   ALTER TABLE ONLY public.wallet_transactions DROP CONSTRAINT wallet_transactions_pkey;
       public                 postgres    false    236            P           1259    25877    idx_dish_ratings_dish_id    INDEX     T   CREATE INDEX idx_dish_ratings_dish_id ON public.dish_ratings USING btree (dish_id);
 ,   DROP INDEX public.idx_dish_ratings_dish_id;
       public                 postgres    false    245            Q           1259    25878    idx_dish_ratings_user_id    INDEX     T   CREATE INDEX idx_dish_ratings_user_id ON public.dish_ratings USING btree (user_id);
 ,   DROP INDEX public.idx_dish_ratings_user_id;
       public                 postgres    false    245            C           1259    25874    idx_dish_sizes_dish_id    INDEX     P   CREATE INDEX idx_dish_sizes_dish_id ON public.dish_sizes USING btree (dish_id);
 *   DROP INDEX public.idx_dish_sizes_dish_id;
       public                 postgres    false    239            J           1259    25875    idx_dish_toppings_dish_id    INDEX     V   CREATE INDEX idx_dish_toppings_dish_id ON public.dish_toppings USING btree (dish_id);
 -   DROP INDEX public.idx_dish_toppings_dish_id;
       public                 postgres    false    243            K           1259    25876    idx_dish_toppings_topping_id    INDEX     \   CREATE INDEX idx_dish_toppings_topping_id ON public.dish_toppings USING btree (topping_id);
 0   DROP INDEX public.idx_dish_toppings_topping_id;
       public                 postgres    false    243                        1259    17528    idx_order_details_order_id    INDEX     X   CREATE INDEX idx_order_details_order_id ON public.order_details USING btree (order_id);
 .   DROP INDEX public.idx_order_details_order_id;
       public                 postgres    false    223            #           1259    17529    idx_orders_status    INDEX     F   CREATE INDEX idx_orders_status ON public.orders USING btree (status);
 %   DROP INDEX public.idx_orders_status;
       public                 postgres    false    225            $           1259    17530    idx_orders_user_id    INDEX     H   CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);
 &   DROP INDEX public.idx_orders_user_id;
       public                 postgres    false    225            +           1259    17531 !   idx_reservations_reservation_time    INDEX     f   CREATE INDEX idx_reservations_reservation_time ON public.reservations USING btree (reservation_time);
 5   DROP INDEX public.idx_reservations_reservation_time;
       public                 postgres    false    231            ,           1259    17532    idx_reservations_user_id    INDEX     T   CREATE INDEX idx_reservations_user_id ON public.reservations USING btree (user_id);
 ,   DROP INDEX public.idx_reservations_user_id;
       public                 postgres    false    231            3           1259    17533    idx_users_email    INDEX     B   CREATE INDEX idx_users_email ON public.users USING btree (email);
 #   DROP INDEX public.idx_users_email;
       public                 postgres    false    235            4           1259    17534    idx_users_referral_code    INDEX     R   CREATE INDEX idx_users_referral_code ON public.users USING btree (referral_code);
 +   DROP INDEX public.idx_users_referral_code;
       public                 postgres    false    235            5           1259    17535    idx_users_username    INDEX     H   CREATE INDEX idx_users_username ON public.users USING btree (username);
 &   DROP INDEX public.idx_users_username;
       public                 postgres    false    235            T           1259    25930    idx_verification_email    INDEX     V   CREATE INDEX idx_verification_email ON public.verification_codes USING btree (email);
 *   DROP INDEX public.idx_verification_email;
       public                 postgres    false    249            >           1259    17536    idx_wallet_transactions_user_id    INDEX     b   CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions USING btree (user_id);
 3   DROP INDEX public.idx_wallet_transactions_user_id;
       public                 postgres    false    236            Y           2606    17553    cart cart_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
 @   ALTER TABLE ONLY public.cart DROP CONSTRAINT cart_user_id_fkey;
       public               postgres    false    218    4921    235            g           2606    25868 &   dish_ratings dish_ratings_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.dish_ratings
    ADD CONSTRAINT dish_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
 P   ALTER TABLE ONLY public.dish_ratings DROP CONSTRAINT dish_ratings_user_id_fkey;
       public               postgres    false    245    4921    235            f           2606    25844 +   dish_toppings dish_toppings_topping_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.dish_toppings
    ADD CONSTRAINT dish_toppings_topping_id_fkey FOREIGN KEY (topping_id) REFERENCES public.toppings(id) ON DELETE CASCADE;
 U   ALTER TABLE ONLY public.dish_toppings DROP CONSTRAINT dish_toppings_topping_id_fkey;
       public               postgres    false    243    241    4933            \           2606    17583 )   order_details order_details_order_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE;
 S   ALTER TABLE ONLY public.order_details DROP CONSTRAINT order_details_order_id_fkey;
       public               postgres    false    4902    225    223            ]           2606    17588    orders orders_table_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(table_id);
 E   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_table_id_fkey;
       public               postgres    false    233    225    4912            ^           2606    17593    orders orders_user_id_fkey    FK CONSTRAINT     ~   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 D   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_user_id_fkey;
       public               postgres    false    235    225    4921            Z           2606    17598 ,   referral_tree referral_tree_ancestor_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.referral_tree
    ADD CONSTRAINT referral_tree_ancestor_id_fkey FOREIGN KEY (ancestor_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
 V   ALTER TABLE ONLY public.referral_tree DROP CONSTRAINT referral_tree_ancestor_id_fkey;
       public               postgres    false    235    4921    221            [           2606    17603 (   referral_tree referral_tree_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.referral_tree
    ADD CONSTRAINT referral_tree_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
 R   ALTER TABLE ONLY public.referral_tree DROP CONSTRAINT referral_tree_user_id_fkey;
       public               postgres    false    4921    221    235            _           2606    17608 $   referrals referrals_referred_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES public.users(user_id);
 N   ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_referred_id_fkey;
       public               postgres    false    235    227    4921            `           2606    17613 $   referrals referrals_referrer_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.users(user_id);
 N   ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_referrer_id_fkey;
       public               postgres    false    4921    235    227            a           2606    17618 *   refresh_tokens refresh_tokens_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
 T   ALTER TABLE ONLY public.refresh_tokens DROP CONSTRAINT refresh_tokens_user_id_fkey;
       public               postgres    false    229    235    4921            b           2606    17623 '   reservations reservations_table_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(table_id);
 Q   ALTER TABLE ONLY public.reservations DROP CONSTRAINT reservations_table_id_fkey;
       public               postgres    false    233    4912    231            c           2606    17628 &   reservations reservations_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 P   ALTER TABLE ONLY public.reservations DROP CONSTRAINT reservations_user_id_fkey;
       public               postgres    false    4921    235    231            d           2606    17633    users users_referred_by_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.users(user_id);
 F   ALTER TABLE ONLY public.users DROP CONSTRAINT users_referred_by_fkey;
       public               postgres    false    4921    235    235            e           2606    17638 4   wallet_transactions wallet_transactions_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 ^   ALTER TABLE ONLY public.wallet_transactions DROP CONSTRAINT wallet_transactions_user_id_fkey;
       public               postgres    false    236    235    4921            �   �   x���K� ��)z�@��t���Gh�T�Ѡ�ˑ<z�2����l)���btFSJx�PJ*�n%���'��|V�,��HZ~ �9���f��C�7B�S�N2�R�ʵ�A:���j�9��SU�-� ۵�F�c�8F�p�S0,���)Z�qNq4�_#�9���1��!'���0�E,�s�ˉH�G1�Ze��n����S         M   x�}���  �7T�p8�k�#j�/!d�� �������};e�!ό<�y�@em�Fj�<�7���Y��~         �   x�}�OJ�A��ur
/��?�9��ܺ)XDh7��7E�n�m���a`x��.8d���Az�>o��1&�D�}9�~_�PsC-�|��8��r����`_eK��Ӗ���ot
��(���a�2N�^:m��X.�6�>�6>E,1�v���q S�&�N�8S��-�͹u��H��R�K��YgVUd-�$�Q��6���p�         N   x�u���0��
H���CRK����	4�yn27Q51����T��j�A��	9v��3���8Q�.?�+� lf�         $  x���Kn� E�fl ����4WY@&S��dp?^}�F��<���{Huv)�)������4�������w��KK�D��l4cC\���@�;�]��B(R�"��KIY���2�C�[?����ֆ%_���>���s�i�w"*��R��ۀ��[:����n	]SWQL��e��&I�%[� ��_�0�c'��'��K�)��˿9�=�������QMR�9r��
`{�9�#�8���f_�Z�&���q�wW7�!�K,���Pb_5�DivD�p*�*��  ߾'�      �   �   x����n�0E��W���;N�g���6�-RD*j���[�(���cu��q�(#�U�QI����S��}��bR��_�i�O�ںD�ԅ���s�������)�tyoO9�Is(U͕1���h��C�Щ��bN�P	6Ӣb<��˚�+8���|v?7�N�FC�Ɵ��2�lok~ H�PT�Q,��x�a�N`nU3<#��(
��ƌ��ᛁ�]���1f�
W<
�z2�+�s�0�1Ҷ,���[��          �   x���M
�0�דS���I4�,�t�T�VE{�F\�TK��}���#P�Yc]�:�Z����ɖ��&	x'&��@�ؿ�g~���-�%��\��PT���o�0��k��5���~�d���Ysy��2���i;;�}3�i�&�~�d�1;�;C�R�5����Vc>d�      �   ?   x���A�@�w��I�� ��:��}o��$D��W��tt*���C�aƆ�Ѩa|?�/�      �   `   x����� �3N��!X�ҋ���n�������n���1�Oѽ,��C�Zbh�P�L|#	&��k�J3i~4(�}���YBv=������P         �   x���1� Eg|�^���
9K��Ԫz5!���$?Y܆ޭ�¥�8�gf��8�k!cq6��-���~��W����0�En�}5�;%�!!�v�Υp��i�u��µo���Y�1�:DBOD�o+         '  x�Ր�r�0 E����$&��A�A��c��������ݜ{�rP���:.J�2fT�1�:9��B�s����z
}A��ykp���t�ǖK���2L���I[�؄�H��XG�&��]�R�Y k�m�o�ʋ�bm��YkwY8�[�Ē�N�S�h}y�} ��/�zhM^�W��l�R6�ڈ��"i�9��@N\��LG C����O��'С1!
���@N�п 8s^� �V�-�n�٪{��3^���&���O�c�s�!V�4EQޛ�"         �   x����j!���S���]��vS�&�Q�B�A'��}�!�4�݁��.C�8o-��:"a1�9�vκ �Gq���0��xj��nO�d��>�%�3�|�k>C��	�f����C,�g�����2�1����h����,��5�5�@
1}t�[�f\H��{L!�p�yŗ���m3���:C����n���F=�ؠ�v��-���F=\kLP+nE�����4M�b��         x   x���;�0D��)r�����,i�p��
$Ο�)�h�[�i�1�v�}�utI�H'���"5����+�1���P�nJ�&�M��x�m��KAy�K�}G?�q��OȂL�.�����!�/���(         }   x��α
1��z�)��Lv��K+��6W�g��F�;����t~�e
�{��JQ�I�>���XL�fA�Qׅ�.Km�W׹M}&H��/OnĶ��Q����K�v�}'DKi��&��(C!      
   �  x����n�0 �k������s�hU�NZ6)�]���d(&Ͷ��!I�jS�I������9m��Ҁ�ܕk�[�k-�e�����6�'����TMW�Ĵ���?E�C E�g��0�\ A���  D�f&,&l.*���^�D���e={y��O==�W�v��x���t��������#?��$���r���*����y����+�A^u�K��M�=ܯ֍���:ǣ5�2�B5m�0�_�]���%�?%1���h��8
���4�OL��l�U���Z�����L�F�]���V����r	9@Z��}P]��g5�ާ����G��?m�W5�<i�l�uD,7ܔSYH�3Ȱ*(Ů�)
�Zh48?�|���7]���߷�7�
��n\���|^|��� �j$Uɦ��IXL3�^�u#�(�� /*�            x������ � �         	  x���?K�0��9}�7��?m/���&�[�&m�ݥPstvrG߀���P�}����;�����HcT��8͈�V*�8Q*U�")E1OH�j��Gj~�Ъ�Pݣ+��C�d���{�W|�ݳݿ��g�[_�L� FX�	Ô���2.���iX=?���^y�翤�d"���+��G����M���M��?�6֗���ܢ�9��[~�9�|����)��}uK���g�NI���(N"=��:��-��i     