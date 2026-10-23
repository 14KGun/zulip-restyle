# Zulip 12.0 구조 메모

확장을 만들면서 Zulip 웹 앱 구조를 조사한 내용입니다. 클래스명이나 변수명이 Zulip 업데이트로 바뀌어 스타일이 빠졌을 때, 어디를 다시 확인해야 하는지 찾는 용도입니다.

- 기준: Zulip Server `12.0` 태그 (커밋 `a37e628b24c8`, 2026-04-27)
- 출처: https://github.com/zulip/zulip 의 `web/templates`, `web/styles`, `web/src`, `web/icons`, `templates/zerver/app/index.html`, `zproject/urls.py`
- 파일 경로는 모두 Zulip 저장소 기준입니다.

| 문서 | 내용 |
| --- | --- |
| [layout.md](layout.md) | 전체 레이아웃, 사이드바 폭 변수, 반응형 기준점, 디스코드 레일을 끼워 넣은 방법 |
| [left-sidebar.md](left-sidebar.md) | 왼쪽 사이드바: 보기 목록, 개인 메시지, 채널 폴더, 행 상태 클래스 |
| [right-sidebar.md](right-sidebar.md) | 오른쪽 사용자 목록(buddy list) |
| [message-feed.md](message-feed.md) | 메시지 목록, 상단 내비바 제목, 멘션 클래스, 입력창 |
| [icons-and-variables.md](icons-and-variables.md) | 아이콘 폰트, 색 변수, 아바타 URL |

## 조사할 때 알아둘 점

- Zulip은 화면 대부분을 Handlebars 템플릿(`web/templates/*.hbs`)으로 그리고, 상태 변화는 `web/src/*.ts`에서 jQuery로 클래스를 붙였다 뗐다 합니다. 클래스명을 찾을 때는 템플릿과 함께 `toggleClass`, `addClass`를 검색하는 게 빠릅니다.
- 스타일 파일은 PostCSS 문법입니다. CSS 중첩(`&`)과 `$md_min` 같은 변수가 들어 있어서 브라우저에 그대로 넣을 수 없습니다. 기준점 값은 `web/src/css_variables.ts`에 있습니다.
- 색은 거의 전부 `web/styles/app_variables.css`의 CSS 변수이고, `light-dark()`로 라이트/다크 값을 함께 정의합니다. `color-scheme: dark`를 강제하면 다크 쪽 값이 쓰입니다.
- 사이드바와 메시지 목록은 자주 다시 그려집니다. DOM에 요소를 덧붙일 때는 한 번만 붙이지 말고, 다시 그려진 뒤에 또 붙일 수 있어야 합니다. 이 확장의 `enhance.js`는 MutationObserver로 이를 처리합니다.
