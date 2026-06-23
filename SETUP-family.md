# 우리가족 골프일지 — 멀티유저(로그인) 설정 가이드

`golf-family.html` 은 가족 각자가 **이메일+비밀번호로 로그인**해서
**자기 기록만** 보고 저장하는 버전입니다. (방법 B — 진짜 로그인)

개인용 `golf-swing-journal_25.html` 과는 **완전히 별개**로 동작하며,
서로 데이터가 섞이지 않습니다.

---

## 1. Supabase에서 테이블 + 보안정책 만들기 (1회만)

Supabase 대시보드 → **SQL Editor** → 아래 전체를 붙여넣고 **Run**.

```sql
-- 사용자별 데이터 테이블 (한 사람당 한 줄)
create table if not exists public.family_golf_log (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- 행 수준 보안 켜기 (남의 기록 못 보게)
alter table public.family_golf_log enable row level security;

-- 본인 행만 읽기/쓰기 허용
create policy "own_select" on public.family_golf_log
  for select using (auth.uid() = user_id);
create policy "own_insert" on public.family_golf_log
  for insert with check (auth.uid() = user_id);
create policy "own_update" on public.family_golf_log
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

이 정책 덕분에 가족 10명이 같은 앱·같은 키를 써도 **서로의 기록은 절대 못 봅니다.**

## 2. 이메일 로그인 켜기

Supabase 대시보드 → **Authentication → Sign In / Providers → Email** 이 **Enabled** 인지 확인.
(기본적으로 켜져 있습니다.)

### (선택) 이메일 인증 없이 바로 쓰기 — 가족용 추천
**Authentication → Sign In / Providers → Email → "Confirm email"** 을 **끄면**,
회원가입하자마자 인증 메일 없이 바로 로그인됩니다. 가족끼리 쓰기 편합니다.
(켜두면 가입 후 메일의 링크를 눌러야 로그인 가능)

## 3. 사용하기

1. `golf-family.html` 을 열면 로그인 화면이 뜹니다.
2. 가족 각자 **회원가입**(이름/별명 + 이메일 + 비번 6자 이상) → 자동 로그인.
3. 이후엔 같은 기기에서 자동 로그인 유지(세션 저장). `⋮ → 🚪 로그아웃` 으로 전환.
4. 기록은 각자 계정에 저장되고, 다른 기기에서 로그인해도 동기화됩니다.

---

## 참고 / 한계
- Supabase **URL·publishable 키**는 코드에 그대로 둬도 됩니다(공개용 키). 실제 보호는 위 RLS 정책이 합니다.
- 사진/영상은 기록 JSON 안에 base64로 저장됩니다. 인당 데이터가 커질 수 있으니, 무료 플랜 용량(기본 500MB DB)을 가끔 확인하세요.
- 가족 한도 10명 정도면 무료 플랜으로 충분합니다.
- 비밀번호 재설정 메일 기능이 필요하면 알려주세요(추가 가능).
