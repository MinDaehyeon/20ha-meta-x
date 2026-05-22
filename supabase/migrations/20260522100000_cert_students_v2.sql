-- cert_students v2: phone + naver_nicknames[] 추가 + ROSTER2 기준 재시드
-- (기존 63명 데이터 삭제 후 실제 2기 명단 44명으로 교체)

-- 1. 새 컬럼 추가 (기존 naver_nickname TEXT는 레거시로 유지)
ALTER TABLE public.cert_students
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS naver_nicknames TEXT[] DEFAULT '{}';

-- 2. 기존 데이터 삭제 (FK ON DELETE SET NULL → cafe_certifications 무결성 유지됨)
DELETE FROM public.cert_students;

-- 3. ROSTER2 기준으로 재시드 (sort_order = ROSTER2 인덱스)
INSERT INTO public.cert_students (name, phone, sort_order) VALUES
('강예나','010-5463-7565',0),
('김가흔','010-7277-4530',1),
('김은채','010-2565-9756',2),
('김태준','010-7282-5241',3),
('박재현','010-3889-4881',4),
('손연재','010-2658-1189',5),
('윤준원','010-3560-4433',6),
('최지유','010-5913-3385',7),
('배정윤','010-6686-6462',8),
('심수윤','010-2079-0009',9),
('한설아','010-3288-1931',10),
('강가인','010-3952-3253',11),
('권민유','010-4355-2933',12),
('권순혁','010-6220-0745',13),
('최유주','010-7928-0050',14),
('김도현','010-2265-9013',15),
('김시원','010-9289-4397',16),
('김시윤','010-3788-2478',17),
('김아란','010-5410-8405',18),
('김준범','010-2797-3039',19),
('김지우','010-9458-2447',20),
('김호진','010-4528-8226',21),
('나지성','010-9625-1379',22),
('문지유','010-6496-1389',23),
('박지우','010-8330-6779',24),
('서소윤','010-9996-9761',25),
('서지우','010-9269-1336',26),
('송민건','010-9004-2926',27),
('양소윤','010-9111-3700',28),
('오수연','010-3286-6880',29),
('우정훈','010-3833-8315',30),
('윤서준','010-9283-9400',31),
('이유빈','010-6451-9510',32),
('이홍윤','010-8504-9798',33),
('임다은','010-8183-9283',34),
('정유진','010-8880-7759',35),
('박선율','010-2776-9111',36),
('한채린','010-5298-7970',37),
('오수빈','010-3286-6880',38),
('남희수','010-8965-5948',39),
('김가인','010-4549-0142',40),
('양은정','010-7232-0795',41),
('테스트학생','010-0000-0000',42),
('한유찬','010-3288-1931',43),  -- 신규 (2026-05-22 추가)
('문성민','010-6496-1389',44);  -- 신규 (2026-05-22 추가)

-- 4. get_cert_students: phone + naver_nicknames 포함 반환
CREATE OR REPLACE FUNCTION public.get_cert_students()
RETURNS TABLE(
  id            int,
  name          text,
  phone         text,
  grade         text,
  naver_nicknames text[],
  sort_order    int,
  created_at    timestamptz
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id, name, phone, grade, naver_nicknames, sort_order, created_at
  FROM public.cert_students
  ORDER BY sort_order, name;
$$;

-- 5. upsert_cert_student: phone + naver_nicknames 지원
CREATE OR REPLACE FUNCTION public.upsert_cert_student(
  p_id              int     DEFAULT NULL,
  p_name            text    DEFAULT '',
  p_phone           text    DEFAULT NULL,
  p_grade           text    DEFAULT NULL,
  p_naver_nicknames text[]  DEFAULT '{}',
  p_sort_order      int     DEFAULT 0
)
RETURNS TABLE(
  id            int,
  name          text,
  phone         text,
  grade         text,
  naver_nicknames text[],
  sort_order    int,
  created_at    timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_id IS NULL THEN
    RETURN QUERY
      INSERT INTO public.cert_students(name, phone, grade, naver_nicknames, sort_order)
      VALUES(p_name, p_phone, p_grade, p_naver_nicknames, p_sort_order)
      RETURNING id, name, phone, grade, naver_nicknames, sort_order, created_at;
  ELSE
    RETURN QUERY
      UPDATE public.cert_students
        SET name=p_name, phone=p_phone, grade=p_grade,
            naver_nicknames=p_naver_nicknames, sort_order=p_sort_order
        WHERE id=p_id
        RETURNING id, name, phone, grade, naver_nicknames, sort_order, created_at;
  END IF;
END;
$$;
