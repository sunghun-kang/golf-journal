# CLAUDE.md — 강'골프 작업 규칙

PC(Claude Desktop)·폰(Claude 앱 → Code, 클라우드) 어디서 작업하든 이 규칙을 따른다.
**먼저 `설계메모.md`를 읽고 시작**할 것 — 구조·함수 이름·지금까지 고친 이유가 다 거기 있다.

## 사용자
- 호칭은 **「이사님」**. 답은 **한국어**, 짧고 쉽게(코드 용어보다 화면에서 보이는 말로).
- 정확한 자료가 필요하면 추측하지 말고 묻는다. 확인 안 한 건 「확인 안 함」이라고 그대로 말한다.

## 대상 파일
- 강'Story(골프 일지) = **`golf-swing-journal_25.html`** 한 파일(빌드 없음, 순수 HTML/CSS/JS).
  다른 `golf-swing-journal_NN.html`은 옛 버전 — 건드리지 않는다.
- 런처 `index.html`, 가족 `golf-family.html`, 자산 `portfolio-web/`.
- 배포 = GitHub Pages(main) → https://sunghun-kang.github.io/golf-journal/

## 작업 순서 (매번)
1. **시작할 때 `git pull`** — PC와 폰(클라우드)이 둘 다 main에 올린다.
2. 고친다. 고친 곳 근처 주석은 주변 코드처럼 짧게, 왜 바꿨는지 + 날짜(예: `(26-10-27)`).
3. **버전 올리기**: `id="appVerLabel"`의 `V01.02.NN · YY-MM-DD`를 +1, 날짜는 오늘(KST).
   (앱이 이 글자를 보고 새 버전을 자동 적용하므로 반드시 바꾼다)
4. **문법 검사** (0 errors 여야 함):
   ```
   node -e "const h=require('fs').readFileSync('golf-swing-journal_25.html','utf8');let n=0,e=0;for(const m of h.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)){n++;try{new Function(m[1])}catch(x){e++;console.log(x.message)}}console.log('scripts',n,'errors',e)"
   ```
5. 커밋 메시지: 한 줄 요약 + `(V01.02.NN)`, 본문에 원인·바꾼 것. 그리고 main에 push
   (클라우드 세션이 `claude/…` 브랜치에서 일하면 끝에 main에 반영).
6. **배포 확인**: 1~2분 뒤 `curl -s "https://sunghun-kang.github.io/golf-journal/golf-swing-journal_25.html?x=$RANDOM" | grep -o 'V01\.02\.[0-9]*'` 가 새 버전이면 반영된 것.
7. **설계메모.md**에 바뀐 내용을 (버전 번호와 함께) 짧게 추가한다.

## 확인(검증)
- 화면이 바뀌는 수정은 브라우저로 직접 열어 확인하고, 숫자(건수·크기 등)로 보고한다.
- AI(🤖질문·다시요약) 쪽은 `window.fetch`를 가짜 응답으로 바꿔 「보내는 프롬프트」와 「답 후처리」를 확인한다.
  실제 AI 호출은 이사님 기기(API 키)에서만 된다 — 확인 못 했으면 그렇게 말한다.
- 클라우드 환경은 Supabase 서버에 직접 접속이 안 된다 → 실제 기록으로 확인은 이사님이 앱에서.

## 지켜야 할 표시 규칙 (이사님 지정)
- 앱 화면 날짜: 목록과 같은 **`26-09-13(일)`**. AI 요약 안 날짜: **`MM/DD(요일)` 두 자리**(3/5 → 03/05).
- 구장 이름: AI 답에서 **"큰따옴표"** + 별칭 통일 — `VENUES` 표(코드)만 고친다.
  "BA비스타" ← BA·BA정모·정모·몬티·벨라·비스타 / "썬밸리" ← 썬·여주썬 / "오너스".
- AI 요약에서 **같은 날 기록은 1줄**, 질문에 구분(필드·스크린…)이 있거나 「정리·날짜별」이면 **날짜 하나도 빠짐없이**
  (빠지면 자동 보충 → 그래도 빠지면 ⚠ 표시). 날짜 뒤 구분 아이콘 ⛳🏌️‍♀️🔍🌱🔤🏢.
- 검색 중엔 📌게시글도 날짜순, 검색 안 할 땐 최신 게시글 1개만 맨 위.

## 데이터(서버) 주의
- 기록은 Supabase `golf_posts`(id·data jsonb·updated_at). 삭제는 tombstone(`{deleted:true}`).
- 특수 id `__meetings__`·`__theme_extra__`·`__asset_*` 는 일반 글이 아니다 — 건드리지 말 것.
- 기록을 지우거나 대량으로 바꾸는 일은 이사님이 시킬 때만, 먼저 무엇을 바꾸는지 말하고 한다.

## 하지 말 것
- 옛 버전 파일 수정, 버전 안 올리고 배포, 검사 안 하고 push.
- 이 저장소는 **공개(public)** — 비밀번호·API 키·개인정보를 커밋하지 않는다
  (Anthropic API 키는 각 기기 브라우저에만 저장됨).
