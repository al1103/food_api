PGDMP      +        
        }            food    17.4    17.4 Z    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    16390    food    DATABASE     j   CREATE DATABASE food WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en-US';
    DROP DATABASE food;
                     postgres    false            �            1259    16392    dishes    TABLE     6  CREATE TABLE public.dishes (
    dishid integer NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(500),
    price numeric(10,2) NOT NULL,
    category character varying(50) NOT NULL,
    imageurl character varying(255),
    rating numeric(3,2) DEFAULT 0,
    isactive boolean DEFAULT true,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT dishes_rating_check CHECK (((rating >= (0)::numeric) AND (rating <= (5)::numeric)))
);
    DROP TABLE public.dishes;
       public         heap r       postgres    false            �            1259    16391    dishes_dishid_seq    SEQUENCE     �   CREATE SEQUENCE public.dishes_dishid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.dishes_dishid_seq;
       public               postgres    false    218            �           0    0    dishes_dishid_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.dishes_dishid_seq OWNED BY public.dishes.dishid;
          public               postgres    false    217            �            1259    16406 	   menuitems    TABLE     �  CREATE TABLE public.menuitems (
    itemid integer NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(500),
    price numeric(10,2) NOT NULL,
    imageurl character varying(255),
    rating numeric(3,2) DEFAULT 0,
    category character varying(50) NOT NULL,
    isactive boolean DEFAULT true,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.menuitems;
       public         heap r       postgres    false            �            1259    16405    menuitems_itemid_seq    SEQUENCE     �   CREATE SEQUENCE public.menuitems_itemid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.menuitems_itemid_seq;
       public               postgres    false    220            �           0    0    menuitems_itemid_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.menuitems_itemid_seq OWNED BY public.menuitems.itemid;
          public               postgres    false    219            �            1259    16469    orderdetails    TABLE     �  CREATE TABLE public.orderdetails (
    orderdetailid integer NOT NULL,
    orderid integer NOT NULL,
    itemid integer NOT NULL,
    quantity integer NOT NULL,
    unitprice numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    notes character varying(500),
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT orderdetails_quantity_check CHECK ((quantity > 0))
);
     DROP TABLE public.orderdetails;
       public         heap r       postgres    false            �            1259    16468    orderdetails_orderdetailid_seq    SEQUENCE     �   CREATE SEQUENCE public.orderdetails_orderdetailid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 5   DROP SEQUENCE public.orderdetails_orderdetailid_seq;
       public               postgres    false    227            �           0    0    orderdetails_orderdetailid_seq    SEQUENCE OWNED BY     a   ALTER SEQUENCE public.orderdetails_orderdetailid_seq OWNED BY public.orderdetails.orderdetailid;
          public               postgres    false    226            �            1259    16444    orders    TABLE     �  CREATE TABLE public.orders (
    orderid integer NOT NULL,
    userid uuid NOT NULL,
    tablenumber integer,
    totalprice numeric(10,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    ordertype character varying(20) DEFAULT 'dine-in'::character varying NOT NULL,
    orderdate timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT orders_ordertype_check CHECK (((ordertype)::text = ANY ((ARRAY['dine-in'::character varying, 'takeaway'::character varying, 'delivery'::character varying])::text[]))),
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);
    DROP TABLE public.orders;
       public         heap r       postgres    false            �            1259    16443    orders_orderid_seq    SEQUENCE     �   CREATE SEQUENCE public.orders_orderid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public.orders_orderid_seq;
       public               postgres    false    225            �           0    0    orders_orderid_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public.orders_orderid_seq OWNED BY public.orders.orderid;
          public               postgres    false    224            �            1259    16594 	   referrals    TABLE     E  CREATE TABLE public.referrals (
    id integer NOT NULL,
    referrerid uuid,
    referredid uuid,
    commission numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    createdat timestamp without time zone DEFAULT now(),
    updatedat timestamp without time zone DEFAULT now()
);
    DROP TABLE public.referrals;
       public         heap r       postgres    false            �            1259    16593    referrals_id_seq    SEQUENCE     �   CREATE SEQUENCE public.referrals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public.referrals_id_seq;
       public               postgres    false    235            �           0    0    referrals_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public.referrals_id_seq OWNED BY public.referrals.id;
          public               postgres    false    234            �            1259    16513    refreshtokens    TABLE     �   CREATE TABLE public.refreshtokens (
    id integer NOT NULL,
    userid uuid NOT NULL,
    token character varying(500) NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 !   DROP TABLE public.refreshtokens;
       public         heap r       postgres    false            �            1259    16512    refreshtokens_id_seq    SEQUENCE     �   CREATE SEQUENCE public.refreshtokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.refreshtokens_id_seq;
       public               postgres    false    231            �           0    0    refreshtokens_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.refreshtokens_id_seq OWNED BY public.refreshtokens.id;
          public               postgres    false    230            �            1259    16491    reservations    TABLE     �  CREATE TABLE public.reservations (
    reservationid integer NOT NULL,
    userid uuid NOT NULL,
    tablenumber integer NOT NULL,
    reservationtime timestamp without time zone NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    numberofguests integer DEFAULT 1 NOT NULL,
    CONSTRAINT reservations_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'cancelled'::character varying, 'completed'::character varying])::text[])))
);
     DROP TABLE public.reservations;
       public         heap r       postgres    false            �            1259    16490    reservations_reservationid_seq    SEQUENCE     �   CREATE SEQUENCE public.reservations_reservationid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 5   DROP SEQUENCE public.reservations_reservationid_seq;
       public               postgres    false    229            �           0    0    reservations_reservationid_seq    SEQUENCE OWNED BY     a   ALTER SEQUENCE public.reservations_reservationid_seq OWNED BY public.reservations.reservationid;
          public               postgres    false    228            �            1259    16419    tables    TABLE     ,  CREATE TABLE public.tables (
    tableid integer NOT NULL,
    tablenumber integer NOT NULL,
    capacity integer NOT NULL,
    status character varying(20) DEFAULT 'available'::character varying,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    currentoccupancy integer DEFAULT 0,
    CONSTRAINT tables_status_check CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'occupied'::character varying, 'reserved'::character varying])::text[])))
);
    DROP TABLE public.tables;
       public         heap r       postgres    false            �            1259    16418    tables_tableid_seq    SEQUENCE     �   CREATE SEQUENCE public.tables_tableid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public.tables_tableid_seq;
       public               postgres    false    222            �           0    0    tables_tableid_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public.tables_tableid_seq OWNED BY public.tables.tableid;
          public               postgres    false    221            �            1259    16432    users    TABLE     !  CREATE TABLE public.users (
    userid uuid NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    fullname character varying(200),
    phonenumber character varying(20),
    address character varying(500),
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    referralcode character varying(20),
    referredby uuid,
    walletbalance numeric(10,2) DEFAULT 0
);
    DROP TABLE public.users;
       public         heap r       postgres    false            �            1259    16523    verificationcode    TABLE     c  CREATE TABLE public.verificationcode (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    code character varying(10) NOT NULL,
    type character varying(20) NOT NULL,
    expirationtime timestamp without time zone NOT NULL,
    isverified boolean DEFAULT false,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 $   DROP TABLE public.verificationcode;
       public         heap r       postgres    false            �            1259    16522    verificationcode_id_seq    SEQUENCE     �   CREATE SEQUENCE public.verificationcode_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.verificationcode_id_seq;
       public               postgres    false    233            �           0    0    verificationcode_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.verificationcode_id_seq OWNED BY public.verificationcode.id;
          public               postgres    false    232            �            1259    16614    wallet_transactions    TABLE     $  CREATE TABLE public.wallet_transactions (
    id integer NOT NULL,
    userid uuid,
    amount numeric(10,2) NOT NULL,
    transactiontype character varying(20) NOT NULL,
    referenceid character varying(255),
    description text,
    createdat timestamp without time zone DEFAULT now()
);
 '   DROP TABLE public.wallet_transactions;
       public         heap r       postgres    false            �            1259    16613    wallet_transactions_id_seq    SEQUENCE     �   CREATE SEQUENCE public.wallet_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public.wallet_transactions_id_seq;
       public               postgres    false    237            �           0    0    wallet_transactions_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.wallet_transactions_id_seq OWNED BY public.wallet_transactions.id;
          public               postgres    false    236            �           2604    16395    dishes dishid    DEFAULT     n   ALTER TABLE ONLY public.dishes ALTER COLUMN dishid SET DEFAULT nextval('public.dishes_dishid_seq'::regclass);
 <   ALTER TABLE public.dishes ALTER COLUMN dishid DROP DEFAULT;
       public               postgres    false    218    217    218            �           2604    16409    menuitems itemid    DEFAULT     t   ALTER TABLE ONLY public.menuitems ALTER COLUMN itemid SET DEFAULT nextval('public.menuitems_itemid_seq'::regclass);
 ?   ALTER TABLE public.menuitems ALTER COLUMN itemid DROP DEFAULT;
       public               postgres    false    220    219    220            �           2604    16472    orderdetails orderdetailid    DEFAULT     �   ALTER TABLE ONLY public.orderdetails ALTER COLUMN orderdetailid SET DEFAULT nextval('public.orderdetails_orderdetailid_seq'::regclass);
 I   ALTER TABLE public.orderdetails ALTER COLUMN orderdetailid DROP DEFAULT;
       public               postgres    false    227    226    227            �           2604    16447    orders orderid    DEFAULT     p   ALTER TABLE ONLY public.orders ALTER COLUMN orderid SET DEFAULT nextval('public.orders_orderid_seq'::regclass);
 =   ALTER TABLE public.orders ALTER COLUMN orderid DROP DEFAULT;
       public               postgres    false    225    224    225            �           2604    16597    referrals id    DEFAULT     l   ALTER TABLE ONLY public.referrals ALTER COLUMN id SET DEFAULT nextval('public.referrals_id_seq'::regclass);
 ;   ALTER TABLE public.referrals ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    235    234    235            �           2604    16516    refreshtokens id    DEFAULT     t   ALTER TABLE ONLY public.refreshtokens ALTER COLUMN id SET DEFAULT nextval('public.refreshtokens_id_seq'::regclass);
 ?   ALTER TABLE public.refreshtokens ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    231    230    231            �           2604    16494    reservations reservationid    DEFAULT     �   ALTER TABLE ONLY public.reservations ALTER COLUMN reservationid SET DEFAULT nextval('public.reservations_reservationid_seq'::regclass);
 I   ALTER TABLE public.reservations ALTER COLUMN reservationid DROP DEFAULT;
       public               postgres    false    229    228    229            �           2604    16422    tables tableid    DEFAULT     p   ALTER TABLE ONLY public.tables ALTER COLUMN tableid SET DEFAULT nextval('public.tables_tableid_seq'::regclass);
 =   ALTER TABLE public.tables ALTER COLUMN tableid DROP DEFAULT;
       public               postgres    false    221    222    222            �           2604    16526    verificationcode id    DEFAULT     z   ALTER TABLE ONLY public.verificationcode ALTER COLUMN id SET DEFAULT nextval('public.verificationcode_id_seq'::regclass);
 B   ALTER TABLE public.verificationcode ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    233    232    233            �           2604    16617    wallet_transactions id    DEFAULT     �   ALTER TABLE ONLY public.wallet_transactions ALTER COLUMN id SET DEFAULT nextval('public.wallet_transactions_id_seq'::regclass);
 E   ALTER TABLE public.wallet_transactions ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    236    237    237            �          0    16392    dishes 
   TABLE DATA           ~   COPY public.dishes (dishid, name, description, price, category, imageurl, rating, isactive, createdat, updatedat) FROM stdin;
    public               postgres    false    218   �z       �          0    16406 	   menuitems 
   TABLE DATA           �   COPY public.menuitems (itemid, name, description, price, imageurl, rating, category, isactive, createdat, updatedat) FROM stdin;
    public               postgres    false    220   �|       �          0    16469    orderdetails 
   TABLE DATA           �   COPY public.orderdetails (orderdetailid, orderid, itemid, quantity, unitprice, subtotal, notes, createdat, updatedat) FROM stdin;
    public               postgres    false    227   R       �          0    16444    orders 
   TABLE DATA           ~   COPY public.orders (orderid, userid, tablenumber, totalprice, status, ordertype, orderdate, createdat, updatedat) FROM stdin;
    public               postgres    false    225   o       �          0    16594 	   referrals 
   TABLE DATA           i   COPY public.referrals (id, referrerid, referredid, commission, status, createdat, updatedat) FROM stdin;
    public               postgres    false    235   �       �          0    16513    refreshtokens 
   TABLE DATA           E   COPY public.refreshtokens (id, userid, token, createdat) FROM stdin;
    public               postgres    false    231   �       �          0    16491    reservations 
   TABLE DATA           �   COPY public.reservations (reservationid, userid, tablenumber, reservationtime, status, createdat, updatedat, numberofguests) FROM stdin;
    public               postgres    false    229   �       �          0    16419    tables 
   TABLE DATA           p   COPY public.tables (tableid, tablenumber, capacity, status, createdat, updatedat, currentoccupancy) FROM stdin;
    public               postgres    false    222   v�       �          0    16432    users 
   TABLE DATA           �   COPY public.users (userid, username, email, password, fullname, phonenumber, address, createdat, updatedat, referralcode, referredby, walletbalance) FROM stdin;
    public               postgres    false    223   �       �          0    16523    verificationcode 
   TABLE DATA           h   COPY public.verificationcode (id, email, code, type, expirationtime, isverified, createdat) FROM stdin;
    public               postgres    false    233   �       �          0    16614    wallet_transactions 
   TABLE DATA           w   COPY public.wallet_transactions (id, userid, amount, transactiontype, referenceid, description, createdat) FROM stdin;
    public               postgres    false    237   ф       �           0    0    dishes_dishid_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.dishes_dishid_seq', 8, true);
          public               postgres    false    217            �           0    0    menuitems_itemid_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.menuitems_itemid_seq', 10, true);
          public               postgres    false    219            �           0    0    orderdetails_orderdetailid_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public.orderdetails_orderdetailid_seq', 12, true);
          public               postgres    false    226            �           0    0    orders_orderid_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.orders_orderid_seq', 5, true);
          public               postgres    false    224            �           0    0    referrals_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.referrals_id_seq', 1, false);
          public               postgres    false    234            �           0    0    refreshtokens_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.refreshtokens_id_seq', 3, true);
          public               postgres    false    230            �           0    0    reservations_reservationid_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public.reservations_reservationid_seq', 7, true);
          public               postgres    false    228            �           0    0    tables_tableid_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.tables_tableid_seq', 10, true);
          public               postgres    false    221            �           0    0    verificationcode_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.verificationcode_id_seq', 5, true);
          public               postgres    false    232            �           0    0    wallet_transactions_id_seq    SEQUENCE SET     I   SELECT pg_catalog.setval('public.wallet_transactions_id_seq', 1, false);
          public               postgres    false    236            �           2606    16404    dishes dishes_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_pkey PRIMARY KEY (dishid);
 <   ALTER TABLE ONLY public.dishes DROP CONSTRAINT dishes_pkey;
       public                 postgres    false    218            �           2606    16417    menuitems menuitems_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.menuitems
    ADD CONSTRAINT menuitems_pkey PRIMARY KEY (itemid);
 B   ALTER TABLE ONLY public.menuitems DROP CONSTRAINT menuitems_pkey;
       public                 postgres    false    220            �           2606    16479    orderdetails orderdetails_pkey 
   CONSTRAINT     g   ALTER TABLE ONLY public.orderdetails
    ADD CONSTRAINT orderdetails_pkey PRIMARY KEY (orderdetailid);
 H   ALTER TABLE ONLY public.orderdetails DROP CONSTRAINT orderdetails_pkey;
       public                 postgres    false    227            �           2606    16457    orders orders_pkey 
   CONSTRAINT     U   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (orderid);
 <   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_pkey;
       public                 postgres    false    225                       2606    16602    referrals referrals_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);
 B   ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_pkey;
       public                 postgres    false    235            �           2606    16521     refreshtokens refreshtokens_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.refreshtokens
    ADD CONSTRAINT refreshtokens_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.refreshtokens DROP CONSTRAINT refreshtokens_pkey;
       public                 postgres    false    231            �           2606    16501    reservations reservations_pkey 
   CONSTRAINT     g   ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (reservationid);
 H   ALTER TABLE ONLY public.reservations DROP CONSTRAINT reservations_pkey;
       public                 postgres    false    229            �           2606    16429    tables tables_pkey 
   CONSTRAINT     U   ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (tableid);
 <   ALTER TABLE ONLY public.tables DROP CONSTRAINT tables_pkey;
       public                 postgres    false    222            �           2606    16431    tables tables_tablenumber_key 
   CONSTRAINT     _   ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_tablenumber_key UNIQUE (tablenumber);
 G   ALTER TABLE ONLY public.tables DROP CONSTRAINT tables_tablenumber_key;
       public                 postgres    false    222            �           2606    16442    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public                 postgres    false    223            �           2606    16558    users users_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (userid);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public                 postgres    false    223            �           2606    16587    users users_referralcode_key 
   CONSTRAINT     _   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referralcode_key UNIQUE (referralcode);
 F   ALTER TABLE ONLY public.users DROP CONSTRAINT users_referralcode_key;
       public                 postgres    false    223                        2606    16530 &   verificationcode verificationcode_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public.verificationcode
    ADD CONSTRAINT verificationcode_pkey PRIMARY KEY (id);
 P   ALTER TABLE ONLY public.verificationcode DROP CONSTRAINT verificationcode_pkey;
       public                 postgres    false    233                       2606    16622 ,   wallet_transactions wallet_transactions_pkey 
   CONSTRAINT     j   ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);
 V   ALTER TABLE ONLY public.wallet_transactions DROP CONSTRAINT wallet_transactions_pkey;
       public                 postgres    false    237                       2606    16485 %   orderdetails orderdetails_itemid_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.orderdetails
    ADD CONSTRAINT orderdetails_itemid_fkey FOREIGN KEY (itemid) REFERENCES public.menuitems(itemid);
 O   ALTER TABLE ONLY public.orderdetails DROP CONSTRAINT orderdetails_itemid_fkey;
       public               postgres    false    4844    227    220            	           2606    16480 &   orderdetails orderdetails_orderid_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.orderdetails
    ADD CONSTRAINT orderdetails_orderid_fkey FOREIGN KEY (orderid) REFERENCES public.orders(orderid);
 P   ALTER TABLE ONLY public.orderdetails DROP CONSTRAINT orderdetails_orderid_fkey;
       public               postgres    false    4856    227    225                       2606    16463    orders orders_tablenumber_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_tablenumber_fkey FOREIGN KEY (tablenumber) REFERENCES public.tables(tablenumber);
 H   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_tablenumber_fkey;
       public               postgres    false    222    4848    225                       2606    16574    orders orders_userid_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;
 C   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_userid_fkey;
       public               postgres    false    223    225    4852                       2606    16608 #   referrals referrals_referredid_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referredid_fkey FOREIGN KEY (referredid) REFERENCES public.users(userid);
 M   ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_referredid_fkey;
       public               postgres    false    235    223    4852                       2606    16603 #   referrals referrals_referrerid_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrerid_fkey FOREIGN KEY (referrerid) REFERENCES public.users(userid);
 M   ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_referrerid_fkey;
       public               postgres    false    223    4852    235            
           2606    16507 *   reservations reservations_tablenumber_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_tablenumber_fkey FOREIGN KEY (tablenumber) REFERENCES public.tables(tablenumber);
 T   ALTER TABLE ONLY public.reservations DROP CONSTRAINT reservations_tablenumber_fkey;
       public               postgres    false    4848    222    229                       2606    16579 %   reservations reservations_userid_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;
 O   ALTER TABLE ONLY public.reservations DROP CONSTRAINT reservations_userid_fkey;
       public               postgres    false    223    4852    229                       2606    16588    users users_referredby_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referredby_fkey FOREIGN KEY (referredby) REFERENCES public.users(userid);
 E   ALTER TABLE ONLY public.users DROP CONSTRAINT users_referredby_fkey;
       public               postgres    false    223    223    4852                       2606    16623 3   wallet_transactions wallet_transactions_userid_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid);
 ]   ALTER TABLE ONLY public.wallet_transactions DROP CONSTRAINT wallet_transactions_userid_fkey;
       public               postgres    false    223    4852    237            �     x���ˮ�0��~����svm$��"�A�&�$18qd;T���[�(�ɪ�8��K2SFN��?p��h�=��@N��QHEGz���RbMyꃡ�Z;q.$l����"zhѼ����Gj(Sf�}l�:��Ē"/6/���`oE���+���,
�	tۡ�Y��,����E�U=ؤ_�^��R�2�+0BVp������2d&�f�xE��=N�EM>N��h�+#X{�^���Fxd�� �sc�y���
Gɺ�g]��M/ �&4��jgro����t���k5Y5��汿v�F-�{uH{F�+K�ϒ��So�,+�$X�G���@�Y�΍�\�r�����2P�n��y'[�|�Ȩ�_�GH�Bv?�%��t��]�uq0Fi��ʄ�VR�ȼ��J�QP�4E������c�q;ϸ#_�]�4>�;�J�ׄ�˴*w���bW黒��gڻ�o��~use�e��jW_��JN�v�i-F�����cwbBq=��-[,� ���      �   i  x����n�0��������z�k3�b��`6`�
ck�-C��O?ZRV,�n�+ÔH~���9�%���zgik��GXY�� 0��^�F�ViM[!Sv[�#�)UG�/����Z��ݴ�7ic�jM�5̧��N��X\g��<E�Pd�|���&|F[7d�G�V����9%E?�ERoZ��J��,i�W��B�4��)n��rj%��F�����h'�[��O��Q���?DZ�A#v�t=I�:���v,RV�l�e۸�H�Brh�5n�%��D��G��ۣmygw%�5�7���2�o9ө���3=��$�<���2�k�H�ѓx�f�)��J6,�c���H��K���Q�<�l�,Sf�������u	��5J���g)<:g�g7��Fk!��RQ�P��5�},� �Y�r�-|��٘�?����8�vA�B��Lqw9�ND��ewvǂ��P���`����~�E�J���#�U=���]bR��<�Ǿ'�^/��=|��fu��~�@���������Ǳƴ�0�Sl�g��/��?Sh��)�.[�ۑ�L���⧱����>�۸rD�� �i{����߶���w9��t2��j���      �      x������ � �      �   Z   x��ɱ� @�:L��BB ��F=��+�
6�x_�KԔ����g����	(%��>ۘ7|�8&0�"	Z��He�%���r�wνh� �      �      x������ � �      �   �   x����n�@����}�%��@�c�6C���j�E��EmHڤ�>}�o^Z�&����AatOG�fK˪~�}�}�S_Hm����4�d�pȕ�O�x�#ܷ��$��n�U9vC�-��T� eY��G3��~�_2�XiS�B���+��n�I�˙���{��͸j�n�isl5'� �LP���y�s�B� ݔp���=3�3d�p!�u� � �)a�b����u���<�-��{      �   w   x���1�0k�+����־��[h vP
��q
�B�jV��(B�q�4�/���rG�YG�8sK`5�s��{[�策�+�9b��L��i�-���@����l��gt��QY7�      �   f   x���;
�0E��en af��Zl"X�]���Ճ�]8
�a��Z�X'L,{�^e3&CSP+��3mDD$�HH���QH���FEE#��F*$�_����ƌ�      �     x���˒�0���)2U.�Lnګ�#*B���z�nP *(��w@g���qe��$�9�*+��פZ���}J�PY*�"TD��K؊����N^��Z�T�W%�X�^>������_R���!�����bshjV��ۘ�`���L���ZUU�^�%MUd �Ñ���#{�.�Y����(���e�`H�+ůDA�j��>����������~�YPT�{�΢��\���v֎5kex�S�x���^(���F=wd�z�o��v���}���m�@$�v(>���Z�Y�7Z�׋�%[�W�J}yn;N�׻3m�[wuaX�5�Lu���DN�?%���8��Ԝ�s��A�0�f�� &�HT S;Q��QP7��6����Q��ة�a��P�*�A�Y��ۧ�3��Sl��E�����mc�0�⏚�z��4o��z�c�z1�^�fEQ$Y �7z"l�_}���]���I��K�`m/Ms�_�?�)v�m�?@Qz�@7+�V���	u�J��/5�      �   �   x���A
�0@��x�^�����Y� �uZ#����+�������k=��c�i ��PR�0�ۆe6��*�E���J\s˾
Ԃk�E�2�q�'G���K-Չ\@�kF�t:�L&����s�@;/(~ۯ4.��!�{G��G��8�p���\���Fc��a����=�~�,˾�owG      �      x������ � �     