-- =============================================================================
-- STREAMPLY DATABASE IMPORT FOR SUPABASE
-- Modified version of your PostgreSQL dump for Supabase compatibility
-- =============================================================================

-- Skip database creation and connection (Supabase handles this)
-- DROP DATABASE streamply_dev;
-- CREATE DATABASE streamply_dev WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Polish_Poland.1252';
-- ALTER DATABASE streamply_dev OWNER TO streamply_user;
-- \connect streamply_dev

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

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
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

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    video_id uuid NOT NULL,
    comment text,
    grade numeric(3,1),
    comment_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: series_episodes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.series_episodes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    show_id uuid NOT NULL,
    season integer NOT NULL,
    episode integer NOT NULL,
    episode_name text,
    description text,
    video_url text,
    thumbnail_url text,
    cinematic_thumbnail text
);

--
-- Name: trusted_devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.trusted_devices (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
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

--
-- Name: user_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_likes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    video_id uuid NOT NULL
);

--
-- Name: user_watching; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_watching (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    show_id uuid NOT NULL,
    time_watched integer NOT NULL,
    season integer,
    episode integer,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
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

--
-- Name: videos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.videos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
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

--
-- Name: user_video_views; Type: TABLE; Schema: public; Owner: postgres
-- Table for tracking video view analytics (referenced by increment_video_views function)
--

CREATE TABLE IF NOT EXISTS public.user_video_views (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    video_id uuid NOT NULL,
    user_id uuid,
    ip_address inet,
    viewed_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create primary keys
ALTER TABLE ONLY public.refresh_tokens ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.series_episodes ADD CONSTRAINT series_episodes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.trusted_devices ADD CONSTRAINT trusted_devices_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_likes ADD CONSTRAINT user_likes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_watching ADD CONSTRAINT user_watching_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.videos ADD CONSTRAINT videos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_video_views ADD CONSTRAINT user_video_views_pkey PRIMARY KEY (id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_video_id_grade ON public.reviews USING btree (video_id, grade) WHERE (grade IS NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_jti_key ON public.refresh_tokens USING btree (jti);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON public.refresh_tokens USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS trusted_devices_user_id_device_fingerprint_key ON public.trusted_devices USING btree (user_id, device_fingerprint);
CREATE UNIQUE INDEX IF NOT EXISTS user_likes_user_id_video_id_key ON public.user_likes USING btree (user_id, video_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_watching_user_id_show_id_key ON public.user_watching USING btree (user_id, show_id);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON public.users USING btree (email);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON public.users USING btree (username);
CREATE INDEX IF NOT EXISTS user_video_views_video_id_idx ON public.user_video_views USING btree (video_id);
CREATE INDEX IF NOT EXISTS user_video_views_user_id_idx ON public.user_video_views USING btree (user_id);
CREATE INDEX IF NOT EXISTS user_video_views_ip_address_idx ON public.user_video_views USING btree (ip_address);

-- =============================================================================
-- FUNCTIONS (Created after tables to avoid dependency issues)
-- =============================================================================

--
-- Name: increment_video_views(uuid, uuid, inet); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.increment_video_views(p_video_id uuid, p_user_id uuid DEFAULT NULL::uuid, p_ip_address inet DEFAULT NULL::inet) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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

--
-- Name: recalculate_all_video_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.recalculate_all_video_stats() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
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

--
-- Name: update_video_review_stats_delete(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_video_review_stats_delete() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
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

--
-- Name: update_video_review_stats_insert(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_video_review_stats_insert() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
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

--
-- Name: update_video_review_stats_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_video_review_stats_update() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
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

-- =============================================================================
-- FOREIGN KEY CONSTRAINTS (Created after functions, before data)
-- =============================================================================

-- =============================================================================
-- FOREIGN KEY CONSTRAINTS (Created after functions, before data)
-- =============================================================================

-- Create foreign keys
ALTER TABLE ONLY public.refresh_tokens ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY public.series_episodes ADD CONSTRAINT series_episodes_show_id_fkey FOREIGN KEY (show_id) REFERENCES public.videos(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY public.trusted_devices ADD CONSTRAINT trusted_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.user_likes ADD CONSTRAINT user_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY public.user_likes ADD CONSTRAINT user_likes_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY public.user_watching ADD CONSTRAINT user_watching_show_id_fkey FOREIGN KEY (show_id) REFERENCES public.videos(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY public.user_watching ADD CONSTRAINT user_watching_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY public.user_video_views ADD CONSTRAINT user_video_views_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.user_video_views ADD CONSTRAINT user_video_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- =============================================================================
-- DATA INSERTION (Insert data before creating triggers)
-- =============================================================================
INSERT INTO public.users (id, username, fullname, password, email, birthdate, confirmed, register_token, register_date, last_login, account_type, stripe_customer_id, avatar_url, created_at) VALUES
('4b27731a-76a3-468b-82c2-38e7d1f5bd50', 'Vanity', 'Pawel Satora', '$2a$10$kw3.PLp0vwryN6zdz.Km6eJ8eGLeRPz6CMgAJQlbH5nb.7uGaYBBy', 'pawelsatora@gmail.com', '2001-06-29 00:00:00', true, '516323852c827634201014912c9b9204', '2025-07-31 00:30:44.991', '2025-08-15 01:13:32.622', 3, 'cus_SmJ0JmzJ63vTfm', 'avatars/Vanity_1753921907514.png', '2025-07-31 00:30:44.991')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.videos (id, title, type, genre, production_year, production_country, director, tags, descr, thumbnail, cinematic_thumbnail, video_url, thumbnail_url, grade, reviews_count, views, link, blocked_reviews, created_at) VALUES
('ab36d8f7-1e51-4232-b4ba-6782e97235e9', 'Drumming', 'film', 'Documentary', 2022, 'Poland', 'Freepik', 'drumming,', 'In a city that never sleeps, the sound of rhythm pulses through the streets. Drumming follows the story of Lena Cruz, a fiercely talented street percussionist whose life revolves around the hypnotic beats she creates from discarded objects and broken instruments. When an elite conservatory invites her to audition for their prestigious music program, Lena is thrust into a world where perfection is prized over passion.', 'https://f003.backblazeb2.com/file/streamply-bucket-prod/thumbnails/drumming-1157965d-3507-48b6-9b9d-796f05c4b6d0.jpg?Authorization=3_20250731003343_04a575e440c5ea97c735361d_111dd1ddf39874530e7625e3e663610c6ac21ec6_003_20250807003343_0060_dnld', 'https://f003.backblazeb2.com/file/streamply-bucket-prod/cinematic-thumbnails/drumming-1157965d-3507-48b6-9b9d-796f05c4b6d0.jpg?Authorization=3_20250731003343_f66ed2a1192da9a7c0d9aea3_ec3cb2004b86459e379bfd065239aa626f88ec11_003_20250807003343_0070_dnld', NULL, NULL, 9.0, 1, 4, 'https://f003.backblazeb2.com/file/streamply-bucket-prod/movies/drumming-1157965d-3507-48b6-9b9d-796f05c4b6d0/playlist.m3u8?Authorization=3_20250731003343_d9e820e2f3108b6ed93e1564_4229e455705fcc3a3ffd606f4852e82eb3c5eb22_003_20250807003343_0066_dnld', false, '2025-07-31 00:33:42.369'),
('d9162835-13e1-49f1-863d-de76861d5664', 'White Noise', 'film', 'Documentary, Music', 2022, 'Poland', 'Freepik', 'Music, noise', 'White Noise is a 2022 absurdist comedy‑drama directed by Noah Baumbach, adapted from Don DeLillo''s 1985 novel. The film stars Adam Driver as Jack Gladney, Greta Gerwig as his wife Babette, and Don Cheadle as Murray Siskind. Set in the 1980s American Midwest, it explores themes of death, consumerism, academic absurdity, and existential anxiety under the constant hum of modern media noise.', 'https://f003.backblazeb2.com/file/streamply-bucket-prod/thumbnails/white-noise-59e6ed9b-7ef7-49f1-a524-02e12b37bf4f.jpg?Authorization=3_20250731011200_c0c46678b9bf255d706c119f_62f1012ebd35416d718724013cfb4c1f5dca88cd_003_20250807011200_0063_dnld', 'https://f003.backblazeb2.com/file/streamply-bucket-prod/cinematic-thumbnails/white-noise-59e6ed9b-7ef7-49f1-a524-02e12b37bf4f.jpg?Authorization=3_20250731011200_b4624ca274f8d7f0c98223f9_39189a450d631f93a4ff332736c904568370a878_003_20250807011200_0073_dnld', NULL, NULL, 0.0, 0, 39, 'https://f003.backblazeb2.com/file/streamply-bucket-prod/movies/white-noise-59e6ed9b-7ef7-49f1-a524-02e12b37bf4f/playlist.m3u8?Authorization=3_20250731011200_c2fa41f890abf762de35e885_50fd0b17ff9cc1ef44764598a7f4e633dbac30a1_003_20250807011200_0069_dnld', false, '2025-07-31 01:11:58.892')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.reviews (id, user_id, video_id, comment, grade, comment_date) VALUES
('9504e1c3-115e-49a0-addc-5204920fa5fb', '4b27731a-76a3-468b-82c2-38e7d1f5bd50', 'ab36d8f7-1e51-4232-b4ba-6782e97235e9', 'Nice movie!', 9.0, '2025-07-31 00:54:22.809')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_likes (id, user_id, video_id) VALUES
('01ba944f-8cb8-40b8-abaf-0b0e42a0aede', '4b27731a-76a3-468b-82c2-38e7d1f5bd50', 'ab36d8f7-1e51-4232-b4ba-6782e97235e9'),
('78ab64dd-a05e-499c-9b4c-39406c0becb0', '4b27731a-76a3-468b-82c2-38e7d1f5bd50', 'd9162835-13e1-49f1-863d-de76861d5664')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_watching (id, user_id, show_id, time_watched, season, episode, updated_at) VALUES
('50bc2f6b-3e66-4414-89ea-01c2ead4b52f', '4b27731a-76a3-468b-82c2-38e7d1f5bd50', 'd9162835-13e1-49f1-863d-de76861d5664', 1, NULL, NULL, '2025-08-14 00:05:52.667')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.trusted_devices (id, user_id, device_fingerprint, device_name, device_type, browser_name, os_name, last_used, first_seen, last_ip, last_location, is_active) VALUES
('29ec7dc7-ccc3-4296-9c2c-03e081802baa', '4b27731a-76a3-468b-82c2-38e7d1f5bd50', '668026179f6667df7e2bfa4372108f933d3cc261a3441f0e0f82da8f20708669', 'Chrome on Windows', 'desktop', 'Chrome', 'Windows', '2025-08-15 01:13:32.614', '2025-08-08 21:39:33.688', '46.205.196.161', 'Warsaw, PL', true)
ON CONFLICT (id) DO NOTHING;

-- Note: Refresh tokens are sensitive and expire, so we're skipping them
-- They will be regenerated when users log in again

-- =============================================================================
-- TRIGGERS (Created at the very end to avoid execution during data insertion)
-- =============================================================================

-- Create triggers for automatic review statistics updates
DROP TRIGGER IF EXISTS update_video_stats_on_review_delete ON public.reviews;
CREATE TRIGGER update_video_stats_on_review_delete AFTER DELETE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_video_review_stats_delete();

DROP TRIGGER IF EXISTS update_video_stats_on_review_insert ON public.reviews;
CREATE TRIGGER update_video_stats_on_review_insert AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_video_review_stats_insert();

DROP TRIGGER IF EXISTS update_video_stats_on_review_update ON public.reviews;
CREATE TRIGGER update_video_stats_on_review_update AFTER UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_video_review_stats_update();

COMMIT;
