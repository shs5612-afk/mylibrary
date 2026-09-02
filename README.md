# 📚 나만의 지적 개인 서재 & 독서 연구실 (My Literary Haven)

> **YES24.com 도서정보/ISBN 연동 · KaTeX 수학·공학 수식 지원 · AI 심층 독서 토론 및 저술 참고자료 자동 정리 · Google Drive 클라우드 백업**을 갖춘 차세대 개인 서재 웹 애플리케이션

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

---

## 🌟 8대 핵심 기능

1. **감성 개인 서재 & 3D 책장**:
   - 🪵 **3D 원목 책장 뷰**: 책등 색상과 높이, 독서 진도율, 책갈피 리본이 돋보이는 입체 서가
   - 🖼️ **갤러리 카드 뷰**: 고화질 표지와 별점, 진도율(%)이 한눈에 보이는 그리드 뷰
   - 📋 **목록 테이블 뷰**: 도서명, 출판사, ISBN-13, YES24 링크를 신속하게 관리
   - 독서 상태별 탭 필터링 (`📖 읽는 중`, `✅ 완독`, `📌 위시리스트`, `⏸️ 잠시 멈춤`) 및 장르별/정렬별 필터

2. **독서 기록 중심 관리**:
   - 페이지별 독서 진도율 실시간 슬라이더 및 % 달성률 자동 계산
   - 독서 시작일/완독일 기록, 별점(★ 0.5 ~ 5.0) 평가

3. **YES24.com 공식 도서 정보 & ISBN 실시간 연동**:
   - 10자리/13자리 ISBN 또는 도서명 검색 시 **YES24의 표지 이미지, 목차(TOC), 책소개, 출판사, 정가, ISBN-13 자동 로드**
   - YES24 공식 상품 페이지 원클릭 연결

4. **수학·공학인을 위한 LaTeX 수식 완벽 지원**:
   - **KaTeX** 초고속 렌더링 엔진 탑재
   - 인라인 수식(`$E=mc^2$`, `$\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}$`)
   - 블록 수식(`$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$`, `$$\frac{df}{dx} = \lim_{h \to 0}\frac{f(x+h)-f(x)}{h}$$`)
   - 독서 노트, 서평, 인상 깊은 문장, AI 대화, 집필 자료 전반에 완벽 렌더링

5. **AI 심층 독서 토론 파트너 (Gemini & OpenAI API)**:
   - 4가지 전문 페르소나 탑재:
     - 🎓 **학술 & 공학 연구자**: 수학/물리적 배경 및 수식 엄밀 유도
     - ✍️ **공동 저술 파트너**: 내 책의 챕터 구성 및 논거 발전 제안
     - 🏛️ **소크라테스 비평가**: 저자의 숨은 전제와 반론 고찰
     - 💡 **지식 융합 및 통찰 요약가**: 직관적인 비유와 실무 적용 방안
   - 설정(⚙️)에서 **Google Gemini API Key**(무료) 또는 **OpenAI Key**를 안전하게 등록하여 사용

6. **책 하단 [저술 & 집필 참고 자료함 (Author's Research Notes)] 자동 정리**:
   - AI와의 대화 중 유익한 답변의 **`[⭐ 내 책 집필 자료로 저장]`** 클릭 시, 해당 책 하단에 4개 영역(핵심 개념, 수식 유도, 인용 및 논거, 집필 아이디어)으로 자동 누적
   - 향후 책을 쓸 때 바로 활용할 수 있는 **Markdown(`.md`)** 및 **LaTeX(`.tex`)** 원클릭 내보내기 지원

7. **인상 깊은 문장 수집 & 감성 문장 카드 생성기**:
   - 책 속 명구절 + 페이지 번호 + 한 줄 감상 기록
   - 인스타/SNS 공유 및 소장용 감성 문장 카드(원목, 미드나잇, 페이퍼, 노을 테마) 캡처 및 클립보드 복사

8. **Google Drive 클라우드 백업 & 복원**:
   - **Google Drive에 원클릭 백업**: 전체 서재 데이터를 내 Google Drive에 안전하게 자동 저장 및 복원
   - **로컬 JSON 파일 백업/복원**: PC의 `g:\내 드라이브\mylibrary` 폴더와 호환되는 즉각적인 JSON 파일 다운로드 및 업로드 지원

---

## 🚀 로컬 실행 방법 (Local Development)

### 방법 1. 브라우저에서 바로 열기
별도의 설치 없이 `index.html` 파일을 더블 클릭하거나 브라우저로 열면 즉시 모든 서재 기능과 LaTeX, 로컬 백업이 작동합니다.

### 방법 2. Vite 로컬 개발 서버 실행
```bash
# 1. 의존성 설치
npm install

# 2. 로컬 개발 서버 시작 (http://localhost:3000)
npm run dev
```

---

## 🌐 GitHub 및 Vercel 배포 방법 (Deployment Guide)

### 1단계: GitHub 저장소에 올리기
```bash
# Git 초기화
git init
git add .
git commit -m "feat: 나만의 지적 서재 & 독서 연구실 구축"

# GitHub 원격 저장소 연결 및 푸시
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/my-literary-haven.git
git push -u origin main
```

### 2단계: Vercel에 배포하기
1. [Vercel 대시보드](https://vercel.com/)로 이동하여 **'Add New... -> Project'** 클릭.
2. 위에서 푸시한 GitHub 저장소(`my-literary-haven`)를 Import 합니다.
3. **Environment Variables (환경 변수 - 선택 사항)** 설정:
   - `GEMINI_API_KEY`: Google Gemini API 키 (선택 사항 - 설정 UI에서도 직접 입력 가능)
   - `OPENAI_API_KEY`: OpenAI API 키 (선택 사항)
4. **'Deploy'** 버튼을 클릭하면 1분 이내에 전 세계 어디서든 접속 가능한 나만의 서재 웹사이트(`https://your-app.vercel.app`)가 완성됩니다!

---

## 📂 프로젝트 구조

```
mylibrary/
├── index.html                   # 메인 애플리케이션 엔트리포인트 (SPA)
├── package.json                 # 프로젝트 스크립트 및 정보
├── vite.config.js               # Vite 빌드 설정
├── vercel.json                  # Vercel 라우팅 및 보안 헤더 설정
├── .gitignore                   # Git 제외 파일 목록
├── README.md                    # 프로젝트 가이드
├── api/                         # Vercel Serverless Functions
│   ├── yes24.js                 # YES24 도서정보 및 ISBN 실시간 크롤러
│   └── chat.js                  # Gemini / OpenAI AI 토론 프록시
├── css/
│   ├── style.css                # 디자인 시스템, 테마(오크, 미드나잇, 페이퍼), 글로벌 레이아웃
│   ├── bookshelf.css            # 3D 원목 책장, 갤러리 그리드, 리스트 뷰 스타일
│   ├── components.css           # 도서상세, KaTeX 수식, AI 채팅, 저술 워크스페이스, 모달
│   └── animations.css           # 3D 틸트, 부드러운 전환 및 토스트 애니메이션
└── js/
    ├── app.js                   # 메인 앱 오케스트레이터
    ├── components/
    │   ├── BookshelfView.js     # 3D 책장 및 서재 뷰 렌더러
    │   ├── BookDetailView.js    # 도서 상세 정보 및 진도율 제어
    │   ├── ReadingNotesView.js  # 인상 깊은 문장 & LaTeX 서평 에디터
    │   ├── AICopilotView.js     # AI 심층 독서 토론 및 집필자료 연동
    │   ├── WritingWorkspaceView.js # 책 하단 저술 참고자료함 및 TeX/MD 내보내기
    │   ├── BookSearchModal.js   # YES24 도서 검색 및 직접 등록 모달
    │   ├── StatsModal.js        # 독서 통계 및 올해 목표 달성 차트
    │   ├── SettingsModal.js     # 테마, API 키, Client ID 설정 모달
    │   ├── QuoteCardModal.js    # 감성 문장 카드 생성기 모달
    │   └── GDriveBackupModal.js # Google Drive 백업/복원 모달
    └── utils/
        ├── storage.js           # LocalStorage CRUD 및 샘플 데이터
        ├── mathRenderer.js      # KaTeX 수식 및 마크다운 렌더러
        ├── yes24Fetcher.js      # YES24 API 호출 및 클라이언트 Fallback
        ├── aiService.js         # Gemini/OpenAI 통신 및 4대 페르소나
        └── gdriveService.js     # Google Drive OAuth2 및 백업/복원
```

---

## 🎨 3가지 감성 테마
- 🪵 **클래식 오크 (Classic Oak Wood)**: 따뜻하고 클래식한 서재의 원목 감성
- 🌌 **미드나잇 서재 (Midnight Navy Dark)**: 깊은 밤 집중력 있는 독서와 연구를 위한 다크 모드
- 📜 **미니멀 페이퍼 (Minimal Linen Paper)**: 담백한 종이책 질감의 라이트 모드

---

## 📜 라이선스
MIT License
