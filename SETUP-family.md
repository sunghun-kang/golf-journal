# 우리가족 골프일지 — 설정 가이드 (구글 로그인 + 가족코드 + 공유글)

`golf-family.html` 은 가족 전용 버전입니다.

- **구글 로그인으로만** 입장
- 처음 로그인하면 **가족 4자리 코드**를 입력해야 가입 승인(이후 자동 입장)
- 글 작성 시 **`🔒 개인` / `👨‍👩‍👧‍👦 가족공통`** 선택
  - **개인** = 나만 봄
  - **가족공통** = 온 가족이 봄 (단, 수정·삭제는 글쓴 본인만)

개인용 `golf-swing-journal_25.html` 와는 완전히 별개입니다.

---

## 1단계. Supabase에 테이블·정책·함수 만들기 (1회)

Supabase 대시보드 → **SQL Editor** → 아래 전체 붙여넣고 **Run**.
(가족 코드는 아래 `'1234'` 부분을 원하는 4자리로 바꾸세요.)

```sql
-- 1) 가족 공용 코드 (마스터가 정함)
create table if not exists public.family_config (
  id int primary key default 1,
  family_code text not null
);
insert into public.family_config (id, family_code)
values (1, '1234')          -- ← 원하는 4자리 코드로 변경
on conflict (id) do nothing;
alter table public.family_config enable row level security;
-- 정책 없음 = 앱이 코드를 직접 못 읽음(유출 방지). 아래 함수로만 검증.

-- 2) 가족 멤버(승인 명단)
create table if not exists public.family_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  approved boolean default false,
  created_at timestamptz default now()
);
alter table public.family_members enable row level security;
create policy "fm_select_own" on public.family_members
  for select using (auth.uid() = user_id);

-- 3) 글 (한 건 = 한 행)
create table if not exists public.family_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text,
  rec jsonb not null,
  share text not null default 'private' check (share in ('family','private')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.family_posts enable row level security;

-- 승인 여부 확인 함수 (정책 재귀 방지)
create or replace function public.is_approved()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.family_members m
                 where m.user_id = auth.uid() and m.approved);
$$;
grant execute on function public.is_approved() to authenticated;

-- 가족공통 글은 승인된 가족 누구나 열람 / 내 글은 항상 열람
create policy "fp_select" on public.family_posts for select
  using ( public.is_approved() and (share = 'family' or author_id = auth.uid()) );
-- 글 작성/수정/삭제는 본인 것만
create policy "fp_insert" on public.family_posts for insert
  with check ( author_id = auth.uid() and public.is_approved() );
create policy "fp_update" on public.family_posts for update
  using ( author_id = auth.uid() ) with check ( author_id = auth.uid() );
create policy "fp_delete" on public.family_posts for delete
  using ( author_id = auth.uid() );

-- 4) 가족코드 인증 함수 (코드 맞으면 본인을 승인 처리)
create or replace function public.redeem_family_code(p_code text, p_name text, p_email text)
returns boolean language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  select (p_code = family_code) into ok from public.family_config where id = 1;
  if coalesce(ok, false) then
    insert into public.family_members (user_id, display_name, email, approved)
    values (auth.uid(), p_name, p_email, true)
    on conflict (user_id) do update
      set approved = true, display_name = excluded.display_name, email = excluded.email;
  end if;
  return coalesce(ok, false);
end; $$;
grant execute on function public.redeem_family_code(text, text, text) to authenticated;
```

> 이전 버전에서 만든 `family_golf_log` 테이블은 이제 안 씁니다. 그냥 두거나 `drop table public.family_golf_log;` 로 지워도 됩니다.

---

## 2단계. 구글 로그인 켜기 (Google OAuth)

### 2-1. Google Cloud에서 OAuth 클라이언트 발급
1. https://console.cloud.google.com → 프로젝트 생성/선택
2. **API 및 서비스 → OAuth 동의 화면** → 외부(External)로 설정, 앱 이름/이메일 입력, 테스트 사용자에 가족 이메일 추가(또는 게시)
3. **API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
   - 유형: **웹 애플리케이션**
   - **승인된 리디렉션 URI** 에 아래 추가:
     ```
     https://qnbpavvcpxjhccppiqav.supabase.co/auth/v1/callback
     ```
4. 만들어진 **클라이언트 ID / 클라이언트 보안 비밀번호** 복사

### 2-2. Supabase에 입력
- Supabase → **Authentication → Sign In / Providers → Google** → **Enabled** 켜고, 위 Client ID/Secret 붙여넣기 → 저장

### 2-3. 앱 주소 등록 (중요)
- Supabase → **Authentication → URL Configuration**
  - **Site URL** 과 **Redirect URLs** 에 `golf-family.html` 이 열리는 실제 주소를 추가
    (예: `https://<깃허브아이디>.github.io/golf-journal/golf-family.html`)
  - 이걸 빠뜨리면 구글 로그인 후 되돌아올 때 막힙니다.

---

## 3단계. 사용하기

1. `golf-family.html` 열기 → **Google로 로그인**
2. 처음이면 **가족 4자리 코드**(마스터가 알려준 코드) 입력 → 승인 완료
3. 이후 같은 기기에선 자동 입장. `⋮ → 🚪 로그아웃` 으로 전환
4. 글 쓸 때 **개인 / 가족공통** 선택. 가족공통으로 쓰면 가족 목록·달력에 다 같이 보입니다.

---

## 마스터 관리 메모
- **코드 변경**: SQL Editor 또는 Table Editor 에서
  `update family_config set family_code = '5678' where id = 1;`
- **멤버 내보내기/차단**: `update family_members set approved = false where email = '...';`
- **누가 가입했나 보기**: `select display_name, email, approved, created_at from family_members order by created_at;`

## 참고 / 한계
- 가족 4자리 코드는 편의를 위한 단순 인증입니다(가족 공유 비밀번호 개념). 코드를 아는 사람은 누구나 구글 로그인 후 가입할 수 있으니, 코드는 가족끼리만 공유하세요.
- 사진/영상은 글 JSON에 base64로 저장됩니다. 무료 플랜 DB 용량(기본 500MB)을 가끔 확인하세요.
- 진짜 이메일 승인(마스터에게 메일 발송)이 필요해지면 GAS 연동으로 추가 가능합니다.
