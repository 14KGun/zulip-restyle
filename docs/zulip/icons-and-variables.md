# 아이콘, 색 변수, 아바타

## 아이콘 폰트 (`web/icons/`)

Zulip의 `zulip-icon-*` 아이콘은 `web/icons/*.svg`를 빌드할 때 웹폰트 하나(`zulip-icons`)로 묶은 것입니다. 생성 템플릿(`web/icons/template.hbs`)은 이렇게 생겼습니다.

```css
i.zulip-icon {
    font-family: 'zulip-icons' !important;
    display: inline-block;
    line-height: 100%;
    font-size: inherit;
}
.zulip-icon::before {
    font-family: 'zulip-icons' !important;
    vertical-align: top;
}
.zulip-icon.zulip-icon-inbox::before { content: "\f1xx"; }
```

글리프가 `::before`의 `content`로 그려집니다. 다른 아이콘으로 바꾸려면 같은 `::before`에 `content: ""`를 주고, 1em 정사각형에 `background-color: currentcolor`와 SVG `mask`를 씌우면 됩니다. 색은 원래처럼 `color`를 따라갑니다. 선택자는 `.zulip-icon.zulip-icon-inbox::before`보다 구체적이어야 합니다.

이 확장은 `tools/build-icons.py`로 24px 선 아이콘 SVG를 data URI로 바꿔 `styles/restyle.css` 끝에 넣습니다. 범위는 `#left-sidebar`, `#message_view_header`, `#zr-page-title` 안으로 한정했습니다. 팝오버나 설정 화면처럼 아이콘 크기를 따로 맞춘 곳은 건드리지 않기 위해서입니다.

자주 쓰이는 아이콘 이름: `inbox`, `recent`, `all-messages`, `at-sign`, `smile`, `star`, `drafts`, `calendar-days`, `alarm-clock`, `hashtag`, `lock`, `globe`, `archive`, `dm-groups-3`, `square-plus`, `more-vertical`, `heading-triangle-right`, `user-circle-active`/`idle`/`offline`.

## 색 변수 (`web/styles/app_variables.css`)

모두 `:root`에 `light-dark(라이트, 다크)`로 정의됩니다. 다크 테마는 `:root.dark-theme`(자동 모드에서는 `prefers-color-scheme: dark`일 때 `:root.color-scheme-automatic`)에 `color-scheme: dark`를 거는 방식입니다 (`web/styles/dark_theme.css`). 이 확장은 `html[data-zr-theme]:root`(우선순위 0,2,1)로 덮어씁니다.

| 분류 | 변수 |
| --- | --- |
| 배경 | `--color-background`, `--color-background-navbar`, `--color-background-stream-message-content`, `--color-background-private-message-content`, `--color-background-popover` |
| 사이드바 글자 | `--color-text-sidebar-row`, `--color-text-active-narrow-filter`, `--color-text-sidebar-heading` |
| 사이드바 행 | `--color-background-active-narrow-filter`, `--color-background-hover-narrow-filter`, `--color-shadow-sidebar-row-hover` |
| 사이드바 제목 | `--font-weight-sidebar-heading`(600), `--letter-spacing-sidebar-heading`(0.0469em), `--opacity-sidebar-heading`(0.7) |
| 사이드바 아이콘 | `--color-left-sidebar-navigation-icon`, `--color-left-sidebar-dm-partners-icon` |
| 경계선 | `--color-border-sidebar`, `--color-navbar-bottom-border`, `--color-message-header-contents-border-bottom` |
| 멘션 | `--color-background-direct-mention`, `--color-background-group-mention`, `--color-background-text-direct-mention`, `--color-text-self-direct-mention` |
| 상태 점 | `--color-user-circle-active`(라이트 `#43a35e`), `--color-user-circle-idle`(`#f5b266`), `--color-user-circle-offline` |
| 링크 | `--color-text-link`, `--color-text-url`, `--color-markdown-link` (+ `-hover`) |
| 입력창 | `--color-compose-box-background`, `--color-compose-message-content-background`, `--color-compose-send-button-background` |

## 아바타 URL (`zproject/urls.py`)

- `GET /avatar/<user_id>` → 그 사용자의 현재 아바타로 리다이렉트합니다. 로그인한 사용자라면 확장에서 그대로 `<img src="/avatar/12">`로 쓸 수 있습니다.
- `GET /avatar/<user_id>/medium` → 큰 크기.
- `GET /avatar/<email>`도 있습니다.

개인 메시지 목록에는 아바타가 없고 상태 점만 있어서, `enhance.js`가 `data-user-ids-string`의 id로 이 주소를 써서 아바타를 넣습니다.
