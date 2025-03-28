PGDMP  ,                      }         	   food_lps0    16.8 (Debian 16.8-1.pgdg120+1)    17.4 �               0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false                       0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false                       0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false                       1262    16389 	   food_lps0    DATABASE     t   CREATE DATABASE food_lps0 WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.UTF8';
    DROP DATABASE food_lps0;
                     food_lps0_user    false                       0    0 	   food_lps0    DATABASE PROPERTIES     2   ALTER DATABASE food_lps0 SET "TimeZone" TO 'utc';
                          food_lps0_user    false                        2615    2200    public    SCHEMA     2   -- *not* creating schema, since initdb creates it
 2   -- *not* dropping schema, since initdb creates it
                     food_lps0_user    false                        3079    16582 	   uuid-ossp 	   EXTENSION     ?   CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
    DROP EXTENSION "uuid-ossp";
                        false    6                       0    0    EXTENSION "uuid-ossp"    COMMENT     W   COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';
                             false    2            
           1255    16770    update_timestamp()    FUNCTION     �   CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
 )   DROP FUNCTION public.update_timestamp();
       public               food_lps0_user    false    6                       0    0    FUNCTION uuid_generate_v1()    ACL     C   GRANT ALL ON FUNCTION public.uuid_generate_v1() TO food_lps0_user;
          public               postgres    false    261                       0    0    FUNCTION uuid_generate_v1mc()    ACL     E   GRANT ALL ON FUNCTION public.uuid_generate_v1mc() TO food_lps0_user;
          public               postgres    false    262                       0    0 4   FUNCTION uuid_generate_v3(namespace uuid, name text)    ACL     \   GRANT ALL ON FUNCTION public.uuid_generate_v3(namespace uuid, name text) TO food_lps0_user;
          public               postgres    false    263                       0    0    FUNCTION uuid_generate_v4()    ACL     C   GRANT ALL ON FUNCTION public.uuid_generate_v4() TO food_lps0_user;
          public               postgres    false    264                       0    0 4   FUNCTION uuid_generate_v5(namespace uuid, name text)    ACL     \   GRANT ALL ON FUNCTION public.uuid_generate_v5(namespace uuid, name text) TO food_lps0_user;
          public               postgres    false    265                       0    0    FUNCTION uuid_nil()    ACL     ;   GRANT ALL ON FUNCTION public.uuid_nil() TO food_lps0_user;
          public               postgres    false    256                       0    0    FUNCTION uuid_ns_dns()    ACL     >   GRANT ALL ON FUNCTION public.uuid_ns_dns() TO food_lps0_user;
          public               postgres    false    257                       0    0    FUNCTION uuid_ns_oid()    ACL     >   GRANT ALL ON FUNCTION public.uuid_ns_oid() TO food_lps0_user;
          public               postgres    false    259                       0    0    FUNCTION uuid_ns_url()    ACL     >   GRANT ALL ON FUNCTION public.uuid_ns_url() TO food_lps0_user;
          public               postgres    false    258                       0    0    FUNCTION uuid_ns_x500()    ACL     ?   GRANT ALL ON FUNCTION public.uuid_ns_x500() TO food_lps0_user;
          public               postgres    false    260            �            1259    17055    cart    TABLE     &  CREATE TABLE public.cart (
    cart_id integer NOT NULL,
    user_id uuid NOT NULL,
    dish_id integer NOT NULL,
    size_id integer,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
    DROP TABLE public.cart;
       public         heap r       food_lps0_user    false    6            �            1259    17054    cart_cart_id_seq    SEQUENCE     �   CREATE SEQUENCE public.cart_cart_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public.cart_cart_id_seq;
       public               food_lps0_user    false    6    241                       0    0    cart_cart_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public.cart_cart_id_seq OWNED BY public.cart.cart_id;
          public               food_lps0_user    false    240            �            1259    16819    combo_items    TABLE     {  CREATE TABLE public.combo_items (
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
       public         heap r       food_lps0_user    false    6            �            1259    16827    combo_items_combo_item_id_seq    SEQUENCE     �   CREATE SEQUENCE public.combo_items_combo_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public.combo_items_combo_item_id_seq;
       public               food_lps0_user    false    6    216                       0    0    combo_items_combo_item_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public.combo_items_combo_item_id_seq OWNED BY public.combo_items.combo_item_id;
          public               food_lps0_user    false    217            �            1259    16828 
   dish_sizes    TABLE     p  CREATE TABLE public.dish_sizes (
    size_id integer NOT NULL,
    dish_id integer NOT NULL,
    size_name character varying(50) NOT NULL,
    price numeric(10,2) NOT NULL,
    is_default boolean DEFAULT false,
    is_available boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
    DROP TABLE public.dish_sizes;
       public         heap r       food_lps0_user    false    6            �            1259    16835    dish_sizes_size_id_seq    SEQUENCE     �   CREATE SEQUENCE public.dish_sizes_size_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.dish_sizes_size_id_seq;
       public               food_lps0_user    false    6    218                        0    0    dish_sizes_size_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.dish_sizes_size_id_seq OWNED BY public.dish_sizes.size_id;
          public               food_lps0_user    false    219            �            1259    16836    dishes    TABLE     �  CREATE TABLE public.dishes (
    dish_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    image_url character varying(255),
    rating numeric(3,2) DEFAULT 0.00,
    category character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    is_combo boolean DEFAULT false,
    is_available boolean DEFAULT true
);
    DROP TABLE public.dishes;
       public         heap r       food_lps0_user    false    6            �            1259    16846    dishes_dish_id_seq    SEQUENCE     �   CREATE SEQUENCE public.dishes_dish_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public.dishes_dish_id_seq;
       public               food_lps0_user    false    220    6            !           0    0    dishes_dish_id_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public.dishes_dish_id_seq OWNED BY public.dishes.dish_id;
          public               food_lps0_user    false    221            �            1259    16847    order_details    TABLE       CREATE TABLE public.order_details (
    id integer NOT NULL,
    order_id integer,
    dish_id integer,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    special_requests character varying(255),
    created_at timestamp without time zone DEFAULT now()
);
 !   DROP TABLE public.order_details;
       public         heap r       food_lps0_user    false    6            �            1259    16851    order_details_id_seq    SEQUENCE     �   CREATE SEQUENCE public.order_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.order_details_id_seq;
       public               food_lps0_user    false    6    222            "           0    0    order_details_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.order_details_id_seq OWNED BY public.order_details.id;
          public               food_lps0_user    false    223            �            1259    16852    orders    TABLE     �  CREATE TABLE public.orders (
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
       public         heap r       food_lps0_user    false    6            �            1259    16860    order_items_view    VIEW     �  CREATE VIEW public.order_items_view AS
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
       public       v       food_lps0_user    false    222    222    222    222    222    224    224    220    220    222    222    220    6            �            1259    16865    orders_order_id_seq    SEQUENCE     �   CREATE SEQUENCE public.orders_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.orders_order_id_seq;
       public               food_lps0_user    false    224    6            #           0    0    orders_order_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public.orders_order_id_seq OWNED BY public.orders.order_id;
          public               food_lps0_user    false    226            �            1259    17100    referral_commission_rates    TABLE     �   CREATE TABLE public.referral_commission_rates (
    level integer NOT NULL,
    rate numeric(5,2) NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);
 -   DROP TABLE public.referral_commission_rates;
       public         heap r       food_lps0_user    false    6            �            1259    17081    referral_tree    TABLE     �   CREATE TABLE public.referral_tree (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    ancestor_id uuid NOT NULL,
    level integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);
 !   DROP TABLE public.referral_tree;
       public         heap r       food_lps0_user    false    6            �            1259    17080    referral_tree_id_seq    SEQUENCE     �   CREATE SEQUENCE public.referral_tree_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.referral_tree_id_seq;
       public               food_lps0_user    false    243    6            $           0    0    referral_tree_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.referral_tree_id_seq OWNED BY public.referral_tree.id;
          public               food_lps0_user    false    242            �            1259    16866 	   referrals    TABLE     f  CREATE TABLE public.referrals (
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
       public         heap r       food_lps0_user    false    6            �            1259    16872    referrals_id_seq    SEQUENCE     �   CREATE SEQUENCE public.referrals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public.referrals_id_seq;
       public               food_lps0_user    false    6    227            %           0    0    referrals_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public.referrals_id_seq OWNED BY public.referrals.id;
          public               food_lps0_user    false    228            �            1259    16873    refresh_tokens    TABLE     �   CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    token character varying(500) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);
 "   DROP TABLE public.refresh_tokens;
       public         heap r       food_lps0_user    false    6            �            1259    16879    refresh_tokens_id_seq    SEQUENCE     �   CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ,   DROP SEQUENCE public.refresh_tokens_id_seq;
       public               food_lps0_user    false    6    229            &           0    0    refresh_tokens_id_seq    SEQUENCE OWNED BY     O   ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;
          public               food_lps0_user    false    230            �            1259    16880    reservations    TABLE     �  CREATE TABLE public.reservations (
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
       public         heap r       food_lps0_user    false    6            �            1259    16888    reservations_reservation_id_seq    SEQUENCE     �   CREATE SEQUENCE public.reservations_reservation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 6   DROP SEQUENCE public.reservations_reservation_id_seq;
       public               food_lps0_user    false    6    231            '           0    0    reservations_reservation_id_seq    SEQUENCE OWNED BY     c   ALTER SEQUENCE public.reservations_reservation_id_seq OWNED BY public.reservations.reservation_id;
          public               food_lps0_user    false    232            �            1259    16889    tables    TABLE     =  CREATE TABLE public.tables (
    table_id integer NOT NULL,
    table_number integer NOT NULL,
    capacity integer NOT NULL,
    status character varying(20) DEFAULT 'available'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
    DROP TABLE public.tables;
       public         heap r       food_lps0_user    false    6            �            1259    16895    tables_table_id_seq    SEQUENCE     �   CREATE SEQUENCE public.tables_table_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.tables_table_id_seq;
       public               food_lps0_user    false    6    233            (           0    0    tables_table_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public.tables_table_id_seq OWNED BY public.tables.table_id;
          public               food_lps0_user    false    234            �            1259    16896    users    TABLE     w  CREATE TABLE public.users (
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
       public         heap r       food_lps0_user    false    2    6    6            �            1259    16906    verification_codes    TABLE     \  CREATE TABLE public.verification_codes (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    code character varying(10) NOT NULL,
    type character varying(20) NOT NULL,
    expiration_time timestamp without time zone NOT NULL,
    is_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);
 &   DROP TABLE public.verification_codes;
       public         heap r       food_lps0_user    false    6            �            1259    16911    verification_codes_id_seq    SEQUENCE     �   CREATE SEQUENCE public.verification_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public.verification_codes_id_seq;
       public               food_lps0_user    false    236    6            )           0    0    verification_codes_id_seq    SEQUENCE OWNED BY     W   ALTER SEQUENCE public.verification_codes_id_seq OWNED BY public.verification_codes.id;
          public               food_lps0_user    false    237            �            1259    16912    wallet_transactions    TABLE     (  CREATE TABLE public.wallet_transactions (
    id integer NOT NULL,
    user_id uuid,
    amount numeric(10,2) NOT NULL,
    transaction_type character varying(20) NOT NULL,
    reference_id character varying(255),
    description text,
    created_at timestamp without time zone DEFAULT now()
);
 '   DROP TABLE public.wallet_transactions;
       public         heap r       food_lps0_user    false    6            �            1259    16918    wallet_transactions_id_seq    SEQUENCE     �   CREATE SEQUENCE public.wallet_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public.wallet_transactions_id_seq;
       public               food_lps0_user    false    238    6            *           0    0    wallet_transactions_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.wallet_transactions_id_seq OWNED BY public.wallet_transactions.id;
          public               food_lps0_user    false    239                       2604    17058    cart cart_id    DEFAULT     l   ALTER TABLE ONLY public.cart ALTER COLUMN cart_id SET DEFAULT nextval('public.cart_cart_id_seq'::regclass);
 ;   ALTER TABLE public.cart ALTER COLUMN cart_id DROP DEFAULT;
       public               food_lps0_user    false    241    240    241            �           2604    16919    combo_items combo_item_id    DEFAULT     �   ALTER TABLE ONLY public.combo_items ALTER COLUMN combo_item_id SET DEFAULT nextval('public.combo_items_combo_item_id_seq'::regclass);
 H   ALTER TABLE public.combo_items ALTER COLUMN combo_item_id DROP DEFAULT;
       public               food_lps0_user    false    217    216            �           2604    16920    dish_sizes size_id    DEFAULT     x   ALTER TABLE ONLY public.dish_sizes ALTER COLUMN size_id SET DEFAULT nextval('public.dish_sizes_size_id_seq'::regclass);
 A   ALTER TABLE public.dish_sizes ALTER COLUMN size_id DROP DEFAULT;
       public               food_lps0_user    false    219    218            �           2604    16921    dishes dish_id    DEFAULT     p   ALTER TABLE ONLY public.dishes ALTER COLUMN dish_id SET DEFAULT nextval('public.dishes_dish_id_seq'::regclass);
 =   ALTER TABLE public.dishes ALTER COLUMN dish_id DROP DEFAULT;
       public               food_lps0_user    false    221    220            �           2604    16922    order_details id    DEFAULT     t   ALTER TABLE ONLY public.order_details ALTER COLUMN id SET DEFAULT nextval('public.order_details_id_seq'::regclass);
 ?   ALTER TABLE public.order_details ALTER COLUMN id DROP DEFAULT;
       public               food_lps0_user    false    223    222            �           2604    16923    orders order_id    DEFAULT     r   ALTER TABLE ONLY public.orders ALTER COLUMN order_id SET DEFAULT nextval('public.orders_order_id_seq'::regclass);
 >   ALTER TABLE public.orders ALTER COLUMN order_id DROP DEFAULT;
       public               food_lps0_user    false    226    224                       2604    17084    referral_tree id    DEFAULT     t   ALTER TABLE ONLY public.referral_tree ALTER COLUMN id SET DEFAULT nextval('public.referral_tree_id_seq'::regclass);
 ?   ALTER TABLE public.referral_tree ALTER COLUMN id DROP DEFAULT;
       public               food_lps0_user    false    242    243    243            �           2604    16924    referrals id    DEFAULT     l   ALTER TABLE ONLY public.referrals ALTER COLUMN id SET DEFAULT nextval('public.referrals_id_seq'::regclass);
 ;   ALTER TABLE public.referrals ALTER COLUMN id DROP DEFAULT;
       public               food_lps0_user    false    228    227            �           2604    16925    refresh_tokens id    DEFAULT     v   ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);
 @   ALTER TABLE public.refresh_tokens ALTER COLUMN id DROP DEFAULT;
       public               food_lps0_user    false    230    229            �           2604    16926    reservations reservation_id    DEFAULT     �   ALTER TABLE ONLY public.reservations ALTER COLUMN reservation_id SET DEFAULT nextval('public.reservations_reservation_id_seq'::regclass);
 J   ALTER TABLE public.reservations ALTER COLUMN reservation_id DROP DEFAULT;
       public               food_lps0_user    false    232    231            �           2604    16927    tables table_id    DEFAULT     r   ALTER TABLE ONLY public.tables ALTER COLUMN table_id SET DEFAULT nextval('public.tables_table_id_seq'::regclass);
 >   ALTER TABLE public.tables ALTER COLUMN table_id DROP DEFAULT;
       public               food_lps0_user    false    234    233                       2604    16928    verification_codes id    DEFAULT     ~   ALTER TABLE ONLY public.verification_codes ALTER COLUMN id SET DEFAULT nextval('public.verification_codes_id_seq'::regclass);
 D   ALTER TABLE public.verification_codes ALTER COLUMN id DROP DEFAULT;
       public               food_lps0_user    false    237    236                       2604    16929    wallet_transactions id    DEFAULT     �   ALTER TABLE ONLY public.wallet_transactions ALTER COLUMN id SET DEFAULT nextval('public.wallet_transactions_id_seq'::regclass);
 E   ALTER TABLE public.wallet_transactions ALTER COLUMN id DROP DEFAULT;
       public               food_lps0_user    false    239    238                      0    17055    cart 
   TABLE DATA           d   COPY public.cart (cart_id, user_id, dish_id, size_id, quantity, created_at, updated_at) FROM stdin;
    public               food_lps0_user    false    241   K�       �          0    16819    combo_items 
   TABLE DATA           �   COPY public.combo_items (combo_item_id, combo_id, dish_id, quantity, size_id, is_required, max_selections, created_at, updated_at) FROM stdin;
    public               food_lps0_user    false    216   �       �          0    16828 
   dish_sizes 
   TABLE DATA           z   COPY public.dish_sizes (size_id, dish_id, size_name, price, is_default, is_available, created_at, updated_at) FROM stdin;
    public               food_lps0_user    false    218   ��       �          0    16836    dishes 
   TABLE DATA           �   COPY public.dishes (dish_id, name, description, price, image_url, rating, category, created_at, updated_at, is_combo, is_available) FROM stdin;
    public               food_lps0_user    false    220   q�       �          0    16847    order_details 
   TABLE DATA           m   COPY public.order_details (id, order_id, dish_id, quantity, price, special_requests, created_at) FROM stdin;
    public               food_lps0_user    false    222   Y�       �          0    16852    orders 
   TABLE DATA           v   COPY public.orders (order_id, user_id, total_price, status, table_id, order_date, created_at, updated_at) FROM stdin;
    public               food_lps0_user    false    224   g�                 0    17100    referral_commission_rates 
   TABLE DATA           L   COPY public.referral_commission_rates (level, rate, updated_at) FROM stdin;
    public               food_lps0_user    false    244    �       
          0    17081    referral_tree 
   TABLE DATA           T   COPY public.referral_tree (id, user_id, ancestor_id, level, created_at) FROM stdin;
    public               food_lps0_user    false    243   o�       �          0    16866 	   referrals 
   TABLE DATA           t   COPY public.referrals (id, referrer_id, referred_id, commission, status, created_at, updated_at, level) FROM stdin;
    public               food_lps0_user    false    227   ��       �          0    16873    refresh_tokens 
   TABLE DATA           H   COPY public.refresh_tokens (id, user_id, token, created_at) FROM stdin;
    public               food_lps0_user    false    229   o�       �          0    16880    reservations 
   TABLE DATA           �   COPY public.reservations (reservation_id, user_id, table_id, reservation_time, party_size, status, customer_name, phone_number, special_requests, created_at, updated_at) FROM stdin;
    public               food_lps0_user    false    231   ��                  0    16889    tables 
   TABLE DATA           b   COPY public.tables (table_id, table_number, capacity, status, created_at, updated_at) FROM stdin;
    public               food_lps0_user    false    233   ��                 0    16896    users 
   TABLE DATA           �   COPY public.users (user_id, username, email, password, full_name, phone_number, referral_code, referred_by, wallet_balance, created_at, updated_at, role, avatar) FROM stdin;
    public               food_lps0_user    false    235   	�                 0    16906    verification_codes 
   TABLE DATA           m   COPY public.verification_codes (id, email, code, type, expiration_time, is_verified, created_at) FROM stdin;
    public               food_lps0_user    false    236   (�                 0    16912    wallet_transactions 
   TABLE DATA           {   COPY public.wallet_transactions (id, user_id, amount, transaction_type, reference_id, description, created_at) FROM stdin;
    public               food_lps0_user    false    238   E�       +           0    0    cart_cart_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public.cart_cart_id_seq', 9, true);
          public               food_lps0_user    false    240            ,           0    0    combo_items_combo_item_id_seq    SEQUENCE SET     K   SELECT pg_catalog.setval('public.combo_items_combo_item_id_seq', 7, true);
          public               food_lps0_user    false    217            -           0    0    dish_sizes_size_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.dish_sizes_size_id_seq', 14, true);
          public               food_lps0_user    false    219            .           0    0    dishes_dish_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.dishes_dish_id_seq', 15, true);
          public               food_lps0_user    false    221            /           0    0    order_details_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.order_details_id_seq', 17, true);
          public               food_lps0_user    false    223            0           0    0    orders_order_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.orders_order_id_seq', 5, true);
          public               food_lps0_user    false    226            1           0    0    referral_tree_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.referral_tree_id_seq', 9, true);
          public               food_lps0_user    false    242            2           0    0    referrals_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public.referrals_id_seq', 3, true);
          public               food_lps0_user    false    228            3           0    0    refresh_tokens_id_seq    SEQUENCE SET     D   SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 1, false);
          public               food_lps0_user    false    230            4           0    0    reservations_reservation_id_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public.reservations_reservation_id_seq', 4, true);
          public               food_lps0_user    false    232            5           0    0    tables_table_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.tables_table_id_seq', 10, true);
          public               food_lps0_user    false    234            6           0    0    verification_codes_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.verification_codes_id_seq', 1, false);
          public               food_lps0_user    false    237            7           0    0    wallet_transactions_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.wallet_transactions_id_seq', 4, true);
          public               food_lps0_user    false    239            ?           2606    17063    cart cart_pkey 
   CONSTRAINT     Q   ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (cart_id);
 8   ALTER TABLE ONLY public.cart DROP CONSTRAINT cart_pkey;
       public                 food_lps0_user    false    241                       2606    16931    combo_items combo_items_pkey 
   CONSTRAINT     e   ALTER TABLE ONLY public.combo_items
    ADD CONSTRAINT combo_items_pkey PRIMARY KEY (combo_item_id);
 F   ALTER TABLE ONLY public.combo_items DROP CONSTRAINT combo_items_pkey;
       public                 food_lps0_user    false    216                       2606    16933    dish_sizes dish_sizes_pkey 
   CONSTRAINT     ]   ALTER TABLE ONLY public.dish_sizes
    ADD CONSTRAINT dish_sizes_pkey PRIMARY KEY (size_id);
 D   ALTER TABLE ONLY public.dish_sizes DROP CONSTRAINT dish_sizes_pkey;
       public                 food_lps0_user    false    218                       2606    16935    dishes dishes_pkey 
   CONSTRAINT     U   ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_pkey PRIMARY KEY (dish_id);
 <   ALTER TABLE ONLY public.dishes DROP CONSTRAINT dishes_pkey;
       public                 food_lps0_user    false    220                       2606    16937     order_details order_details_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.order_details DROP CONSTRAINT order_details_pkey;
       public                 food_lps0_user    false    222            !           2606    16939    orders orders_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);
 <   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_pkey;
       public                 food_lps0_user    false    224            E           2606    17105 8   referral_commission_rates referral_commission_rates_pkey 
   CONSTRAINT     y   ALTER TABLE ONLY public.referral_commission_rates
    ADD CONSTRAINT referral_commission_rates_pkey PRIMARY KEY (level);
 b   ALTER TABLE ONLY public.referral_commission_rates DROP CONSTRAINT referral_commission_rates_pkey;
       public                 food_lps0_user    false    244            A           2606    17087     referral_tree referral_tree_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.referral_tree
    ADD CONSTRAINT referral_tree_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.referral_tree DROP CONSTRAINT referral_tree_pkey;
       public                 food_lps0_user    false    243            C           2606    17089 3   referral_tree referral_tree_user_id_ancestor_id_key 
   CONSTRAINT     ~   ALTER TABLE ONLY public.referral_tree
    ADD CONSTRAINT referral_tree_user_id_ancestor_id_key UNIQUE (user_id, ancestor_id);
 ]   ALTER TABLE ONLY public.referral_tree DROP CONSTRAINT referral_tree_user_id_ancestor_id_key;
       public                 food_lps0_user    false    243    243            #           2606    16941    referrals referrals_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);
 B   ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_pkey;
       public                 food_lps0_user    false    227            %           2606    16943 "   refresh_tokens refresh_tokens_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);
 L   ALTER TABLE ONLY public.refresh_tokens DROP CONSTRAINT refresh_tokens_pkey;
       public                 food_lps0_user    false    229            )           2606    16945    reservations reservations_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (reservation_id);
 H   ALTER TABLE ONLY public.reservations DROP CONSTRAINT reservations_pkey;
       public                 food_lps0_user    false    231            +           2606    16947    tables tables_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (table_id);
 <   ALTER TABLE ONLY public.tables DROP CONSTRAINT tables_pkey;
       public                 food_lps0_user    false    233            -           2606    16949    tables tables_table_number_key 
   CONSTRAINT     a   ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_table_number_key UNIQUE (table_number);
 H   ALTER TABLE ONLY public.tables DROP CONSTRAINT tables_table_number_key;
       public                 food_lps0_user    false    233            2           2606    16951    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public                 food_lps0_user    false    235            4           2606    16953    users users_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public                 food_lps0_user    false    235            6           2606    16955    users users_referral_code_key 
   CONSTRAINT     a   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);
 G   ALTER TABLE ONLY public.users DROP CONSTRAINT users_referral_code_key;
       public                 food_lps0_user    false    235            8           2606    16957    users users_username_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);
 B   ALTER TABLE ONLY public.users DROP CONSTRAINT users_username_key;
       public                 food_lps0_user    false    235            :           2606    16959 *   verification_codes verification_codes_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.verification_codes
    ADD CONSTRAINT verification_codes_pkey PRIMARY KEY (id);
 T   ALTER TABLE ONLY public.verification_codes DROP CONSTRAINT verification_codes_pkey;
       public                 food_lps0_user    false    236            =           2606    16961 ,   wallet_transactions wallet_transactions_pkey 
   CONSTRAINT     j   ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);
 V   ALTER TABLE ONLY public.wallet_transactions DROP CONSTRAINT wallet_transactions_pkey;
       public                 food_lps0_user    false    238                       1259    16962    idx_dishes_category    INDEX     J   CREATE INDEX idx_dishes_category ON public.dishes USING btree (category);
 '   DROP INDEX public.idx_dishes_category;
       public                 food_lps0_user    false    220                       1259    16963    idx_order_details_order_id    INDEX     X   CREATE INDEX idx_order_details_order_id ON public.order_details USING btree (order_id);
 .   DROP INDEX public.idx_order_details_order_id;
       public                 food_lps0_user    false    222                       1259    16964    idx_orders_status    INDEX     F   CREATE INDEX idx_orders_status ON public.orders USING btree (status);
 %   DROP INDEX public.idx_orders_status;
       public                 food_lps0_user    false    224                       1259    16965    idx_orders_user_id    INDEX     H   CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);
 &   DROP INDEX public.idx_orders_user_id;
       public                 food_lps0_user    false    224            &           1259    16966 !   idx_reservations_reservation_time    INDEX     f   CREATE INDEX idx_reservations_reservation_time ON public.reservations USING btree (reservation_time);
 5   DROP INDEX public.idx_reservations_reservation_time;
       public                 food_lps0_user    false    231            '           1259    16967    idx_reservations_user_id    INDEX     T   CREATE INDEX idx_reservations_user_id ON public.reservations USING btree (user_id);
 ,   DROP INDEX public.idx_reservations_user_id;
       public                 food_lps0_user    false    231            .           1259    16968    idx_users_email    INDEX     B   CREATE INDEX idx_users_email ON public.users USING btree (email);
 #   DROP INDEX public.idx_users_email;
       public                 food_lps0_user    false    235            /           1259    16969    idx_users_referral_code    INDEX     R   CREATE INDEX idx_users_referral_code ON public.users USING btree (referral_code);
 +   DROP INDEX public.idx_users_referral_code;
       public                 food_lps0_user    false    235            0           1259    16970    idx_users_username    INDEX     H   CREATE INDEX idx_users_username ON public.users USING btree (username);
 &   DROP INDEX public.idx_users_username;
       public                 food_lps0_user    false    235            ;           1259    16971    idx_wallet_transactions_user_id    INDEX     b   CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions USING btree (user_id);
 3   DROP INDEX public.idx_wallet_transactions_user_id;
       public                 food_lps0_user    false    238            Z           2620    16972    dishes update_dishes_timestamp    TRIGGER        CREATE TRIGGER update_dishes_timestamp BEFORE UPDATE ON public.dishes FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
 7   DROP TRIGGER update_dishes_timestamp ON public.dishes;
       public               food_lps0_user    false    266    220            [           2620    16973    orders update_orders_timestamp    TRIGGER        CREATE TRIGGER update_orders_timestamp BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
 7   DROP TRIGGER update_orders_timestamp ON public.orders;
       public               food_lps0_user    false    224    266            \           2620    16974 $   referrals update_referrals_timestamp    TRIGGER     �   CREATE TRIGGER update_referrals_timestamp BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
 =   DROP TRIGGER update_referrals_timestamp ON public.referrals;
       public               food_lps0_user    false    227    266            ]           2620    16975 *   reservations update_reservations_timestamp    TRIGGER     �   CREATE TRIGGER update_reservations_timestamp BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
 C   DROP TRIGGER update_reservations_timestamp ON public.reservations;
       public               food_lps0_user    false    266    231            ^           2620    16976    tables update_tables_timestamp    TRIGGER        CREATE TRIGGER update_tables_timestamp BEFORE UPDATE ON public.tables FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
 7   DROP TRIGGER update_tables_timestamp ON public.tables;
       public               food_lps0_user    false    266    233            _           2620    16977    users update_users_timestamp    TRIGGER     }   CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
 5   DROP TRIGGER update_users_timestamp ON public.users;
       public               food_lps0_user    false    235    266            U           2606    17069    cart cart_dish_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(dish_id) ON DELETE CASCADE;
 @   ALTER TABLE ONLY public.cart DROP CONSTRAINT cart_dish_id_fkey;
       public               food_lps0_user    false    3353    241    220            V           2606    17074    cart cart_size_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_size_id_fkey FOREIGN KEY (size_id) REFERENCES public.dish_sizes(size_id) ON DELETE SET NULL;
 @   ALTER TABLE ONLY public.cart DROP CONSTRAINT cart_size_id_fkey;
       public               food_lps0_user    false    3351    218    241            W           2606    17064    cart cart_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
 @   ALTER TABLE ONLY public.cart DROP CONSTRAINT cart_user_id_fkey;
       public               food_lps0_user    false    241    235    3380            F           2606    16978 %   combo_items combo_items_combo_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.combo_items
    ADD CONSTRAINT combo_items_combo_id_fkey FOREIGN KEY (combo_id) REFERENCES public.dishes(dish_id) ON DELETE CASCADE;
 O   ALTER TABLE ONLY public.combo_items DROP CONSTRAINT combo_items_combo_id_fkey;
       public               food_lps0_user    false    3353    220    216            G           2606    16983 $   combo_items combo_items_dish_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.combo_items
    ADD CONSTRAINT combo_items_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(dish_id) ON DELETE CASCADE;
 N   ALTER TABLE ONLY public.combo_items DROP CONSTRAINT combo_items_dish_id_fkey;
       public               food_lps0_user    false    3353    216    220            H           2606    16988 $   combo_items combo_items_size_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.combo_items
    ADD CONSTRAINT combo_items_size_id_fkey FOREIGN KEY (size_id) REFERENCES public.dish_sizes(size_id) ON DELETE SET NULL;
 N   ALTER TABLE ONLY public.combo_items DROP CONSTRAINT combo_items_size_id_fkey;
       public               food_lps0_user    false    218    3351    216            I           2606    16993 "   dish_sizes dish_sizes_dish_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.dish_sizes
    ADD CONSTRAINT dish_sizes_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(dish_id) ON DELETE CASCADE;
 L   ALTER TABLE ONLY public.dish_sizes DROP CONSTRAINT dish_sizes_dish_id_fkey;
       public               food_lps0_user    false    220    218    3353            J           2606    16998 (   order_details order_details_dish_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(dish_id) ON DELETE CASCADE;
 R   ALTER TABLE ONLY public.order_details DROP CONSTRAINT order_details_dish_id_fkey;
       public               food_lps0_user    false    220    3353    222            K           2606    17003 )   order_details order_details_order_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE;
 S   ALTER TABLE ONLY public.order_details DROP CONSTRAINT order_details_order_id_fkey;
       public               food_lps0_user    false    222    224    3361            L           2606    17008    orders orders_table_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(table_id);
 E   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_table_id_fkey;
       public               food_lps0_user    false    233    3371    224            M           2606    17013    orders orders_user_id_fkey    FK CONSTRAINT     ~   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 D   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_user_id_fkey;
       public               food_lps0_user    false    235    224    3380            X           2606    17095 ,   referral_tree referral_tree_ancestor_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.referral_tree
    ADD CONSTRAINT referral_tree_ancestor_id_fkey FOREIGN KEY (ancestor_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
 V   ALTER TABLE ONLY public.referral_tree DROP CONSTRAINT referral_tree_ancestor_id_fkey;
       public               food_lps0_user    false    3380    243    235            Y           2606    17090 (   referral_tree referral_tree_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.referral_tree
    ADD CONSTRAINT referral_tree_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
 R   ALTER TABLE ONLY public.referral_tree DROP CONSTRAINT referral_tree_user_id_fkey;
       public               food_lps0_user    false    235    3380    243            N           2606    17018 $   referrals referrals_referred_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES public.users(user_id);
 N   ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_referred_id_fkey;
       public               food_lps0_user    false    227    3380    235            O           2606    17023 $   referrals referrals_referrer_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.users(user_id);
 N   ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_referrer_id_fkey;
       public               food_lps0_user    false    227    235    3380            P           2606    17028 *   refresh_tokens refresh_tokens_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
 T   ALTER TABLE ONLY public.refresh_tokens DROP CONSTRAINT refresh_tokens_user_id_fkey;
       public               food_lps0_user    false    235    229    3380            Q           2606    17033 '   reservations reservations_table_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(table_id);
 Q   ALTER TABLE ONLY public.reservations DROP CONSTRAINT reservations_table_id_fkey;
       public               food_lps0_user    false    233    3371    231            R           2606    17038 &   reservations reservations_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 P   ALTER TABLE ONLY public.reservations DROP CONSTRAINT reservations_user_id_fkey;
       public               food_lps0_user    false    3380    235    231            S           2606    17043    users users_referred_by_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.users(user_id);
 F   ALTER TABLE ONLY public.users DROP CONSTRAINT users_referred_by_fkey;
       public               food_lps0_user    false    235    3380    235            T           2606    17048 4   wallet_transactions wallet_transactions_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 ^   ALTER TABLE ONLY public.wallet_transactions DROP CONSTRAINT wallet_transactions_user_id_fkey;
       public               food_lps0_user    false    235    3380    238            K           826    16391     DEFAULT PRIVILEGES FOR SEQUENCES    DEFAULT ACL     U   ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO food_lps0_user;
                        postgres    false            M           826    16393    DEFAULT PRIVILEGES FOR TYPES    DEFAULT ACL     Q   ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO food_lps0_user;
                        postgres    false            L           826    16392     DEFAULT PRIVILEGES FOR FUNCTIONS    DEFAULT ACL     U   ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO food_lps0_user;
                        postgres    false            J           826    16390    DEFAULT PRIVILEGES FOR TABLES    DEFAULT ACL     �   ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO food_lps0_user;
                        postgres    false               �   x����� E��]��@ ��'t�Zz*�H���xzA��Zu+ŕͫ���j�]R-�K�+p;����(?(.A���H�/�M����'������H�*z��^�m��#���F�# ��TÎa�����2���6�|ZjX�#�6�g)��5�͑���5��9!�O�Ě      �   j   x���1�0����$G���X��?��mhhv�3bqy8�U�ڱ�����B�S@4v
��B�!Mt�7N��1��*�"��W�H��)�"�1r��J)/@S&      �   �   x���?O�@���S�:������\g�`���תR*Ui"��1���Rϖ~zϖ��s�HD� $qK~˽�紧�%���4��S}?�g��cM7Z^��2+v�KgKCצ�z��[j�6+��Z6��]ֵ,_�9�NŇ�i,nu���n��z��2����Y���L�`LH�r�o��d�X9��c�veQP�
��zD��C��	>����~91��k�4�'Pkޯ      �   �  x���Oo�0��o?���ڤ���fZAh�D+$$.��Ħ���`�
`Gā��va��8�{��4�Z��"5RV���y��,_~F��'�e�7<aHqB����FXxhJ���eYM��$�>j��[�!m�x��[1���q �������v��rl�Αyڃf߲:��[>$�6��@.�_a�xR�R���^�i*��~�NIh�CO�|��1'Wk�6dH��JF��m�郎�:(;����o��QQ���1�z��2���k�sSj�.���{��4_�8UT3�c�E��C]bj�xC�B��I*ņ�c�qӄ_S���=X"q�Sōd��Э"��SX�l��1i:��.V8����!�-�@$�W��	*�G�����%g�pe��>]��Dͻ���nӿ8���A�aPAʄ�d�٫��F�-:_���O"xL�8)l�fi$E���pX�4��Lc�M�zHm����xv'���~57���K
/���LM��Z��RD���U��=�m��6�w4�����)J��TȣZS��S��)�p�k[pR~��s�6L�i����#TB1�U�Oa��&1'����bc���]�����\b��4�(�"^��t�D
�
m�F<�A���}��>���c.X>7h����$ؓHGR�Rp*�M�d'uj!��yn�NC,v�$e� ��+���:�{��|�l4 ��9      �   �   x����n�0E��W���;N�g���6�-RD*j���[�(���cu��q�(#�U�QI����S��}��bR��_�i�O�ںD�ԅ���s�������)�tyoO9�Is(U͕1���h��C�Щ��bN�P	6Ӣb<��˚�+8���|v?7�N�FC�Ɵ��2�lok~ H�PT�Q,��x�a�N`nU3<#��(
��ƌ��ᛁ�]���1f�
W<
�z2�+�s�0�1Ҷ,���[��      �   �   x���M
�0�דS���I4�,�t�T�VE{�F\�TK��}���#P�Yc]�:�Z����ɖ��&	x'&��@�ؿ�g~���-�%��\��PT���o�0��k��5���~�d���Ysy��2���i;;�}3�i�&�~�d�1;�;C�R�5����Vc>d�         ?   x���A�@�w��I�� ��:��}o��$D��W��tt*���C�aƆ�Ѩa|?�/�      
   `   x����� �3N��!X�ҋ���n�������n���1�Oѽ,��C�Zbh�P�L|#	&��k�J3i~4(�}���YBv=������P      �   �   x���1� Eg|�^���
9K��Ԫz5!���$?Y܆ޭ�¥�8�gf��8�k!cq6��-���~��W����0�En�}5�;%�!!�v�Υp��i�u��µo���Y�1�:DBOD�o+      �      x������ � �      �   �   x����j!���S���]��vS�&�Q�B�A'��}�!�4�݁��.C�8o-��:"a1�9�vκ �Gq���0��xj��nO�d��>�%�3�|�k>C��	�f����C,�g�����2�1����h����,��5�5�@
1}t�[�f\H��{L!�p�yŗ���m3���:C����n���F=�ؠ�v��-���F=\kLP+nE�����4M�b��          x   x���;�0D��)r�����,i�p��
$Ο�)�h�[�i�1�v�}�utI�H'���"5����+�1���P�nJ�&�M��x�m��KAy�K�}G?�q��OȂL�.�����!�/���(           x���Ak�  �����Sͩa��òC�[/��R��X;��?�4��0(�>�C�|h�9�hMu�
�)jm���Zm[��0$����{�Ζh㾌;���=y���(~99Ze�C�����]Id  ()p�x�x�$L�U�	᪨Y��ہ���}�ُz�\�t��Gy7}���|1]Ǯ�w5��O���͔�U]l�׎��kֽ���NӼ�{s8��b��x�ĥ�6P���O�PZ�� *fY"��pT"�5	�w�DQ����            x������ � �         	  x���?K�0��9}�7��?m/���&�[�&m�ݥPstvrG߀���P�}����;�����HcT��8͈�V*�8Q*U�")E1OH�j��Gj~�Ъ�Pݣ+��C�d���{�W|�ݳݿ��g�[_�L� FX�	Ô���2.���iX=?���^y�翤�d"���+��G����M���M��?�6֗���ܢ�9��[~�9�|����)��}uK���g�NI���(N"=��:��-��i     