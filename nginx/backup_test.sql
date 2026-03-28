--
-- PostgreSQL database dump
--

\restrict qBlM9DQ7PZUQBOwtAM4idKYWTWjuk8itixVzabqoDDd8KJZfxu8B5C2LZA0IMTV

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ApplicationStatus; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."ApplicationStatus" AS ENUM (
    'pending',
    'reviewed',
    'accepted',
    'rejected'
);


ALTER TYPE public."ApplicationStatus" OWNER TO admin;

--
-- Name: JobStatus; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."JobStatus" AS ENUM (
    'open',
    'closed'
);


ALTER TYPE public."JobStatus" OWNER TO admin;

--
-- Name: JobType; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."JobType" AS ENUM (
    'full_time',
    'part_time',
    'contract',
    'internship',
    'remote'
);


ALTER TYPE public."JobType" OWNER TO admin;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."Role" AS ENUM (
    'job_seeker',
    'company_admin'
);


ALTER TYPE public."Role" OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Application; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Application" (
    id integer NOT NULL,
    "appliedDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" integer NOT NULL,
    "jobId" integer NOT NULL,
    status public."ApplicationStatus" DEFAULT 'pending'::public."ApplicationStatus" NOT NULL,
    "coverLetter" text
);


ALTER TABLE public."Application" OWNER TO admin;

--
-- Name: Application_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."Application_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Application_id_seq" OWNER TO admin;

--
-- Name: Application_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."Application_id_seq" OWNED BY public."Application".id;


--
-- Name: Company; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Company" (
    id integer NOT NULL,
    "companyName" text NOT NULL,
    email text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    description text,
    location text,
    logo text,
    website text,
    industry text,
    size text
);


ALTER TABLE public."Company" OWNER TO admin;

--
-- Name: Company_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."Company_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Company_id_seq" OWNER TO admin;

--
-- Name: Company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."Company_id_seq" OWNED BY public."Company".id;


--
-- Name: Job; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Job" (
    id integer NOT NULL,
    title text NOT NULL,
    location text NOT NULL,
    description text,
    "companyId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "jobType" public."JobType" NOT NULL,
    "salaryMax" integer,
    "salaryMin" integer,
    status public."JobStatus" DEFAULT 'open'::public."JobStatus" NOT NULL,
    benefits text,
    requirements text
);


ALTER TABLE public."Job" OWNER TO admin;

--
-- Name: Job_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."Job_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Job_id_seq" OWNER TO admin;

--
-- Name: Job_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."Job_id_seq" OWNED BY public."Job".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    resume text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" integer,
    role public."Role" DEFAULT 'job_seeker'::public."Role" NOT NULL,
    avatar text,
    bio text,
    headline text,
    location text,
    phone text,
    skills text[]
);


ALTER TABLE public."User" OWNER TO admin;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO admin;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO admin;

--
-- Name: Application id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Application" ALTER COLUMN id SET DEFAULT nextval('public."Application_id_seq"'::regclass);


--
-- Name: Company id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Company" ALTER COLUMN id SET DEFAULT nextval('public."Company_id_seq"'::regclass);


--
-- Name: Job id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Job" ALTER COLUMN id SET DEFAULT nextval('public."Job_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: Application; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Application" (id, "appliedDate", "userId", "jobId", status, "coverLetter") FROM stdin;
\.


--
-- Data for Name: Company; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Company" (id, "companyName", email, "createdAt", "updatedAt", description, location, logo, website, industry, size) FROM stdin;
\.


--
-- Data for Name: Job; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Job" (id, title, location, description, "companyId", "createdAt", "updatedAt", "jobType", "salaryMax", "salaryMin", status, benefits, requirements) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."User" (id, name, email, password, resume, "createdAt", "updatedAt", "companyId", role, avatar, bio, headline, location, phone, skills) FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
e2526419-fac5-4fa1-bc53-40614c2ed764	c9fc215014b4cb7743433fa5357afeb0eadad7ba7ef616d079635e186c3c29ac	2026-03-27 06:34:51.631955+00	20260313060622_update_schema	\N	\N	2026-03-27 06:34:51.59366+00	1
0f3d806e-f64c-4e18-8911-197e4aa38c14	832314db84622bbcbc8ac2c596cf3a17d33e45fb4f1919dcfc5d795873824ab8	2026-03-27 06:34:51.648693+00	20260313060758_update_schema	\N	\N	2026-03-27 06:34:51.632759+00	1
457523a8-6a50-4242-9069-5ca14ae632e0	5f25d99ee48ddd2cecf7c9819d6621aa815869c686bf67dd738c03931fd8139c	2026-03-27 06:34:51.654801+00	20260313061410_add_pp_timezone	\N	\N	2026-03-27 06:34:51.649528+00	1
77ae5692-9bbc-4952-a9df-63f96f825ebf	9fdcb39c686c0ecf7bc5a850eb1b94e6b37c7836dd3970aa0accb629fa69f12d	2026-03-27 06:34:51.677937+00	20260313062250_re_update_schema	\N	\N	2026-03-27 06:34:51.655626+00	1
2e402b74-ca1d-494a-9798-7a5441128d7f	3c7696a539af0d8db47b691caa2029ca8f7181eaf904f8d7f3c01dd110ff9388	2026-03-27 06:34:51.686298+00	20260314050400_job_portal_schema_update_31426	\N	\N	2026-03-27 06:34:51.678785+00	1
7a44a838-bf96-4a77-8868-c2f5577537d1	47e807ef90c38b60b6e69e03295d16cfe017b610979f2c19edbecc49a8c974a6	2026-03-27 06:34:51.697139+00	20260317041802_add_some_feature_for_user	\N	\N	2026-03-27 06:34:51.687118+00	1
\.


--
-- Name: Application_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."Application_id_seq"', 1, false);


--
-- Name: Company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."Company_id_seq"', 1, false);


--
-- Name: Job_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."Job_id_seq"', 1, false);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."User_id_seq"', 1, false);


--
-- Name: Application Application_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_pkey" PRIMARY KEY (id);


--
-- Name: Company Company_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Company"
    ADD CONSTRAINT "Company_pkey" PRIMARY KEY (id);


--
-- Name: Job Job_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Job"
    ADD CONSTRAINT "Job_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Application_jobId_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Application_jobId_idx" ON public."Application" USING btree ("jobId");


--
-- Name: Application_userId_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Application_userId_idx" ON public."Application" USING btree ("userId");


--
-- Name: Application_userId_jobId_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Application_userId_jobId_key" ON public."Application" USING btree ("userId", "jobId");


--
-- Name: Company_email_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Company_email_key" ON public."Company" USING btree (email);


--
-- Name: Job_companyId_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Job_companyId_idx" ON public."Job" USING btree ("companyId");


--
-- Name: Job_jobType_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Job_jobType_idx" ON public."Job" USING btree ("jobType");


--
-- Name: Job_location_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Job_location_idx" ON public."Job" USING btree (location);


--
-- Name: Job_status_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Job_status_idx" ON public."Job" USING btree (status);


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Application Application_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public."Job"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Application Application_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Job Job_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Job"
    ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict qBlM9DQ7PZUQBOwtAM4idKYWTWjuk8itixVzabqoDDd8KJZfxu8B5C2LZA0IMTV

