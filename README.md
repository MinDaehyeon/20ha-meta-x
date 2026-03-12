# 20HA META-X — Vercel 배포 가이드

외부에서 누구나 접속할 수 있는 URL을 5분 안에 만드는 방법입니다.

---

## 준비물

- [Node.js](https://nodejs.org) (v18 이상)
- [GitHub](https://github.com) 계정
- [Vercel](https://vercel.com) 계정 (GitHub로 무료 가입)

---

## 배포 방법 (GitHub → Vercel 연동)

### 1단계 — GitHub에 올리기

```bash
# 이 폴더에서 실행
git init
git add .
git commit -m "초기 배포"
```

GitHub에서 새 저장소(Repository) 생성 후:

```bash
git remote add origin https://github.com/your-id/20ha-meta-x.git
git push -u origin main
```

---

### 2단계 — Vercel 배포

1. [vercel.com](https://vercel.com) 접속 → **GitHub으로 로그인**
2. **Add New Project** 클릭
3. 방금 만든 저장소(`20ha-meta-x`) 선택 → **Import**
4. 설정은 모두 기본값 유지 → **Deploy** 클릭
5. 약 1~2분 후 배포 완료

```
✅ 배포 완료 예시 URL:
https://20ha-meta-x.vercel.app
```

이 URL을 공유하면 누구나 접속할 수 있습니다.

---

## 로컬에서 먼저 테스트하려면

```bash
npm install
npm start
# → http://localhost:3000 에서 확인
```

---

## 데모 계정

| 역할 | 아이디 | 비밀번호 |
|------|--------|----------|
| 학습자 | S001 | student1 |
| 학습자 | S002 | student2 |
| 학습자 | S003 | student3 |
| 관리자 | A001 | admin1234 |

---

## 자주 묻는 질문

**Q. 무료인가요?**
Vercel 무료 플랜으로 충분합니다. 트래픽이 매우 많아지지 않는 한 과금되지 않습니다.

**Q. 학생이 입력한 데이터를 관리자가 실시간으로 볼 수 있나요?**
현재 버전은 데모용으로, 데이터가 각자의 브라우저(localStorage)에 저장됩니다.
실제 멀티유저 연동이 필요하면 Firebase 또는 Supabase 백엔드 연결이 필요합니다.

**Q. URL을 바꾸고 싶어요.**
Vercel 대시보드 → Project Settings → Domains에서 커스텀 도메인을 연결할 수 있습니다.
예) `20ha-meta-x.com`

**Q. 코드를 수정하면 자동으로 재배포되나요?**
GitHub에 push하면 Vercel이 자동으로 재빌드·배포합니다.

---

## 파일 구조

```
20ha-meta-x/
├── public/
│   └── index.html          ← HTML 진입점
├── src/
│   ├── index.js            ← React 진입점
│   └── App.jsx             ← 전체 앱 코드
├── package.json
├── vercel.json             ← Vercel 라우팅 설정
└── .gitignore
```
