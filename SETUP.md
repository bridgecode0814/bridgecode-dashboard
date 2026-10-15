# BridgeCode 대시보드 — 로그인 설정 안내

허용된 사람만 대시보드를 볼 수 있게 하는 설정 순서입니다. 처음 한 번만 하면 됩니다.

## 어떻게 동작하나

1. 사람이 사이트에 들어오면 로그인 화면이 먼저 뜹니다.
2. **Google 계정으로 로그인**을 누르면 슈퍼베이스가 구글 로그인을 처리합니다.
3. 버셀 서버가 로그인한 이메일이 시트의 **`허용계정` 탭**에 있는지 확인합니다.
4. 목록에 있으면 서버가 비공개 시트를 대신 읽어 화면에 보여 줍니다. 없으면 "접근 권한이 없습니다"가 뜹니다.

시트는 더 이상 '웹에 게시'하지 않습니다. 시트 주소를 알아도 로그인과 허용 목록을 통과하지 못하면 내용을 볼 수 없습니다.

## 하는 동안 모아 둘 값

| 값 | 어디서 나오나 | 어디에 넣나 |
|---|---|---|
| 슈퍼베이스 Callback URL | 2단계 | 3단계 (구글 클라우드) |
| 구글 Client ID · Client Secret | 3단계 | 3단계 (슈퍼베이스) |
| 서비스 계정 이메일 | 4단계 | 4단계 (시트 공유) |
| 서비스 계정 키 파일(JSON) | 4단계 | 6단계 (버셀) |
| 슈퍼베이스 Project URL · Publishable key | 2단계 | 6단계 (버셀) |
| 시트 ID | 시트 주소 | 6단계 (버셀) |
| 버셀 사이트 주소 | 6단계 | 7단계 (슈퍼베이스) |

> **Client Secret 과 서비스 계정 키 파일은 비밀번호와 같습니다.** 메신저·메일로 보내지 말고, 버셀·슈퍼베이스에 붙여 넣은 뒤 PC 에서 지우세요.

---

## 1단계. 시트에 `허용계정` 탭 만들기 (2분)

1. 대시보드 구글 시트를 엽니다.
2. 아래쪽 **+** 를 눌러 탭을 하나 추가하고, 이름을 **`허용계정`** 으로 바꿉니다.
3. A열에 볼 수 있는 사람의 이메일을 한 칸에 하나씩 적습니다. 첫 줄 제목은 자유입니다.

   | A |
   |---|
   | 이메일 |
   | leedy@bridgecode.co.kr |
   | ryudm@bridgecode.co.kr |
   | lifeofpi@bridgecode.co.kr |
   | parkjh@bridgecode.co.kr |
   | leew@bridgecode.co.kr |

- 앞으로 사람을 넣고 뺄 때는 **이 탭만 고치면 됩니다.** 다음 새로고침부터 바로 반영됩니다.
- `이두연 <leedy@bridgecode.co.kr>` 처럼 이름과 같이 적어도 이메일만 골라 읽습니다.
- 이 탭이 없거나 이름이 다르면 아무도 들어오지 못합니다.

## 2단계. 슈퍼베이스 프로젝트 만들기 (5분)

1. <https://supabase.com/dashboard> 에서 회사 조직을 고르고 **New project** 를 누릅니다.
   - 이름: `bridgecode-dashboard`
   - Database Password: **Generate** 로 만들고 따로 보관 (이번 작업에서는 안 씁니다)
   - Region: **Northeast Asia (Seoul)**
2. 프로젝트가 만들어지면 왼쪽 **Authentication → Sign In / Providers → Google** 을 엽니다.
3. 화면에 보이는 **Callback URL (for OAuth)** 을 복사해 둡니다.
   예) `https://abcdefgh.supabase.co/auth/v1/callback`
   이 창은 3단계에서 다시 옵니다.

> 무료 요금제 프로젝트는 일정 기간(현재 7일) 아무도 쓰지 않으면 일시정지될 수 있습니다. 회사 조직이 유료 요금제라면 그 조직에 만드세요.

## 3단계. 구글 클라우드 — 로그인용 키 만들기 (10분)

회사 계정(@bridgecode.co.kr)으로 로그인한 크롬에서 진행합니다.

**3-1. 프로젝트 만들기**
1. <https://console.cloud.google.com> 에 들어갑니다.
2. 맨 위 프로젝트 선택 상자를 누르고 **새 프로젝트** 를 고릅니다.
   - 이름: `bridgecode-dashboard`
   - 조직: `bridgecode.co.kr`
3. **만들기** 를 누르고, 맨 위에서 **방금 만든 프로젝트가 선택됐는지** 확인합니다.

**3-2. 로그인 화면 정보 (OAuth 동의 화면)**
1. 왼쪽 메뉴 **API 및 서비스 → OAuth 동의 화면** 으로 갑니다. 화면 이름이 **Google 인증 플랫폼**으로 보일 수도 있습니다.
2. **시작하기** 를 누릅니다.
   - 앱 이름: `BridgeCode Admin`
   - 사용자 지원 이메일: 본인 메일
3. **대상(Audience): `내부(Internal)`** 를 고릅니다.
   회사 계정만 로그인할 수 있게 되고, 구글 심사도 필요 없습니다.
4. 연락처 이메일을 넣고 **만들기** 를 누릅니다.

**3-3. 로그인용 키 (OAuth 클라이언트)**
1. 같은 화면의 **클라이언트 → 클라이언트 만들기** 로 갑니다.
   - 애플리케이션 유형: **웹 애플리케이션**
   - 이름: `dashboard-login`
   - **승인된 리디렉션 URI → URI 추가**: 2단계에서 복사한 Callback URL 붙여넣기
2. **만들기** 를 누르면 창에 **클라이언트 ID** 와 **클라이언트 보안 비밀번호(Secret)** 가 뜹니다.
   **Secret 은 이 창을 닫으면 다시 볼 수 없으니 바로 복사**하세요. JSON 다운로드도 됩니다.

**3-4. 슈퍼베이스에 넣기**
1. 2단계의 슈퍼베이스 Google 화면으로 돌아갑니다.
2. **Enable Sign in with Google** 을 켭니다.
3. **Client IDs** 에 클라이언트 ID, **Client Secret** 에 보안 비밀번호를 붙여 넣고 **Save** 를 누릅니다.

## 4단계. 구글 클라우드 — 시트 읽기용 계정 만들기 (5분)

3단계와 **같은 프로젝트**에서 진행합니다.

**4-1. Sheets API 켜기**
1. **API 및 서비스 → 라이브러리** 로 갑니다.
2. `Google Sheets API` 를 검색해 **사용** 을 누릅니다.

**4-2. 서비스 계정 만들기**
1. **IAM 및 관리자 → 서비스 계정 → 서비스 계정 만들기** 로 갑니다.
2. 이름에 `sheet-reader` 를 넣고 **만들고 계속하기** 를 누릅니다.
3. 역할은 지정하지 않고 **완료** 를 누릅니다.

**4-3. 키 파일 받기**
1. 목록에서 `sheet-reader@…iam.gserviceaccount.com` 을 누릅니다.
2. **키** 탭 → **키 추가 → 새 키 만들기 → JSON → 만들기** 를 누르면 파일이 내려받아집니다.
3. 이 화면의 **서비스 계정 이메일**도 복사해 둡니다.

> "서비스 계정 키 생성이 사용 중지되었습니다" 같은 오류가 나면 회사 구글 클라우드 조직 정책이 막은 것입니다. 관리자 권한이 필요하니 화면을 캡처해 알려 주세요.

**4-4. 시트를 이 계정에 공유**
1. 대시보드 구글 시트에서 **공유** 를 누릅니다.
2. 서비스 계정 이메일을 넣고 권한을 **뷰어** 로 둡니다.
3. **이메일 알림 보내기** 체크를 끄고 **공유** 를 누릅니다.

## 5단계. 코드를 GitHub 에 올리기

1. GitHub 저장소 `bridgecode0814/bridgecode-dashboard` 에서 **Add file → Upload files** 를 누릅니다.
2. 아래 파일·폴더를 끌어다 놓고 **Commit changes** 를 누릅니다.
   - `api` 폴더
   - `public` 폴더
   - `package.json`
   - `vercel.json`
   - `.gitignore`
   - `SETUP.md`
3. 맨 바깥의 옛 `index.html` 은 **아직 지우지 않습니다.** 새 사이트가 뜰 때까지 지금 사이트(GitHub Pages)가 그대로 돌아갑니다.

## 6단계. 버셀에 올리기 (10분)

1. <https://vercel.com> 에서 회사 팀을 고르고 **Add New… → Project** 를 누릅니다.
2. `bridgecode-dashboard` 저장소 옆 **Import** 를 누릅니다.
   - 목록에 없으면 **Adjust GitHub App Permissions** 에서 `bridgecode0814` 계정의 저장소 접근을 허용합니다.
3. **Framework Preset** 은 `Other` 로 두고, 나머지 빌드 설정도 그대로 둡니다.
4. **Environment Variables** 에 아래 4개를 넣습니다.

   | Key | Value |
   |---|---|
   | `SUPABASE_URL` | 슈퍼베이스 **Project Settings → Data API** 의 Project URL (`https://…supabase.co`) |
   | `SUPABASE_ANON_KEY` | 슈퍼베이스 **Project Settings → API Keys** 의 Publishable key (`sb_publishable_…`). 없으면 `anon` `public` 키 |
   | `SHEET_ID` | 시트 주소에서 `/d/` 와 `/edit` 사이의 긴 문자열 |
   | `GOOGLE_SERVICE_ACCOUNT_JSON` | 4단계에서 받은 JSON 파일을 메모장으로 열어 **전체** 복사·붙여넣기 |

5. **Deploy** 를 누릅니다.
6. 끝나면 사이트 주소(예: `https://bridgecode-dashboard.vercel.app`)를 복사합니다.
7. JSON 키 파일은 이제 PC 에서 지웁니다.

## 7단계. 슈퍼베이스에 사이트 주소 등록 (2분)

1. 슈퍼베이스 **Authentication → URL Configuration** 으로 갑니다.
2. 아래 두 가지를 넣고 저장합니다.
   - **Site URL**: 6단계 사이트 주소
   - **Redirect URLs → Add URL**: `사이트주소/**` (예: `https://bridgecode-dashboard.vercel.app/**`)

## 8단계. 확인

1. 사이트 주소로 들어가 **Google 계정으로 로그인** 을 누릅니다.
2. 허용 목록의 계정으로 대시보드가 뜨는지 확인합니다.
3. 목록에 없는 다른 회사 계정으로는 "접근 권한이 없습니다"가 뜨는지 확인합니다.

화면에 빨간 안내 문구가 뜨면 문구가 가리키는 단계를 다시 확인합니다.

| 화면 문구 | 확인할 곳 |
|---|---|
| 서버 설정(버셀 환경 변수)이 비어 있습니다 | 6단계 4개 값 → 넣은 뒤 버셀에서 **Redeploy** |
| 시트 읽기용 계정 키가 올바르지 않습니다 | 6단계 `GOOGLE_SERVICE_ACCOUNT_JSON` 을 파일 전체로 다시 붙여넣기 |
| Google Sheets API가 사용 설정되지 않았습니다 | 4-1 |
| 시트 읽기용 계정에 시트가 공유되지 않았습니다 | 4-4 |
| 시트를 찾을 수 없습니다 | 6단계 `SHEET_ID` |
| 시트에 '허용계정' 탭이 없습니다 | 1단계 탭 이름 |
| 로그인 후 다시 로그인 화면으로 돌아옴 | 7단계 주소 |
| 구글 화면에 `redirect_uri_mismatch` | 3-3 리디렉션 URI 가 2단계 Callback URL 과 똑같은지 |

## 9단계. 마무리 (새 사이트가 잘 되는 걸 확인한 뒤에만)

1. **시트 웹 게시 끄기**: 시트 **파일 → 공유 → 웹에 게시 → 게시 중지**.
   이 순간부터 옛 공개 링크로는 데이터를 볼 수 없습니다.
2. **저장소 비공개**: GitHub 저장소 **Settings → General → 맨 아래 Danger Zone → Change visibility → Make private**.
   GitHub Pages 옛 사이트는 이때 멈춥니다. 버셀은 계속 동작합니다.
3. **옛 파일 삭제**: 저장소 맨 바깥의 `index.html` 을 지웁니다 (파일 열기 → `…` → Delete file).
4. **입장 코드 교체**: 시트에 있던 입장 코드 2건은 그동안 공개 링크로 볼 수 있었으니, 각 서비스에서 새 코드로 바꾸고 시트도 고칩니다.

---

## 나중에 바꿀 때

- **볼 수 있는 사람 추가·삭제**: 시트 `허용계정` 탭만 고칩니다.
- **대시보드 항목 수정**: 지금처럼 시트 첫 탭만 고칩니다.
- **회사 밖 사람(외부 계정)을 넣어야 할 때**: 3-2 의 대상이 `내부` 라 회사 계정만 로그인할 수 있습니다. 대상을 `외부` 로 바꿔야 하니 개발 담당자에게 요청합니다.
