# KCT 작업일보 웹사이트

카카오톡 단톡방 입력 방식에 맞춘 작업일보 웹앱 초안입니다.

## 기능
- 작업일보 등록 / 목록 / 상세보기
- 현장 사진 첨부
- 차량운행 / 경비사용 기록
- PDF/인쇄 저장
- TXT 다운로드
- 브라우저 localStorage 저장
- 모바일 하단 메뉴

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 표시되는 주소로 접속합니다.

## 배포 방법

### Vercel
1. 이 폴더를 GitHub에 업로드
2. Vercel에서 New Project 선택
3. Framework Preset: Vite
4. Build Command: `npm run build`
5. Output Directory: `dist`

### Netlify
1. 이 폴더를 Netlify에 업로드
2. Build Command: `npm run build`
3. Publish Directory: `dist`

## 주의
현재 버전은 데이터가 사용자 브라우저에 저장됩니다. 여러 직원이 공동 사용하려면 Supabase/Firebase 같은 DB 연결이 필요합니다.
