PGDMP       9                }            food_db    17.4    17.4 �    '           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            (           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            )           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            *           1262    16628    food_db    DATABASE     m   CREATE DATABASE food_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en-US';
    DROP DATABASE food_db;
                     postgres    false                        3079    16629 	   uuid-ossp 	   EXTENSION     ?   CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
    DROP EXTENSION "uuid-ossp";
                        false            +           0    0    EXTENSION "uuid-ossp"    COMMENT     W   COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';
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
       public               postgres    false    218            ,           0    0    cart_cart_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public.cart_cart_id_seq OWNED BY public.cart.cart_id;
          public               postgres    false    219            �            1259    17381    combo_items    TABLE     {  CREATE TABLE public.combo_items (
    combo_item_id integer NOT NULL,
    combo_id integer NOT NULL,
    dish_id integer NOT NULL,
    quantity integer DEFAULT 1,
    size_id integer,
    is_required boolean DEFAULT false,
    max_selections integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
    DROP TABLE public.combo_items;
       public         heap r       postgres    false            �            1259    17389    combo_items_combo_item_id_seq    SEQUENCE     �   CREATE SEQUENCE public.combo_items_combo_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public.combo_items_combo_item_id_seq;
       public               postgres    false    223            -           0    0    combo_items_combo_item_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public.combo_items_combo_item_id_seq OWNED BY public.combo_items.combo_item_id;
          public               postgres    false    224            �            1259    25850    dish_ratings    TABLE     n  CREATE TABLE public.dish_ratings (
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
       public               postgres    false    249            .           0    0    dish_ratings_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public.dish_ratings_id_seq OWNED BY public.dish_ratings.id;
          public               postgres    false    248            �            1259    25805 
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
       public               postgres    false    243            /           0    0    dish_sizes_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.dish_sizes_id_seq OWNED BY public.dish_sizes.id;
          public               postgres    false    242            �            1259    25830    dish_toppings    TABLE     �   CREATE TABLE public.dish_toppings (
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
       public               postgres    false    247            0           0    0    dish_toppings_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.dish_toppings_id_seq OWNED BY public.dish_toppings.id;
          public               postgres    false    246            �            1259    25892    dishes    TABLE     �  CREATE TABLE public.dishes (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    category character varying(100) NOT NULL,
    price numeric(10,2) NOT NULL,
    preparation_time integer NOT NULL,
    image character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
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
       public               postgres    false    251            1           0    0    dishes_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public.dishes_id_seq OWNED BY public.dishes.id;
          public               postgres    false    250            �            1259    17409    order_details    TABLE       CREATE TABLE public.order_details (
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
       public               postgres    false    225            2           0    0    order_details_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.order_details_id_seq OWNED BY public.order_details.id;
          public               postgres    false    226            �            1259    17414    orders    TABLE     �  CREATE TABLE public.orders (
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
       public               postgres    false    227            3           0    0    orders_order_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public.orders_order_id_seq OWNED BY public.orders.order_id;
          public               postgres    false    228            �            1259    17313    referral_commission_rates    TABLE     �   CREATE TABLE public.referral_commission_rates (
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
       public               postgres    false    221            4           0    0    referral_tree_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.referral_tree_id_seq OWNED BY public.referral_tree.id;
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
       public               postgres    false    229            5           0    0    referrals_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public.referrals_id_seq OWNED BY public.referrals.id;
          public               postgres    false    230            �            1259    17436    refresh_tokens    TABLE     �   CREATE TABLE public.refresh_tokens (
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
       public               postgres    false    231            6           0    0    refresh_tokens_id_seq    SEQUENCE OWNED BY     O   ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;
          public               postgres    false    232            �            1259    17443    reservations    TABLE     �  CREATE TABLE public.reservations (
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
       public               postgres    false    233            7           0    0    reservations_reservation_id_seq    SEQUENCE OWNED BY     c   ALTER SEQUENCE public.reservations_reservation_id_seq OWNED BY public.reservations.reservation_id;
          public               postgres    false    234            �            1259    17452    tables    TABLE     =  CREATE TABLE public.tables (
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
       public               postgres    false    235            8           0    0    tables_table_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public.tables_table_id_seq OWNED BY public.tables.table_id;
          public               postgres    false    236            �            1259    25819    toppings    TABLE     F  CREATE TABLE public.toppings (
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
       public               postgres    false    245            9           0    0    toppings_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public.toppings_id_seq OWNED BY public.toppings.id;
          public               postgres    false    244            �            1259    17459    users    TABLE     w  CREATE TABLE public.users (
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
       public         heap r       postgres    false    2            �            1259    17469    verification_codes    TABLE     \  CREATE TABLE public.verification_codes (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    code character varying(10) NOT NULL,
    type character varying(20) NOT NULL,
    expiration_time timestamp without time zone NOT NULL,
    is_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);
 &   DROP TABLE public.verification_codes;
       public         heap r       postgres    false            �            1259    17474    verification_codes_id_seq    SEQUENCE     �   CREATE SEQUENCE public.verification_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public.verification_codes_id_seq;
       public               postgres    false    238            :           0    0    verification_codes_id_seq    SEQUENCE OWNED BY     W   ALTER SEQUENCE public.verification_codes_id_seq OWNED BY public.verification_codes.id;
          public               postgres    false    239            �            1259    17475    wallet_transactions    TABLE     (  CREATE TABLE public.wallet_transactions (
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
       public               postgres    false    240            ;           0    0    wallet_transactions_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.wallet_transactions_id_seq OWNED BY public.wallet_transactions.id;
          public               postgres    false    241            �           2604    17482    cart cart_id    DEFAULT     l   ALTER TABLE ONLY public.cart ALTER COLUMN cart_id SET DEFAULT nextval('public.cart_cart_id_seq'::regclass);
 ;   ALTER TABLE public.cart ALTER COLUMN cart_id DROP DEFAULT;
       public               postgres    false    219    218            �           2604    17483    combo_items combo_item_id    DEFAULT     �   ALTER TABLE ONLY public.combo_items ALTER COLUMN combo_item_id SET DEFAULT nextval('public.combo_items_combo_item_id_seq'::regclass);
 H   ALTER TABLE public.combo_items ALTER COLUMN combo_item_id DROP DEFAULT;
       public               postgres    false    224    223                       2604    25853    dish_ratings id    DEFAULT     r   ALTER TABLE ONLY public.dish_ratings ALTER COLUMN id SET DEFAULT nextval('public.dish_ratings_id_seq'::regclass);
 >   ALTER TABLE public.dish_ratings ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    249    248    249                       2604    25808    dish_sizes id    DEFAULT     n   ALTER TABLE ONLY public.dish_sizes ALTER COLUMN id SET DEFAULT nextval('public.dish_sizes_id_seq'::regclass);
 <   ALTER TABLE public.dish_sizes ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    242    243    243                       2604    25833    dish_toppings id    DEFAULT     t   ALTER TABLE ONLY public.dish_toppings ALTER COLUMN id SET DEFAULT nextval('public.dish_toppings_id_seq'::regclass);
 ?   ALTER TABLE public.dish_toppings ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    247    246    247                       2604    25895 	   dishes id    DEFAULT     f   ALTER TABLE ONLY public.dishes ALTER COLUMN id SET DEFAULT nextval('public.dishes_id_seq'::regclass);
 8   ALTER TABLE public.dishes ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    251    250    251            �           2604    17486    order_details id    DEFAULT     t   ALTER TABLE ONLY public.order_details ALTER COLUMN id SET DEFAULT nextval('public.order_details_id_seq'::regclass);
 ?   ALTER TABLE public.order_details ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    226    225            �           2604    17487    orders order_id    DEFAULT     r   ALTER TABLE ONLY public.orders ALTER COLUMN order_id SET DEFAULT nextval('public.orders_order_id_seq'::regclass);
 >   ALTER TABLE public.orders ALTER COLUMN order_id DROP DEFAULT;
       public               postgres    false    228    227            �           2604    17488    referral_tree id    DEFAULT     t   ALTER TABLE ONLY public.referral_tree ALTER COLUMN id SET DEFAULT nextval('public.referral_tree_id_seq'::regclass);
 ?   ALTER TABLE public.referral_tree ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    222    221            �           2604    17489    referrals id    DEFAULT     l   ALTER TABLE ONLY public.referrals ALTER COLUMN id SET DEFAULT nextval('public.referrals_id_seq'::regclass);
 ;   ALTER TABLE public.referrals ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    230    229            �           2604    17490    refresh_tokens id    DEFAULT     v   ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);
 @   ALTER TABLE public.refresh_tokens ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    232    231                        2604    17491    reservations reservation_id    DEFAULT     �   ALTER TABLE ONLY public.reservations ALTER COLUMN reservation_id SET DEFAULT nextval('public.reservations_reservation_id_seq'::regclass);
 J   ALTER TABLE public.reservations ALTER COLUMN reservation_id DROP DEFAULT;
       public               postgres    false    234    233                       2604    17492    tables table_id    DEFAULT     r   ALTER TABLE ONLY public.tables ALTER COLUMN table_id SET DEFAULT nextval('public.tables_table_id_seq'::regclass);
 >   ALTER TABLE public.tables ALTER COLUMN table_id DROP DEFAULT;
       public               postgres    false    236    235                       2604    25822    toppings id    DEFAULT     j   ALTER TABLE ONLY public.toppings ALTER COLUMN id SET DEFAULT nextval('public.toppings_id_seq'::regclass);
 :   ALTER TABLE public.toppings ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    244    245    245                       2604    17493    verification_codes id    DEFAULT     ~   ALTER TABLE ONLY public.verification_codes ALTER COLUMN id SET DEFAULT nextval('public.verification_codes_id_seq'::regclass);
 D   ALTER TABLE public.verification_codes ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    239    238                       2604    17494    wallet_transactions id    DEFAULT     �   ALTER TABLE ONLY public.wallet_transactions ALTER COLUMN id SET DEFAULT nextval('public.wallet_transactions_id_seq'::regclass);
 E   ALTER TABLE public.wallet_transactions ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    241    240                      0    17306    cart 
   TABLE DATA           d   COPY public.cart (cart_id, user_id, dish_id, size_id, quantity, created_at, updated_at) FROM stdin;
    public               postgres    false    218   ��                 0    17381    combo_items 
   TABLE DATA           �   COPY public.combo_items (combo_item_id, combo_id, dish_id, quantity, size_id, is_required, max_selections, created_at, updated_at) FROM stdin;
    public               postgres    false    223   p�       "          0    25850    dish_ratings 
   TABLE DATA           \   COPY public.dish_ratings (id, dish_id, user_id, rating, created_at, updated_at) FROM stdin;
    public               postgres    false    249   ��                 0    25805 
   dish_sizes 
   TABLE DATA           Z   COPY public.dish_sizes (id, dish_id, size_name, price_adjustment, created_at) FROM stdin;
    public               postgres    false    243   G�                  0    25830    dish_toppings 
   TABLE DATA           L   COPY public.dish_toppings (id, dish_id, topping_id, created_at) FROM stdin;
    public               postgres    false    247   ��       $          0    25892    dishes 
   TABLE DATA           y   COPY public.dishes (id, name, description, category, price, preparation_time, image, created_at, updated_at) FROM stdin;
    public               postgres    false    251   W�       
          0    17409    order_details 
   TABLE DATA           m   COPY public.order_details (id, order_id, dish_id, quantity, price, special_requests, created_at) FROM stdin;
    public               postgres    false    225   y�                 0    17414    orders 
   TABLE DATA           v   COPY public.orders (order_id, user_id, total_price, status, table_id, order_date, created_at, updated_at) FROM stdin;
    public               postgres    false    227   ��                 0    17313    referral_commission_rates 
   TABLE DATA           L   COPY public.referral_commission_rates (level, rate, updated_at) FROM stdin;
    public               postgres    false    220   @�                 0    17317    referral_tree 
   TABLE DATA           T   COPY public.referral_tree (id, user_id, ancestor_id, level, created_at) FROM stdin;
    public               postgres    false    221   ��                 0    17428 	   referrals 
   TABLE DATA           t   COPY public.referrals (id, referrer_id, referred_id, commission, status, created_at, updated_at, level) FROM stdin;
    public               postgres    false    229   ��                 0    17436    refresh_tokens 
   TABLE DATA           H   COPY public.refresh_tokens (id, user_id, token, created_at) FROM stdin;
    public               postgres    false    231   ��                 0    17443    reservations 
   TABLE DATA           �   COPY public.reservations (reservation_id, user_id, table_id, reservation_time, party_size, status, customer_name, phone_number, special_requests, created_at, updated_at) FROM stdin;
    public               postgres    false    233   ��                 0    17452    tables 
   TABLE DATA           b   COPY public.tables (table_id, table_number, capacity, status, created_at, updated_at) FROM stdin;
    public               postgres    false    235   ��                 0    25819    toppings 
   TABLE DATA           V   COPY public.toppings (id, name, price, available, created_at, updated_at) FROM stdin;
    public               postgres    false    245   )�                 0    17459    users 
   TABLE DATA           �   COPY public.users (user_id, username, email, password, full_name, phone_number, referral_code, referred_by, wallet_balance, created_at, updated_at, role, avatar) FROM stdin;
    public               postgres    false    237   ��                 0    17469    verification_codes 
   TABLE DATA           m   COPY public.verification_codes (id, email, code, type, expiration_time, is_verified, created_at) FROM stdin;
    public               postgres    false    238   %�                 0    17475    wallet_transactions 
   TABLE DATA           {   COPY public.wallet_transactions (id, user_id, amount, transaction_type, reference_id, description, created_at) FROM stdin;
    public               postgres    false    240   B�       <           0    0    cart_cart_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public.cart_cart_id_seq', 9, true);
          public               postgres    false    219            =           0    0    combo_items_combo_item_id_seq    SEQUENCE SET     K   SELECT pg_catalog.setval('public.combo_items_combo_item_id_seq', 7, true);
          public               postgres    false    224            >           0    0    dish_ratings_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.dish_ratings_id_seq', 2, true);
          public               postgres    false    248            ?           0    0    dish_sizes_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.dish_sizes_id_seq', 10, true);
          public               postgres    false    242            @           0    0    dish_toppings_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.dish_toppings_id_seq', 4, true);
          public               postgres    false    246            A           0    0    dishes_id_seq    SEQUENCE SET     ;   SELECT pg_catalog.setval('public.dishes_id_seq', 5, true);
          public               postgres    false    250            B           0    0    order_details_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.order_details_id_seq', 17, true);
          public               postgres    false    226            C           0    0    orders_order_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.orders_order_id_seq', 5, true);
          public               postgres    false    228            D           0    0    referral_tree_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.referral_tree_id_seq', 9, true);
          public               postgres    false    222            E           0    0    referrals_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public.referrals_id_seq', 3, true);
          public               postgres    false    230            F           0    0    refresh_tokens_id_seq    SEQUENCE SET     D   SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 1, false);
          public               postgres    false    232            G           0    0    reservations_reservation_id_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public.reservations_reservation_id_seq', 4, true);
          public               postgres    false    234            H           0    0    tables_table_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.tables_table_id_seq', 10, true);
          public               postgres    false    236            I           0    0    toppings_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.toppings_id_seq', 4, true);
          public               postgres    false    244            J           0    0    verification_codes_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.verification_codes_id_seq', 1, false);
          public               postgres    false    239            K           0    0    wallet_transactions_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.wallet_transactions_id_seq', 4, true);
          public               postgres    false    241            $           2606    17336    cart cart_pkey 
   CONSTRAINT     Q   ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (cart_id);
 8   ALTER TABLE ONLY public.cart DROP CONSTRAINT cart_pkey;
       public                 postgres    false    218            ,           2606    17496    combo_items combo_items_pkey 
   CONSTRAINT     e   ALTER TABLE ONLY public.combo_items
    ADD CONSTRAINT combo_items_pkey PRIMARY KEY (combo_item_id);
 F   ALTER TABLE ONLY public.combo_items DROP CONSTRAINT combo_items_pkey;
       public                 postgres    false    223            \           2606    25862 -   dish_ratings dish_ratings_dish_id_user_id_key 
   CONSTRAINT     t   ALTER TABLE ONLY public.dish_ratings
    ADD CONSTRAINT dish_ratings_dish_id_user_id_key UNIQUE (dish_id, user_id);
 W   ALTER TABLE ONLY public.dish_ratings DROP CONSTRAINT dish_ratings_dish_id_user_id_key;
       public                 postgres    false    249    249            ^           2606    25860    dish_ratings dish_ratings_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public.dish_ratings
    ADD CONSTRAINT dish_ratings_pkey PRIMARY KEY (id);
 H   ALTER TABLE ONLY public.dish_ratings DROP CONSTRAINT dish_ratings_pkey;
       public                 postgres    false    249            Q           2606    25812    dish_sizes dish_sizes_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.dish_sizes
    ADD CONSTRAINT dish_sizes_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.dish_sizes DROP CONSTRAINT dish_sizes_pkey;
       public                 postgres    false    243            V           2606    25838 2   dish_toppings dish_toppings_dish_id_topping_id_key 
   CONSTRAINT     |   ALTER TABLE ONLY public.dish_toppings
    ADD CONSTRAINT dish_toppings_dish_id_topping_id_key UNIQUE (dish_id, topping_id);
 \   ALTER TABLE ONLY public.dish_toppings DROP CONSTRAINT dish_toppings_dish_id_topping_id_key;
       public                 postgres    false    247    247            X           2606    25836     dish_toppings dish_toppings_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.dish_toppings
    ADD CONSTRAINT dish_toppings_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.dish_toppings DROP CONSTRAINT dish_toppings_pkey;
       public                 postgres    false    247            b           2606    25901    dishes dishes_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.dishes DROP CONSTRAINT dishes_pkey;
       public                 postgres    false    251            /           2606    17502     order_details order_details_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.order_details DROP CONSTRAINT order_details_pkey;
       public                 postgres    false    225            3           2606    17504    orders orders_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);
 <   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_pkey;
       public                 postgres    false    227            &           2606    17338 8   referral_commission_rates referral_commission_rates_pkey 
   CONSTRAINT     y   ALTER TABLE ONLY public.referral_commission_rates
    ADD CONSTRAINT referral_commission_rates_pkey PRIMARY KEY (level);
 b   ALTER TABLE ONLY public.referral_commission_rates DROP CONSTRAINT referral_commission_rates_pkey;
       public                 postgres    false    220            (           2606    17340     referral_tree referral_tree_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.referral_tree
    ADD CONSTRAINT referral_tree_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.referral_tree DROP CONSTRAINT referral_tree_pkey;
       public                 postgres    false    221            *           2606    17342 3   referral_tree referral_tree_user_id_ancestor_id_key 
   CONSTRAINT     ~   ALTER TABLE ONLY public.referral_tree
    ADD CONSTRAINT referral_tree_user_id_ancestor_id_key UNIQUE (user_id, ancestor_id);
 ]   ALTER TABLE ONLY public.referral_tree DROP CONSTRAINT referral_tree_user_id_ancestor_id_key;
       public                 postgres    false    221    221            5           2606    17506    referrals referrals_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);
 B   ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_pkey;
       public                 postgres    false    229            7           2606    17508 "   refresh_tokens refresh_tokens_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);
 L   ALTER TABLE ONLY public.refresh_tokens DROP CONSTRAINT refresh_tokens_pkey;
       public                 postgres    false    231            ;           2606    17510    reservations reservations_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (reservation_id);
 H   ALTER TABLE ONLY public.reservations DROP CONSTRAINT reservations_pkey;
       public                 postgres    false    233            =           2606    17512    tables tables_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (table_id);
 <   ALTER TABLE ONLY public.tables DROP CONSTRAINT tables_pkey;
       public                 postgres    false    235            ?           2606    17514    tables tables_table_number_key 
   CONSTRAINT     a   ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_table_number_key UNIQUE (table_number);
 H   ALTER TABLE ONLY public.tables DROP CONSTRAINT tables_table_number_key;
       public                 postgres    false    235            T           2606    25828    toppings toppings_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.toppings
    ADD CONSTRAINT toppings_pkey PRIMARY KEY (id);
 @   ALTER TABLE ONLY public.toppings DROP CONSTRAINT toppings_pkey;
       public                 postgres    false    245            D           2606    17516    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public                 postgres    false    237            F           2606    17518    users users_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public                 postgres    false    237            H           2606    17520    users users_referral_code_key 
   CONSTRAINT     a   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);
 G   ALTER TABLE ONLY public.users DROP CONSTRAINT users_referral_code_key;
       public                 postgres    false    237            J           2606    17522    users users_username_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);
 B   ALTER TABLE ONLY public.users DROP CONSTRAINT users_username_key;
       public                 postgres    false    237            L           2606    17524 *   verification_codes verification_codes_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.verification_codes
    ADD CONSTRAINT verification_codes_pkey PRIMARY KEY (id);
 T   ALTER TABLE ONLY public.verification_codes DROP CONSTRAINT verification_codes_pkey;
       public                 postgres    false    238            O           2606    17526 ,   wallet_transactions wallet_transactions_pkey 
   CONSTRAINT     j   ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);
 V   ALTER TABLE ONLY public.wallet_transactions DROP CONSTRAINT wallet_transactions_pkey;
       public                 postgres    false    240            _           1259    25877    idx_dish_ratings_dish_id    INDEX     T   CREATE INDEX idx_dish_ratings_dish_id ON public.dish_ratings USING btree (dish_id);
 ,   DROP INDEX public.idx_dish_ratings_dish_id;
       public                 postgres    false    249            `           1259    25878    idx_dish_ratings_user_id    INDEX     T   CREATE INDEX idx_dish_ratings_user_id ON public.dish_ratings USING btree (user_id);
 ,   DROP INDEX public.idx_dish_ratings_user_id;
       public                 postgres    false    249            R           1259    25874    idx_dish_sizes_dish_id    INDEX     P   CREATE INDEX idx_dish_sizes_dish_id ON public.dish_sizes USING btree (dish_id);
 *   DROP INDEX public.idx_dish_sizes_dish_id;
       public                 postgres    false    243            Y           1259    25875    idx_dish_toppings_dish_id    INDEX     V   CREATE INDEX idx_dish_toppings_dish_id ON public.dish_toppings USING btree (dish_id);
 -   DROP INDEX public.idx_dish_toppings_dish_id;
       public                 postgres    false    247            Z           1259    25876    idx_dish_toppings_topping_id    INDEX     \   CREATE INDEX idx_dish_toppings_topping_id ON public.dish_toppings USING btree (topping_id);
 0   DROP INDEX public.idx_dish_toppings_topping_id;
       public                 postgres    false    247            -           1259    17528    idx_order_details_order_id    INDEX     X   CREATE INDEX idx_order_details_order_id ON public.order_details USING btree (order_id);
 .   DROP INDEX public.idx_order_details_order_id;
       public                 postgres    false    225            0           1259    17529    idx_orders_status    INDEX     F   CREATE INDEX idx_orders_status ON public.orders USING btree (status);
 %   DROP INDEX public.idx_orders_status;
       public                 postgres    false    227            1           1259    17530    idx_orders_user_id    INDEX     H   CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);
 &   DROP INDEX public.idx_orders_user_id;
       public                 postgres    false    227            8           1259    17531 !   idx_reservations_reservation_time    INDEX     f   CREATE INDEX idx_reservations_reservation_time ON public.reservations USING btree (reservation_time);
 5   DROP INDEX public.idx_reservations_reservation_time;
       public                 postgres    false    233            9           1259    17532    idx_reservations_user_id    INDEX     T   CREATE INDEX idx_reservations_user_id ON public.reservations USING btree (user_id);
 ,   DROP INDEX public.idx_reservations_user_id;
       public                 postgres    false    233            @           1259    17533    idx_users_email    INDEX     B   CREATE INDEX idx_users_email ON public.users USING btree (email);
 #   DROP INDEX public.idx_users_email;
       public                 postgres    false    237            A           1259    17534    idx_users_referral_code    INDEX     R   CREATE INDEX idx_users_referral_code ON public.users USING btree (referral_code);
 +   DROP INDEX public.idx_users_referral_code;
       public                 postgres    false    237            B           1259    17535    idx_users_username    INDEX     H   CREATE INDEX idx_users_username ON public.users USING btree (username);
 &   DROP INDEX public.idx_users_username;
       public                 postgres    false    237            M           1259    17536    idx_wallet_transactions_user_id    INDEX     b   CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions USING btree (user_id);
 3   DROP INDEX public.idx_wallet_transactions_user_id;
       public                 postgres    false    240            c           2606    17553    cart cart_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
 @   ALTER TABLE ONLY public.cart DROP CONSTRAINT cart_user_id_fkey;
       public               postgres    false    237    218    4934            q           2606    25868 &   dish_ratings dish_ratings_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.dish_ratings
    ADD CONSTRAINT dish_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
 P   ALTER TABLE ONLY public.dish_ratings DROP CONSTRAINT dish_ratings_user_id_fkey;
       public               postgres    false    237    249    4934            p           2606    25844 +   dish_toppings dish_toppings_topping_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.dish_toppings
    ADD CONSTRAINT dish_toppings_topping_id_fkey FOREIGN KEY (topping_id) REFERENCES public.toppings(id) ON DELETE CASCADE;
 U   ALTER TABLE ONLY public.dish_toppings DROP CONSTRAINT dish_toppings_topping_id_fkey;
       public               postgres    false    245    4948    247            f           2606    17583 )   order_details order_details_order_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE;
 S   ALTER TABLE ONLY public.order_details DROP CONSTRAINT order_details_order_id_fkey;
       public               postgres    false    225    227    4915            g           2606    17588    orders orders_table_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(table_id);
 E   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_table_id_fkey;
       public               postgres    false    235    227    4925            h           2606    17593    orders orders_user_id_fkey    FK CONSTRAINT     ~   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 D   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_user_id_fkey;
       public               postgres    false    4934    227    237            d           2606    17598 ,   referral_tree referral_tree_ancestor_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.referral_tree
    ADD CONSTRAINT referral_tree_ancestor_id_fkey FOREIGN KEY (ancestor_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
 V   ALTER TABLE ONLY public.referral_tree DROP CONSTRAINT referral_tree_ancestor_id_fkey;
       public               postgres    false    237    4934    221            e           2606    17603 (   referral_tree referral_tree_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.referral_tree
    ADD CONSTRAINT referral_tree_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
 R   ALTER TABLE ONLY public.referral_tree DROP CONSTRAINT referral_tree_user_id_fkey;
       public               postgres    false    4934    221    237            i           2606    17608 $   referrals referrals_referred_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES public.users(user_id);
 N   ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_referred_id_fkey;
       public               postgres    false    237    4934    229            j           2606    17613 $   referrals referrals_referrer_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.users(user_id);
 N   ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_referrer_id_fkey;
       public               postgres    false    4934    229    237            k           2606    17618 *   refresh_tokens refresh_tokens_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
 T   ALTER TABLE ONLY public.refresh_tokens DROP CONSTRAINT refresh_tokens_user_id_fkey;
       public               postgres    false    231    237    4934            l           2606    17623 '   reservations reservations_table_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(table_id);
 Q   ALTER TABLE ONLY public.reservations DROP CONSTRAINT reservations_table_id_fkey;
       public               postgres    false    235    4925    233            m           2606    17628 &   reservations reservations_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 P   ALTER TABLE ONLY public.reservations DROP CONSTRAINT reservations_user_id_fkey;
       public               postgres    false    237    233    4934            n           2606    17633    users users_referred_by_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.users(user_id);
 F   ALTER TABLE ONLY public.users DROP CONSTRAINT users_referred_by_fkey;
       public               postgres    false    4934    237    237            o           2606    17638 4   wallet_transactions wallet_transactions_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 ^   ALTER TABLE ONLY public.wallet_transactions DROP CONSTRAINT wallet_transactions_user_id_fkey;
       public               postgres    false    237    240    4934               �   x����� E��]��@ ��'t�Zz*�H���xzA��Zu+ŕͫ���j�]R-�K�+p;����(?(.A���H�/�M����'������H�*z��^�m��#���F�# ��TÎa�����2���6�|ZjX�#�6�g)��5�͑���5��9!�O�Ě         j   x���1�0����$G���X��?��mhhv�3bqy8�U�ڱ�����B�S@4v
��B�!Mt�7N��1��*�"��W�H��)�"�1r��J)/@S&      "   M   x�}���  �7T�p8�k�#j�/!d�� �������};e�!ό<�y�@em�Fj�<�7���Y��~         �   x�}�=
1��z�^`��'�3hek#���6��7�M��������n,R�@H|!]Dĝ�s�J.�(������ڡ�:������SY�ZC��W�%k�f�����
��rz��)�XA�ҩ+��Ұ�OCǢu��U�s�Y�5dv�a�)x)��V�V*          N   x�u���0��
H���CRK����	4�yn27Q51����T��j�A��	9v��3���8Q�.?�+� lf�      $     x���Kn�  D�p
.~�{��� ��Ml���N�Vm�f��<ifG���q����Հ�hJ���<]r����1�9�b됙Z�ƲG�l�\q���8�k�$��9����
�c\Z?���m��a-�{��Y�MK^�\)��&��@�Э��Ӱm�!�s� �\�h������a
kJ�Tw��w�ɍ��v5����[�e�y�L�O]��N������W��b/�;V����(�����cg7�/)]�T�� (>,���T��E��!���M��      
   �   x����n�0E��W���;N�g���6�-RD*j���[�(���cu��q�(#�U�QI����S��}��bR��_�i�O�ںD�ԅ���s�������)�tyoO9�Is(U͕1���h��C�Щ��bN�P	6Ӣb<��˚�+8���|v?7�N�FC�Ɵ��2�lok~ H�PT�Q,��x�a�N`nU3<#��(
��ƌ��ᛁ�]���1f�
W<
�z2�+�s�0�1Ҷ,���[��         �   x���M
�0�דS���I4�,�t�T�VE{�F\�TK��}���#P�Yc]�:�Z����ɖ��&	x'&��@�ؿ�g~���-�%��\��PT���o�0��k��5���~�d���Ysy��2���i;;�}3�i�&�~�d�1;�;C�R�5����Vc>d�         ?   x���A�@�w��I�� ��:��}o��$D��W��tt*���C�aƆ�Ѩa|?�/�         `   x����� �3N��!X�ҋ���n�������n���1�Oѽ,��C�Zbh�P�L|#	&��k�J3i~4(�}���YBv=������P         �   x���1� Eg|�^���
9K��Ԫz5!���$?Y܆ޭ�¥�8�gf��8�k!cq6��-���~��W����0�En�}5�;%�!!�v�Υp��i�u��µo���Y�1�:DBOD�o+            x������ � �         �   x����j!���S���]��vS�&�Q�B�A'��}�!�4�݁��.C�8o-��:"a1�9�vκ �Gq���0��xj��nO�d��>�%�3�|�k>C��	�f����C,�g�����2�1����h����,��5�5�@
1}t�[�f\H��{L!�p�yŗ���m3���:C����n���F=�ؠ�v��-���F=\kLP+nE�����4M�b��         x   x���;�0D��)r�����,i�p��
$Ο�)�h�[�i�1�v�}�utI�H'���"5����+�1���P�nJ�&�M��x�m��KAy�K�}G?�q��OȂL�.�����!�/���(         }   x��α
1��z�)��Lv��K+��6W�g��F�;����t~�e
�{��JQ�I�>���XL�fA�Qׅ�.Km�W׹M}&H��/OnĶ��Q����K�v�}'DKi��&��(C!         _  x���[k�0 ���+����}j�(�a�C���HLluު������`�
!9'��/�(0F�a�1(��D8J���
�f$�(޵]U��\����E�7�
�p��#��4B�g��],���y} . �@=�C�MX�*� ��W�L诲��zv9p}�UO�����2��g=�Ի�^��s�v2I�i��^�[��c��4�`^,��٩�w���^��.��8OօL��:��j�{.�����`4}|~��^K�� "u�<'����6¸1���N��l>�q��fU��i!��꼒�I�)��IU�7Y�X�e'��i�ޓ��X+s�m�r�zm�\˲��S�            x������ � �         	  x���?K�0��9}�7��?m/���&�[�&m�ݥPstvrG߀���P�}����;�����HcT��8͈�V*�8Q*U�")E1OH�j��Gj~�Ъ�Pݣ+��C�d���{�W|�ݳݿ��g�[_�L� FX�	Ô���2.���iX=?���^y�翤�d"���+��G����M���M��?�6֗���ܢ�9��[~�9�|����)��}uK���g�NI���(N"=��:��-��i     