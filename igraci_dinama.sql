--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4
-- Dumped by pg_dump version 16.4

-- Started on 2024-10-28 02:32:29

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
-- TOC entry 217 (class 1259 OID 16499)
-- Name: igrac_klub; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.igrac_klub (
    prezime character varying(40) NOT NULL,
    ime_kluba character varying(50) NOT NULL
);


ALTER TABLE public.igrac_klub OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 16459)
-- Name: igraci; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.igraci (
    ime character varying(30),
    prezime character varying(30) NOT NULL,
    broj integer,
    pozicija character varying(30),
    datum_rodenja date,
    mjesto_rodenja character varying,
    visina integer,
    broj_nastupa integer,
    broj_golova integer
);


ALTER TABLE public.igraci OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 16472)
-- Name: klubovi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.klubovi (
    ime character varying(40) NOT NULL,
    grad character varying(40)
);


ALTER TABLE public.klubovi OWNER TO postgres;

--
-- TOC entry 4794 (class 0 OID 16499)
-- Dependencies: 217
-- Data for Name: igrac_klub; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.igrac_klub (prezime, ime_kluba) FROM stdin;
Petković	Zagreb
Petković	Neretva
Petković	HAŠK
Petković	Hrvatski dragovoljac
Petković	Catania
Petković	Varese
Petković	Reggiana
Petković	Virtus Entella
Petković	Trapani
Petković	Bologna
Petković	Verona
Teophile-Catherine	Rennes
Teophile-Catherine	Cardiff City
Teophile-Catherine	Saint-Étienne
Nevistić	Rijeka
Nevistić	Varaždin
Nevistić	NŠ Mura
Nevistić	Osijek
Bernauer	Rennes
Bernauer	Concarneau
Bernauer	Le Mans FC
Bernauer	Paris FC 
Torrente	Granada FC
Sučić	-
Mišić	Osijek
Mišić	Rijeka
Mišić	Spezia
Mišić	Sporting
Mišić	PAOK
Ademi	Šibenik
Ademi	Lokomotiva
Kulenović	Legia Warsaw
Kulenović	Rijeka
Kulenović	Juventus U19
Špikić	Hajduk
Špikić	Gorinca
Baturina	-
\.


--
-- TOC entry 4792 (class 0 OID 16459)
-- Dependencies: 215
-- Data for Name: igraci; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.igraci (ime, prezime, broj, pozicija, datum_rodenja, mjesto_rodenja, visina, broj_nastupa, broj_golova) FROM stdin;
Bruno	Petković	9	napadač	1994-09-16	Metković	193	265	83
Martin	Baturina	10	vezni	2003-02-16	Split	172	131	18
Ivan	Nevistić	33	vratar	1998-07-31	Đakovo	193	48	0
Kevin	Teophile-Catherine	28	branič	1989-10-28	Saint-Brieuc	183	191	4
Maxime	Bernauer	6	branič	1998-07-01	Hennebont	186	33	2
Raúl	Torrente	4	branič	2001-09-11	Murcia	193	8	2
Petar	Sučić	25	vezni	2003-10-25	Livno	183	56	3
Josip	Mišić	27	vezni	1994-06-28	Vinkovci	187	187	6
Arijan	Ademi	5	vezni	1991-05-29	Šibenik	184	413	47
Sandro	Kulenović	17	napadač	1999-12-04	Zagreb	191	67	20
Dario	Špikić	77	napadač	1999-03-22	Zagreb	183	132	18
\.


--
-- TOC entry 4793 (class 0 OID 16472)
-- Dependencies: 216
-- Data for Name: klubovi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.klubovi (ime, grad) FROM stdin;
Neretva	Neretva
Zagreb	Zagreb
HAŠK	Zagreb
Hrvatski dragovoljac	Zagreb
Catania	Catania
Varese	Varese
Reggiana	Reggio Emilia
Virtus Entella	Chiavari
Trapani	Trapani
Bologna	Bologna
Verona	Verona
Rijeka	Rijeka
Varaždin	Varaždin
NŠ Mura	Murska Sobota
Osijek	Osijek
Rennes	Rennes
Cardiff City	Cardiff
Saint-Étienne	Saint-Étienne
Concarneau	Concarneau
Le Mans FC	Le Mans
Paris FC 	Paris
Granada FC	Granada
-	-
Spezia	La Spezia
Sporting	Lisbon
PAOK	Thessaloniki
Šibenik	Šibenik
Lokomotiva	Zagreb
Legia Warsaw	Warsaw
Juventus U19	Turin
Hajduk	Split
Gorinca	Velika Gorica
\.


--
-- TOC entry 4646 (class 2606 OID 16537)
-- Name: igrac_klub igrac_klub_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igrac_klub
    ADD CONSTRAINT igrac_klub_pkey PRIMARY KEY (prezime, ime_kluba);


--
-- TOC entry 4642 (class 2606 OID 16471)
-- Name: igraci igraci_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igraci
    ADD CONSTRAINT igraci_pkey PRIMARY KEY (prezime);


--
-- TOC entry 4644 (class 2606 OID 16515)
-- Name: klubovi klubovi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.klubovi
    ADD CONSTRAINT klubovi_pkey PRIMARY KEY (ime);


--
-- TOC entry 4647 (class 2606 OID 16538)
-- Name: igrac_klub igrac_klub_ime_kluba_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igrac_klub
    ADD CONSTRAINT igrac_klub_ime_kluba_fkey FOREIGN KEY (ime_kluba) REFERENCES public.klubovi(ime);


--
-- TOC entry 4648 (class 2606 OID 16531)
-- Name: igrac_klub igrac_klub_prezime_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.igrac_klub
    ADD CONSTRAINT igrac_klub_prezime_fkey FOREIGN KEY (prezime) REFERENCES public.igraci(prezime);


-- Completed on 2024-10-28 02:32:29

--
-- PostgreSQL database dump complete
--

