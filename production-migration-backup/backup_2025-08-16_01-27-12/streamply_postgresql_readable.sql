--
-- PostgreSQL database dump
--

-- Dumped from database version 16.1
-- Dumped by pg_dump version 16.1

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

DROP DATABASE streamply_dev;
--
-- Name: streamply_dev; Type: DATABASE; Schema: -; Owner: streamply_user
--

CREATE DATABASE streamply_dev WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Polish_Poland.1252';


ALTER DATABASE streamply_dev OWNER TO streamply_user;

\connect streamply_dev

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
-- Name: increment_video_views(uuid, uuid, inet); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_video_views(p_video_id uuid, p_user_id uuid DEFAULT NULL::uuid, p_ip_address inet DEFAULT NULL::inet) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    recent_view_exists BOOLEAN := FALSE;
    time_threshold TIMESTAMP;
BEGIN
    -- Set time threshold to 1 hour ago
    time_threshold := NOW() - INTERVAL '1 hour';
    
    -- Check for recent views from same user/IP to prevent spam
    IF p_user_id IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM user_video_views 
            WHERE video_id = p_video_id 
            AND user_id = p_user_id 
            AND viewed_at > time_threshold
        ) INTO recent_view_exists;
    ELSIF p_ip_address IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM user_video_views 
            WHERE video_id = p_video_id 
            AND ip_address = p_ip_address 
            AND viewed_at > time_threshold
        ) INTO recent_view_exists;
    END IF;
    
    -- Only increment if no recent view found
    IF NOT recent_view_exists THEN
        -- Increment the view count
        UPDATE videos 
        SET views = COALESCE(views, 0) + 1 
        WHERE id = p_video_id;
        
        -- Log the view (if table exists)
        BEGIN
            INSERT INTO user_video_views (video_id, user_id, ip_address, viewed_at)
            VALUES (p_video_id, p_user_id, p_ip_address, NOW());
        EXCEPTION WHEN OTHERS THEN
            -- Ignore if table doesn't exist, just increment the counter
            NULL;
        END;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;


ALTER FUNCTION public.increment_video_views(p_video_id uuid, p_user_id uuid, p_ip_address inet) OWNER TO postgres;

--
-- Name: recalculate_all_video_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.recalculate_all_video_stats() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    UPDATE videos 
    SET 
        reviews_count = COALESCE(review_counts.count, 0),
        grade = COALESCE(review_grades.avg_grade, 0.00)
    FROM (
        SELECT video_id, COUNT(*) as count
        FROM reviews 
        GROUP BY video_id
    ) review_counts
    LEFT JOIN (
        SELECT video_id, ROUND(AVG(grade), 2) as avg_grade
        FROM reviews 
        WHERE grade IS NOT NULL
        GROUP BY video_id
    ) review_grades ON review_counts.video_id = review_grades.video_id
    WHERE videos.id = review_counts.video_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;


ALTER FUNCTION public.recalculate_all_video_stats() OWNER TO postgres;

--
-- Name: update_video_review_stats_delete(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_video_review_stats_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE videos 
    SET 
        reviews_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE video_id = OLD.video_id
        ),
        grade = (
            SELECT COALESCE(ROUND(AVG(grade), 2), 0.00)
            FROM reviews 
            WHERE video_id = OLD.video_id AND grade IS NOT NULL
        )
    WHERE id = OLD.video_id;
    
    RETURN OLD;
END;
$$;


ALTER FUNCTION public.update_video_review_stats_delete() OWNER TO postgres;

--
-- Name: update_video_review_stats_insert(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_video_review_stats_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE videos 
    SET 
        reviews_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE video_id = NEW.video_id
        ),
        grade = (
            SELECT COALESCE(ROUND(AVG(grade), 2), 0.00)
            FROM reviews 
            WHERE video_id = NEW.video_id AND grade IS NOT NULL
        )
    WHERE id = NEW.video_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_video_review_stats_insert() OWNER TO postgres;

--
-- Name: update_video_review_stats_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_video_review_stats_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Only update if the grade changed or video_id changed
    IF OLD.grade IS DISTINCT FROM NEW.grade OR OLD.video_id IS DISTINCT FROM NEW.video_id THEN
        -- Update old video if video_id changed
        IF OLD.video_id IS DISTINCT FROM NEW.video_id THEN
            UPDATE videos 
            SET 
                reviews_count = (
                    SELECT COUNT(*) 
                    FROM reviews 
                    WHERE video_id = OLD.video_id
                ),
                grade = (
                    SELECT COALESCE(ROUND(AVG(grade), 2), 0.00)
                    FROM reviews 
                    WHERE video_id = OLD.video_id AND grade IS NOT NULL
                )
            WHERE id = OLD.video_id;
        END IF;
        
        -- Update new video
        UPDATE videos 
        SET 
            reviews_count = (
                SELECT COUNT(*) 
                FROM reviews 
                WHERE video_id = NEW.video_id
            ),
            grade = (
                SELECT COALESCE(ROUND(AVG(grade), 2), 0.00)
                FROM reviews 
                WHERE video_id = NEW.video_id AND grade IS NOT NULL
            )
        WHERE id = NEW.video_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_video_review_stats_update() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: streamply_user
--

CREATE TABLE public.refresh_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    jti text NOT NULL,
    device_fingerprint text,
    user_agent text,
    ip_address text,
    expires_at timestamp(3) without time zone NOT NULL,
    revoked_at timestamp(3) without time zone,
    replaced_by text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO streamply_user;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: streamply_user
--

CREATE TABLE public.reviews (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    video_id uuid NOT NULL,
    comment text,
    grade numeric(3,1),
    comment_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.reviews OWNER TO streamply_user;

--
-- Name: series_episodes; Type: TABLE; Schema: public; Owner: streamply_user
--

CREATE TABLE public.series_episodes (
    id uuid NOT NULL,
    show_id uuid NOT NULL,
    season integer NOT NULL,
    episode integer NOT NULL,
    episode_name text,
    description text,
    video_url text,
    thumbnail_url text,
    cinematic_thumbnail text
);


ALTER TABLE public.series_episodes OWNER TO streamply_user;

--
-- Name: trusted_devices; Type: TABLE; Schema: public; Owner: streamply_user
--

CREATE TABLE public.trusted_devices (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    device_fingerprint text NOT NULL,
    device_name text NOT NULL,
    device_type text NOT NULL,
    browser_name text,
    os_name text,
    last_used timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    first_seen timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_ip text,
    last_location text,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.trusted_devices OWNER TO streamply_user;

--
-- Name: user_likes; Type: TABLE; Schema: public; Owner: streamply_user
--

CREATE TABLE public.user_likes (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    video_id uuid NOT NULL
);


ALTER TABLE public.user_likes OWNER TO streamply_user;

--
-- Name: user_watching; Type: TABLE; Schema: public; Owner: streamply_user
--

CREATE TABLE public.user_watching (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    show_id uuid NOT NULL,
    time_watched integer NOT NULL,
    season integer,
    episode integer,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_watching OWNER TO streamply_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: streamply_user
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    username text NOT NULL,
    fullname text,
    password text NOT NULL,
    email text NOT NULL,
    birthdate timestamp(3) without time zone,
    confirmed boolean DEFAULT false NOT NULL,
    register_token text,
    register_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login timestamp(3) without time zone,
    account_type integer DEFAULT 1 NOT NULL,
    stripe_customer_id text,
    avatar_url text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.users OWNER TO streamply_user;

--
-- Name: videos; Type: TABLE; Schema: public; Owner: streamply_user
--

CREATE TABLE public.videos (
    id uuid NOT NULL,
    title text NOT NULL,
    type text NOT NULL,
    genre text,
    production_year integer,
    production_country text,
    director text,
    tags text,
    descr text,
    thumbnail text,
    cinematic_thumbnail text,
    video_url text,
    thumbnail_url text,
    grade numeric(3,1),
    reviews_count integer DEFAULT 0 NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    link text,
    blocked_reviews boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.videos OWNER TO streamply_user;

--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: streamply_user
--

COPY public.refresh_tokens (id, user_id, token_hash, jti, device_fingerprint, user_agent, ip_address, expires_at, revoked_at, replaced_by, created_at) FROM stdin;
12f61c02-33e4-4819-8886-d382b7988ebd	4b27731a-76a3-468b-82c2-38e7d1f5bd50	$2a$10$qvfvdbAKH77l2hwrovKP8e8XwwSomWTLnjv4s.9LJ5kTJRuv3.fDy	39538c3d-2e79-4d1c-988a-d56bcf95d432	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	::1	2025-09-12 22:51:16.838	\N	\N	2025-08-13 22:51:16.863
08afa6c2-0191-4622-a859-4667d7976e58	4b27731a-76a3-468b-82c2-38e7d1f5bd50	$2a$10$RFBrUC7GNMP7awOluWU/zudViA1jjg8IKrH1RH0G9cMig/srpbdj6	e52dde00-fde3-4228-9cff-f8b28b8128b2	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	46.205.196.161	2025-09-12 23:02:02.419	\N	\N	2025-08-13 23:02:02.549
05f6a630-40c6-41df-809c-65a7d7ae417f	4b27731a-76a3-468b-82c2-38e7d1f5bd50	$2a$10$MavJfhLG81qhSYN63NT12uXlc//xJGx.LzpRqf0HO4Wk1LUZpiIq2	5f79edfb-52dc-414b-80be-6ea31d09aa57	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	46.205.196.161	2025-09-12 23:02:21.059	\N	\N	2025-08-13 23:02:21.06
33b71fb2-7be2-4e70-ba08-201621ff47c9	4b27731a-76a3-468b-82c2-38e7d1f5bd50	$2a$10$cPnhhULSRucf5xraID7Gb.75TNMHaJWVJu.dMgNyIv2tPVIBP.jV6	1e215194-a7c4-47a3-9528-73f344e3e79c	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	46.205.196.161	2025-09-12 23:18:01.036	\N	\N	2025-08-13 23:18:01.037
b2f826c2-5048-4b30-adb6-51dbd6bbf4f1	4b27731a-76a3-468b-82c2-38e7d1f5bd50	$2a$10$Pu.EpHKWSXLR4wM8SjVcJ.v5D1NyreJB4hklmr5pV8HxSw6rrFqT2	fd0b4bd1-be7d-4344-acda-507219db3541	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	46.205.196.161	2025-09-12 23:39:56.474	\N	\N	2025-08-13 23:39:56.497
f7f250c9-62e5-4185-8dd3-c517e04a1d3c	4b27731a-76a3-468b-82c2-38e7d1f5bd50	$2a$10$W79qejLetQnmfaIHQ.qG6OGEXy6RtOI4YG3YrFUG4dun/qcopB1q6	7a1140e1-e261-4329-8475-828306def792	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	46.205.196.161	2025-09-13 00:01:42.692	\N	\N	2025-08-14 00:01:42.716
03b880ff-77e2-47b5-8751-ac159765aff8	4b27731a-76a3-468b-82c2-38e7d1f5bd50	$2a$10$AbKQmfgmGREFL4C6loXEuOF/OKYBCOSw0KS7PmrHR/XXHAw4Ww2ay	7cc6684c-543c-420b-aab0-13371e8be6b7	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	46.205.196.161	2025-09-14 00:00:49.877	\N	\N	2025-08-15 00:00:49.906
af744024-ed89-4619-951c-3544a929b987	4b27731a-76a3-468b-82c2-38e7d1f5bd50	$2a$10$20lyyCuHWImu2QcDOsknueWHl0k8WvTRcaONAbN7wGCOCPqaOJ9Se	697d56e0-a5d8-41f7-b865-49d74e3802ad	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	46.205.196.161	2025-09-14 00:29:40.619	\N	\N	2025-08-15 00:29:40.646
ad166f92-d242-4bee-9aef-cc69f696b3c9	4b27731a-76a3-468b-82c2-38e7d1f5bd50	$2a$10$BCejs9mZqbu6iAREfWgkCeergbTBmztFoToevEMB6abiUfblnelk6	8502196b-7269-4f84-aba1-e69593ded426	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	46.205.196.161	2025-09-14 00:41:44.952	\N	\N	2025-08-15 00:41:44.977
207e707a-e570-4e3c-9944-5c6ea16d155a	4b27731a-76a3-468b-82c2-38e7d1f5bd50	$2a$10$eVy5g2Llmv4ZNSC2yr5hyuPgY5mz4hdYHQZwOrSBRaOCxd8/hjmoe	36a8c420-7bc4-4790-b5f1-8ddb34d3b2ec	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	46.205.196.161	2025-09-14 00:46:32.898	\N	\N	2025-08-15 00:46:32.923
cc4c9fcb-fcd7-48a3-bbc3-0d77449aa13a	4b27731a-76a3-468b-82c2-38e7d1f5bd50	$2a$10$t8YbrdbGCI4M.owImUX0/.JSB9ojCsn4KSuI957VBQPYd0EhugLWO	14f3cc43-9308-4a28-8a79-d6aa6fe58635	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	46.205.196.161	2025-09-14 00:54:14.624	\N	\N	2025-08-15 00:54:14.65
ee68f7d3-7335-4516-a6ca-29b08c75b317	4b27731a-76a3-468b-82c2-38e7d1f5bd50	$2a$10$2rW1FpPcTfI52otsLcREIOyoBR9HtSOcR2PSCDF.wQL2dy7AvVfSS	77b3ac18-f289-4278-9a4d-37cfd10b30a2	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	46.205.196.161	2025-09-14 01:00:38.366	\N	\N	2025-08-15 01:00:38.39
1e4ad3f4-d044-4720-af54-6e6c883d20c8	4b27731a-76a3-468b-82c2-38e7d1f5bd50	$2a$10$UdwjiOke3Jdl8zCiEBaCceWwdkyJeaYyXUtkUHij1jHrndO2Xlyy6	71580c96-cf10-4711-ad65-0e5c15c6fde6	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	46.205.196.161	2025-09-14 01:05:14.436	\N	\N	2025-08-15 01:05:14.46
1bef3931-a81a-47fe-a3d9-09638c905375	4b27731a-76a3-468b-82c2-38e7d1f5bd50	$2a$10$.DTEvHwrvjcLUL6hQOgZFuEi61p7obxD6sHLQpKiQ3fkjTOUnv8pC	1a676006-0b7e-472e-89e6-db35e6349ac4	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	46.205.196.161	2025-09-14 01:13:32.673	\N	\N	2025-08-15 01:13:32.698
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: streamply_user
--

COPY public.reviews (id, user_id, video_id, comment, grade, comment_date) FROM stdin;
9504e1c3-115e-49a0-addc-5204920fa5fb	4b27731a-76a3-468b-82c2-38e7d1f5bd50	ab36d8f7-1e51-4232-b4ba-6782e97235e9	Nice movie!	9.0	2025-07-31 00:54:22.809
\.


--
-- Data for Name: series_episodes; Type: TABLE DATA; Schema: public; Owner: streamply_user
--

COPY public.series_episodes (id, show_id, season, episode, episode_name, description, video_url, thumbnail_url, cinematic_thumbnail) FROM stdin;
\.


--
-- Data for Name: trusted_devices; Type: TABLE DATA; Schema: public; Owner: streamply_user
--

COPY public.trusted_devices (id, user_id, device_fingerprint, device_name, device_type, browser_name, os_name, last_used, first_seen, last_ip, last_location, is_active) FROM stdin;
29ec7dc7-ccc3-4296-9c2c-03e081802baa	4b27731a-76a3-468b-82c2-38e7d1f5bd50	668026179f6667df7e2bfa4372108f933d3cc261a3441f0e0f82da8f20708669	Chrome on Windows	desktop	Chrome	Windows	2025-08-15 01:13:32.614	2025-08-08 21:39:33.688	46.205.196.161	Warsaw, PL	t
\.


--
-- Data for Name: user_likes; Type: TABLE DATA; Schema: public; Owner: streamply_user
--

COPY public.user_likes (id, user_id, video_id) FROM stdin;
01ba944f-8cb8-40b8-abaf-0b0e42a0aede	4b27731a-76a3-468b-82c2-38e7d1f5bd50	ab36d8f7-1e51-4232-b4ba-6782e97235e9
78ab64dd-a05e-499c-9b4c-39406c0becb0	4b27731a-76a3-468b-82c2-38e7d1f5bd50	d9162835-13e1-49f1-863d-de76861d5664
\.


--
-- Data for Name: user_watching; Type: TABLE DATA; Schema: public; Owner: streamply_user
--

COPY public.user_watching (id, user_id, show_id, time_watched, season, episode, updated_at) FROM stdin;
50bc2f6b-3e66-4414-89ea-01c2ead4b52f	4b27731a-76a3-468b-82c2-38e7d1f5bd50	d9162835-13e1-49f1-863d-de76861d5664	1	\N	\N	2025-08-14 00:05:52.667
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: streamply_user
--

COPY public.users (id, username, fullname, password, email, birthdate, confirmed, register_token, register_date, last_login, account_type, stripe_customer_id, avatar_url, created_at) FROM stdin;
4b27731a-76a3-468b-82c2-38e7d1f5bd50	Vanity	Pawel Satora	$2a$10$kw3.PLp0vwryN6zdz.Km6eJ8eGLeRPz6CMgAJQlbH5nb.7uGaYBBy	pawelsatora@gmail.com	2001-06-29 00:00:00	t	516323852c827634201014912c9b9204	2025-07-31 00:30:44.991	2025-08-15 01:13:32.622	3	cus_SmJ0JmzJ63vTfm	avatars/Vanity_1753921907514.png	2025-07-31 00:30:44.991
\.


--
-- Data for Name: videos; Type: TABLE DATA; Schema: public; Owner: streamply_user
--

COPY public.videos (id, title, type, genre, production_year, production_country, director, tags, descr, thumbnail, cinematic_thumbnail, video_url, thumbnail_url, grade, reviews_count, views, link, blocked_reviews, created_at) FROM stdin;
ab36d8f7-1e51-4232-b4ba-6782e97235e9	Drumming	film	Documentary	2022	Poland	Freepik	drumming,	In a city that never sleeps, the sound of rhythm pulses through the streets. Drumming follows the story of Lena Cruz, a fiercely talented street percussionist whose life revolves around the hypnotic beats she creates from discarded objects and broken instruments. When an elite conservatory invites her to audition for their prestigious music program, Lena is thrust into a world where perfection is prized over passion.	https://f003.backblazeb2.com/file/streamply-bucket-prod/thumbnails/drumming-1157965d-3507-48b6-9b9d-796f05c4b6d0.jpg?Authorization=3_20250731003343_04a575e440c5ea97c735361d_111dd1ddf39874530e7625e3e663610c6ac21ec6_003_20250807003343_0060_dnld	https://f003.backblazeb2.com/file/streamply-bucket-prod/cinematic-thumbnails/drumming-1157965d-3507-48b6-9b9d-796f05c4b6d0.jpg?Authorization=3_20250731003343_f66ed2a1192da9a7c0d9aea3_ec3cb2004b86459e379bfd065239aa626f88ec11_003_20250807003343_0070_dnld	\N	\N	9.0	1	4	https://f003.backblazeb2.com/file/streamply-bucket-prod/movies/drumming-1157965d-3507-48b6-9b9d-796f05c4b6d0/playlist.m3u8?Authorization=3_20250731003343_d9e820e2f3108b6ed93e1564_4229e455705fcc3a3ffd606f4852e82eb3c5eb22_003_20250807003343_0066_dnld	f	2025-07-31 00:33:42.369
d9162835-13e1-49f1-863d-de76861d5664	White Noise	film	Documentary, Music	2022	Poland	Freepik	Music, noise	White Noise is a 2022 absurdist comedy‑drama directed by Noah Baumbach, adapted from Don DeLillo’s 1985 novel. The film stars Adam Driver as Jack Gladney, Greta Gerwig as his wife Babette, and Don Cheadle as Murray Siskind. Set in the 1980s American Midwest, it explores themes of death, consumerism, academic absurdity, and existential anxiety under the constant hum of modern media noise.	https://f003.backblazeb2.com/file/streamply-bucket-prod/thumbnails/white-noise-59e6ed9b-7ef7-49f1-a524-02e12b37bf4f.jpg?Authorization=3_20250731011200_c0c46678b9bf255d706c119f_62f1012ebd35416d718724013cfb4c1f5dca88cd_003_20250807011200_0063_dnld	https://f003.backblazeb2.com/file/streamply-bucket-prod/cinematic-thumbnails/white-noise-59e6ed9b-7ef7-49f1-a524-02e12b37bf4f.jpg?Authorization=3_20250731011200_b4624ca274f8d7f0c98223f9_39189a450d631f93a4ff332736c904568370a878_003_20250807011200_0073_dnld	\N	\N	0.0	0	39	https://f003.backblazeb2.com/file/streamply-bucket-prod/movies/white-noise-59e6ed9b-7ef7-49f1-a524-02e12b37bf4f/playlist.m3u8?Authorization=3_20250731011200_c2fa41f890abf762de35e885_50fd0b17ff9cc1ef44764598a7f4e633dbac30a1_003_20250807011200_0069_dnld	f	2025-07-31 01:11:58.892
\.


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: streamply_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: streamply_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: series_episodes series_episodes_pkey; Type: CONSTRAINT; Schema: public; Owner: streamply_user
--

ALTER TABLE ONLY public.series_episodes
    ADD CONSTRAINT series_episodes_pkey PRIMARY KEY (id);


--
-- Name: trusted_devices trusted_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: streamply_user
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_pkey PRIMARY KEY (id);


--
-- Name: user_likes user_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: streamply_user
--

ALTER TABLE ONLY public.user_likes
    ADD CONSTRAINT user_likes_pkey PRIMARY KEY (id);


--
-- Name: user_watching user_watching_pkey; Type: CONSTRAINT; Schema: public; Owner: streamply_user
--

ALTER TABLE ONLY public.user_watching
    ADD CONSTRAINT user_watching_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: streamply_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: videos videos_pkey; Type: CONSTRAINT; Schema: public; Owner: streamply_user
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_pkey PRIMARY KEY (id);


--
-- Name: idx_reviews_video_id_grade; Type: INDEX; Schema: public; Owner: streamply_user
--

CREATE INDEX idx_reviews_video_id_grade ON public.reviews USING btree (video_id, grade) WHERE (grade IS NOT NULL);


--
-- Name: refresh_tokens_jti_key; Type: INDEX; Schema: public; Owner: streamply_user
--

CREATE UNIQUE INDEX refresh_tokens_jti_key ON public.refresh_tokens USING btree (jti);


--
-- Name: refresh_tokens_user_id_idx; Type: INDEX; Schema: public; Owner: streamply_user
--

CREATE INDEX refresh_tokens_user_id_idx ON public.refresh_tokens USING btree (user_id);


--
-- Name: trusted_devices_user_id_device_fingerprint_key; Type: INDEX; Schema: public; Owner: streamply_user
--

CREATE UNIQUE INDEX trusted_devices_user_id_device_fingerprint_key ON public.trusted_devices USING btree (user_id, device_fingerprint);


--
-- Name: user_likes_user_id_video_id_key; Type: INDEX; Schema: public; Owner: streamply_user
--

CREATE UNIQUE INDEX user_likes_user_id_video_id_key ON public.user_likes USING btree (user_id, video_id);


--
-- Name: user_watching_user_id_show_id_key; Type: INDEX; Schema: public; Owner: streamply_user
--

CREATE UNIQUE INDEX user_watching_user_id_show_id_key ON public.user_watching USING btree (user_id, show_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: streamply_user
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: streamply_user
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: reviews update_video_stats_on_review_delete; Type: TRIGGER; Schema: public; Owner: streamply_user
--

CREATE TRIGGER update_video_stats_on_review_delete AFTER DELETE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_video_review_stats_delete();


--
-- Name: reviews update_video_stats_on_review_insert; Type: TRIGGER; Schema: public; Owner: streamply_user
--

CREATE TRIGGER update_video_stats_on_review_insert AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_video_review_stats_insert();


--
-- Name: reviews update_video_stats_on_review_update; Type: TRIGGER; Schema: public; Owner: streamply_user
--

CREATE TRIGGER update_video_stats_on_review_update AFTER UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_video_review_stats_update();


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: streamply_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: streamply_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reviews reviews_video_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: streamply_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: series_episodes series_episodes_show_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: streamply_user
--

ALTER TABLE ONLY public.series_episodes
    ADD CONSTRAINT series_episodes_show_id_fkey FOREIGN KEY (show_id) REFERENCES public.videos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: trusted_devices trusted_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: streamply_user
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_likes user_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: streamply_user
--

ALTER TABLE ONLY public.user_likes
    ADD CONSTRAINT user_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_likes user_likes_video_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: streamply_user
--

ALTER TABLE ONLY public.user_likes
    ADD CONSTRAINT user_likes_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_watching user_watching_show_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: streamply_user
--

ALTER TABLE ONLY public.user_watching
    ADD CONSTRAINT user_watching_show_id_fkey FOREIGN KEY (show_id) REFERENCES public.videos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_watching user_watching_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: streamply_user
--

ALTER TABLE ONLY public.user_watching
    ADD CONSTRAINT user_watching_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO streamply_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO streamply_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO streamply_user;


--
-- PostgreSQL database dump complete
--

