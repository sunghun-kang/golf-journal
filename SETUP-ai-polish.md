# ✨ AI 꾸미기 기능 설정 (가족앱)

가족앱 글쓰기 화면의 **✨ 꾸미기** 버튼을 누르면, Claude(AI)가 글을
**맞춤법 교정 + 과한 표현 순화 + 따뜻하게 다듬기** 해서 제안합니다.
원문은 그대로 두고, [✅ 이걸로 적용]을 눌러야 바뀝니다.

AI 키를 앱에 직접 넣으면 공개 저장소라 유출되므로, **Supabase의 작은 함수(중계)**
가 대신 AI를 부릅니다. 키는 서버에만 보관돼 안전합니다.

---

## 1단계. Anthropic(클로드) API 키 발급
1. https://console.anthropic.com 접속 → 가입/로그인
2. **Billing**(결제)에서 카드 등록 후 **크레딧 충전**(최소 $5 — 다듬기 수천 번 분량)
3. **API Keys** → **Create Key** → 키(`sk-ant-...`) **복사** (한 번만 보임! 메모해두기)

> 💡 비용: 다듬기 1회당 대략 **1~3원**. $5면 한참 씁니다.

## 2단계. Supabase에 함수(polish) 배포
1. Supabase 대시보드 → 왼쪽 메뉴 **Edge Functions**
2. **Deploy a new function**(또는 Create function) → 이름: **`polish`**
3. 코드 입력칸에 저장소의 **`supabase-functions-polish.ts`** 내용을 **전부 복사해 붙여넣기**
4. **Deploy** 클릭

## 3단계. 비밀키 등록
1. Supabase → **Edge Functions → (polish) → Secrets** (또는 Settings → Edge Functions → Secrets)
2. **Add new secret**:
   - Name: `ANTHROPIC_API_KEY`
   - Value: 1단계에서 복사한 키(`sk-ant-...`)
3. 저장

> 시크릿을 바꾼 뒤에는 함수가 자동 반영되지만, 안 되면 함수를 한 번 **재배포(Deploy)** 하세요.

---

## 끝! 사용법
1. 가족앱에서 글쓰기 → 메모 작성
2. **✨ 꾸미기** 누르기 → 몇 초 뒤 "다듬은 글" 제안이 뜸
3. 맘에 들면 **✅ 이걸로 적용**, 아니면 **취소(원문유지)**

## 문제 해결
- **"꾸미기 실패"** → 함수 배포 안 됨/이름이 `polish` 아님 → 2단계 확인
- **"ANTHROPIC_API_KEY 미설정"** → 3단계 시크릿 등록 확인
- **"AI 호출 실패"** → 키가 틀렸거나 크레딧 부족 → 1단계 확인
- 모델명(`claude-haiku-4-5-20251001`)이 안 먹으면 알려주세요. 최신 모델로 바꿔드릴게요.
