--
-- PostgreSQL database dump
--

\restrict FHgfDFYYshB1hlxAE9cJC0SbnuQ6EhSEieVVrQktRp6rZq8cxf8kO3IHlXY3iIn

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
-- Dumped by pg_dump version 18.3 (Debian 18.3-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: inventory_adjustment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_adjustment (
    id integer NOT NULL,
    product_id integer NOT NULL,
    old_qty integer NOT NULL,
    new_qty integer NOT NULL,
    reason text,
    adjusted_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventory_adjustment OWNER TO postgres;

--
-- Name: inventory_adjustment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_adjustment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_adjustment_id_seq OWNER TO postgres;

--
-- Name: inventory_adjustment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_adjustment_id_seq OWNED BY public.inventory_adjustment.id;


--
-- Name: order_status_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_status_log (
    id integer NOT NULL,
    order_id integer NOT NULL,
    old_status character varying(20),
    new_status character varying(20) NOT NULL,
    changed_by integer,
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.order_status_log OWNER TO postgres;

--
-- Name: order_status_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_status_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_status_log_id_seq OWNER TO postgres;

--
-- Name: order_status_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_status_log_id_seq OWNED BY public.order_status_log.id;


--
-- Name: orders_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders_history (
    id integer NOT NULL,
    user_id integer,
    order_data xml NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'Recibido'::character varying NOT NULL,
    customer_name character varying(150),
    phone character varying(20),
    address text,
    delivery_type character varying(50),
    payment_type character varying(50),
    note text,
    total numeric(10,2),
    paypal_txn_id character varying(100),
    CONSTRAINT orders_history_status_check CHECK (((status)::text = ANY ((ARRAY['Recibido'::character varying, 'En preparación'::character varying, 'En camino'::character varying, 'Completado'::character varying])::text[])))
);


ALTER TABLE public.orders_history OWNER TO postgres;

--
-- Name: orders_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_history_id_seq OWNER TO postgres;

--
-- Name: orders_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_history_id_seq OWNED BY public.orders_history.id;


--
-- Name: password_reset_token; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_token (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_reset_token OWNER TO postgres;

--
-- Name: password_reset_token_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_reset_token_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_reset_token_id_seq OWNER TO postgres;

--
-- Name: password_reset_token_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_reset_token_id_seq OWNED BY public.password_reset_token.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(120) NOT NULL,
    price numeric(10,2) NOT NULL,
    image_url text,
    category character varying(80) NOT NULL,
    description text,
    in_stock boolean DEFAULT true,
    stock integer DEFAULT 0 NOT NULL,
    low_stock_threshold integer DEFAULT 5 NOT NULL
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_migrations (
    filename text NOT NULL,
    applied_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.schema_migrations OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    phone character varying(20),
    address text,
    email character varying(150) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'user'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    failed_attempts integer DEFAULT 0 NOT NULL,
    locked_until timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: inventory_adjustment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_adjustment ALTER COLUMN id SET DEFAULT nextval('public.inventory_adjustment_id_seq'::regclass);


--
-- Name: order_status_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_log ALTER COLUMN id SET DEFAULT nextval('public.order_status_log_id_seq'::regclass);


--
-- Name: orders_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders_history ALTER COLUMN id SET DEFAULT nextval('public.orders_history_id_seq'::regclass);


--
-- Name: password_reset_token id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_token ALTER COLUMN id SET DEFAULT nextval('public.password_reset_token_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: inventory_adjustment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_adjustment (id, product_id, old_qty, new_qty, reason, adjusted_by, created_at) FROM stdin;
\.


--
-- Data for Name: order_status_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_status_log (id, order_id, old_status, new_status, changed_by, changed_at) FROM stdin;
\.


--
-- Data for Name: orders_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders_history (id, user_id, order_data, created_at, status, customer_name, phone, address, delivery_type, payment_type, note, total, paypal_txn_id) FROM stdin;
\.


--
-- Data for Name: password_reset_token; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_token (id, user_id, token_hash, expires_at, used, created_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, price, image_url, category, description, in_stock, stock, low_stock_threshold) FROM stdin;
1	Pastel de chocolate	320.00	pastel4.jpeg	Pastel	8 porciones	t	20	5
2	Gelatina de fresa	120.00	gelatina-fresa.jpg	Gelatina	6 porciones	t	20	5
4	Pastel de fresa	305.00	pastel2.jpeg	Pastel	8 porciones	t	20	5
5	Pastel de limón	295.00	pastel3.jpeg	Pastel	8 porciones	t	20	5
7	Pastel de frutas	330.00	pastel5.jpeg	Pastel	10 porciones	t	20	5
8	Chocoflan	260.00	chocoflan.webp	Postre	7 porciones	t	20	5
9	Pastel de chocofresa	340.00	chocofresa.png	Pastel	8 porciones	t	20	5
10	Pay de frambuesa	235.00	paydeframbuesa.webp	Pay	8 porciones	t	20	5
11	Pay de fruta	225.00	paydefruta.webp	Pay	8 porciones	t	20	5
12	Rollo de canela	145.00	roldecanela.webp	Pan	6 piezas	t	20	5
13	Macarrons surtidos	180.00	macarrons.webp	Galleta	12 piezas	t	20	5
15	Gelatina de mango	130.00	gelatinamango.webp	Gelatina	6 porciones	t	20	5
16	Frutas surtidas	140.00	frutas.webp	Otro	1 porción	t	20	5
14	Pan dulce	90.00	pan_dulce.webp	Pan	10 piezas	t	20	5
3	Galletas surtidas	95.00	galletas_surtidas.jpg	Galleta	12 piezas	t	20	5
6	Pastel de vainilla	290.00	pastel1.jpeg	Pastel	8 porciones	t	20	5
17	Pastel de chocolate	320.00	pastel4.jpeg	Pastel	8 porciones	t	20	5
18	Pastel de fresa	305.00	pastel2.jpeg	Pastel	8 porciones	t	20	5
19	Pastel de limón	295.00	pastel3.jpeg	Pastel	8 porciones	t	20	5
20	Pastel de vainilla	290.00	pastel1.jpeg	Pastel	8 porciones	t	20	5
21	Pastel de frutas	330.00	pastel5.jpeg	Pastel	10 porciones	t	20	5
22	Chocoflan	260.00	chocoflan.webp	Postre	7 porciones	t	20	5
23	Pastel de chocofresa	340.00	chocofresa.png	Pastel	8 porciones	t	20	5
24	Pay de frambuesa	235.00	paydeframbuesa.webp	Pay	8 porciones	t	20	5
25	Pay de fruta	225.00	paydefruta.webp	Pay	8 porciones	t	20	5
26	Rollo de canela	145.00	roldecanela.webp	Pan	6 piezas	t	20	5
27	Macarrons surtidos	180.00	macarrons.webp	Galleta	12 piezas	t	20	5
28	Pan dulce	90.00	pan_dulce.webp	Pan	10 piezas	t	20	5
29	Gelatina de mango	130.00	gelatinamango.webp	Gelatina	6 porciones	t	20	5
30	Frutas surtidas	140.00	frutas.webp	Otro	1 porción	t	20	5
31	Galletas surtidas	95.00	galletas_surtidas.jpg	Galleta	12 piezas	t	20	5
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schema_migrations (filename, applied_at) FROM stdin;
01_products.sql	2026-05-31 07:27:02.302546
02_users.sql	2026-05-31 07:27:02.32096
03_orders_xml_migration.sql	2026-05-31 07:27:02.33522
04_orders_status.sql	2026-05-31 07:27:02.377583
05_order_status_log.sql	2026-05-31 07:27:02.392482
06_inventory.sql	2026-05-31 07:27:02.415093
07_user_security.sql	2026-05-31 07:27:02.442257
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, phone, address, email, password, role, created_at, failed_attempts, locked_until) FROM stdin;
1	Fernando	3332564080	dfwfwefwrg	a21301045@ceti.mx	$2b$10$2k3KY5kSDxNayi5pb4i2E.TtYrksSkwbyTsg5VIxXT.PLwdkhumRW	user	2026-05-21 07:49:17.834832	0	\N
2	Alondra	3333333333	654654	test@example.com	$2b$10$vxTUTWNFbHwl2RNGO8tQr.AsWpL4fg9pwl6/fTckYHY52kEb8H05.	user	2026-05-21 15:31:11.052558	0	\N
\.


--
-- Name: inventory_adjustment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_adjustment_id_seq', 1, true);


--
-- Name: order_status_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_status_log_id_seq', 1, true);


--
-- Name: orders_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_history_id_seq', 1, true);


--
-- Name: password_reset_token_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_reset_token_id_seq', 1, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 32, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: inventory_adjustment inventory_adjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_adjustment
    ADD CONSTRAINT inventory_adjustment_pkey PRIMARY KEY (id);


--
-- Name: order_status_log order_status_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_log
    ADD CONSTRAINT order_status_log_pkey PRIMARY KEY (id);


--
-- Name: orders_history orders_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders_history
    ADD CONSTRAINT orders_history_pkey PRIMARY KEY (id);


--
-- Name: password_reset_token password_reset_token_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_token
    ADD CONSTRAINT password_reset_token_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (filename);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_inventory_adjustment_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_adjustment_product ON public.inventory_adjustment USING btree (product_id);


--
-- Name: idx_order_status_log_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_status_log_order ON public.order_status_log USING btree (order_id);


--
-- Name: idx_password_reset_token_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_token_hash ON public.password_reset_token USING btree (token_hash);


--
-- Name: idx_password_reset_token_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_token_user ON public.password_reset_token USING btree (user_id);


--
-- Name: inventory_adjustment inventory_adjustment_adjusted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_adjustment
    ADD CONSTRAINT inventory_adjustment_adjusted_by_fkey FOREIGN KEY (adjusted_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: inventory_adjustment inventory_adjustment_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_adjustment
    ADD CONSTRAINT inventory_adjustment_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: order_status_log order_status_log_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_log
    ADD CONSTRAINT order_status_log_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: order_status_log order_status_log_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_log
    ADD CONSTRAINT order_status_log_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders_history(id) ON DELETE CASCADE;


--
-- Name: orders_history orders_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders_history
    ADD CONSTRAINT orders_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_reset_token password_reset_token_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_token
    ADD CONSTRAINT password_reset_token_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict FHgfDFYYshB1hlxAE9cJC0SbnuQ6EhSEieVVrQktRp6rZq8cxf8kO3IHlXY3iIn

