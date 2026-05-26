WITH new_scores(name, s, m, f) AS (
  VALUES
    ('강예나'::text, 50, 30, 20),
    ('김가흔', 50, 15, 20),
    ('김은채', 50, 30, 20),
    ('김태준', 50, 30, 20),
    ('박재현', 50, 15, 20),
    ('손연재', 50, 15, 15),
    ('윤준원', 50, 30, 20),
    ('최지유', 50, 30, 20),
    ('배정윤', 50, 30, 20),
    ('심수윤', 50, 30, 20),
    ('한설아', 50, 15, 20),
    ('김가인', 50, 30, 20),
    ('강가인', 50, 15, 20),
    ('권민유', 50, 30, 20),
    ('최유주', 50, 15, 20),
    ('김도현', 50, 15, 20),
    ('김시윤', 50, 15, 20),
    ('김지우', 50, 30, 20),
    ('김호진', 50, 15, 20),
    ('나지성', 50, 15, 20),
    ('문지유', 50, 15, 20),
    ('박지우', 50, 30, 20),
    ('서지우', 50, 30, 15),
    ('송민건', 50, 15, 10),
    ('오수연', 50, 30, 20),
    ('우정훈', 50, 15, 20),
    ('윤서준', 50, 15, 20),
    ('이유빈', 50, 30, 20),
    ('이홍윤', 50, 30, 20),
    ('임다은', 50, 30, 20),
    ('박선율', 50, 30, 20),
    ('남희수', 50, 30, 20),
    ('양은정', 50, 15, 20),
    ('문성민', 50, 30, 20),
    ('한유찬', 50, 30, 20)
),
matched AS (
  SELECT DISTINCT ON (cs.id)
    c.id AS cert_id, ns.s, ns.m, ns.f, cs.name
  FROM new_scores ns
  JOIN public.cert_students cs ON cs.name = ns.name
  JOIN public.cafe_certifications c ON c.assigned_student_id = cs.id
  WHERE (c.posted_at AT TIME ZONE 'Asia/Seoul')::date BETWEEN DATE '2026-05-20' AND DATE '2026-05-23'
  ORDER BY cs.id, c.posted_at ASC
)
UPDATE public.cafe_certifications c
SET submit_score       = m.s::smallint,
    mission_score      = m.m::smallint,
    fidelity_score     = m.f::smallint,
    completeness_score = (m.s + m.m + m.f)::numeric,
    compliance_score   = NULL
FROM matched m
WHERE c.id = m.cert_id
RETURNING c.id, m.name, c.completeness_score;
