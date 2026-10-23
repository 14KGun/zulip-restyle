# 왼쪽 사이드바

템플릿: `web/templates/left_sidebar.hbs`. 스타일: `web/styles/left_sidebar.css`. 동작: `web/src/stream_list.ts`, `web/src/pm_list.ts`, `web/src/sidebar_ui.ts`, `web/src/left_sidebar_navigation_area.ts`.

## 큰 구조

```
#left-sidebar
  #left-sidebar-search                 필터 입력, 채널 추가(+), 폴더 메뉴(⋮)
  #left-sidebar-navigation-area
    #views-label-container             "VIEWS" 제목
    #left-sidebar-navigation-list      보기 목록 (li.top_left_row)
  #left_sidebar_scroll_container       simplebar 스크롤 영역
    #direct-messages-section-header    "DIRECT MESSAGES" 제목
    .direct-messages-container
      #direct-messages-list            DM 목록
    #streams_list
      #stream-filters-container
        #stream_filters                채널 섹션들이 들어감
  #left-sidebar-modal                  "더 보기" DM / 토픽 모달
```

## 섹션 제목

모든 섹션 제목은 `.left-sidebar-section-header` 안의 `h4.left-sidebar-title`입니다.

- "VIEWS", "DIRECT MESSAGES"는 번역 문자열 자체가 대문자입니다 (`sidebar_ui.ts`, `pm_list.ts`). CSS `text-transform`으로 대문자를 만드는 게 아닙니다.
- 채널 폴더 이름은 JS에서 `folder.name.toUpperCase()`로 대문자로 바꿉니다 (`stream_list_sort.ts`). 그 밖의 섹션 제목은 "PINNED CHANNELS", "CHANNELS"입니다.
- 제목 색, 굵기, 자간, 투명도는 `--color-text-sidebar-heading`, `--font-weight-sidebar-heading`(600), `--letter-spacing-sidebar-heading`, `--opacity-sidebar-heading`(0.7) 변수로 정합니다.

노션 테마는 `text-transform: lowercase`에 `::first-letter` 대문자를 더해서 "Views"처럼 보이게 합니다. 폴더 제목은 `enhance.js`가 `data-zr-label`에 문장형 이름을 넣고 CSS가 그 값을 대신 보여줍니다.

## 보기 목록 (`left_sidebar_expanded_view_item.hbs`)

```html
<li class="top_left_{{css_class_suffix}} top_left_row">
  <a href="#{{fragment}}" class="left-sidebar-navigation-label-container">
    <span class="filter-icon"><i class="zulip-icon {{icon}}"></i></span>
    <span class="left-sidebar-navigation-label">{{name}}</span>
    <span class="unread_count ..."></span>
  </a>
</li>
```

아이콘 클래스 (`web/src/navigation_views.ts`):

| 보기 | 아이콘 |
| --- | --- |
| Inbox | `zulip-icon-inbox` |
| Recent conversations | `zulip-icon-recent` |
| Combined feed | `zulip-icon-all-messages` |
| Mentions | `zulip-icon-at-sign` |
| Reactions | `zulip-icon-smile` |
| Starred messages | `zulip-icon-star` |
| Drafts | `zulip-icon-drafts` |
| Scheduled messages | `zulip-icon-calendar-days` |
| Reminders | `zulip-icon-alarm-clock` |

아이콘 색은 `#left-sidebar-navigation-list .filter-icon i { color: var(--color-left-sidebar-navigation-icon) }`입니다.

## 개인 메시지 행 (`pm_list_item.hbs`)

```html
<li class="dm-list-item bottom_left_row [active-sub-filter] [zero-dm-unreads]"
    data-user-ids-string="12">
  <a class="dm-box dm-user-status" data-user-ids-string="12" data-is-group="false">
    <!-- 1:1 대화 -->
    <span class="conversation-partners-icon zulip-icon zulip-icon-user-circle-active user-circle-active user-circle"></span>
    <!-- 그룹 대화면 대신 -->
    <span class="conversation-partners-icon zulip-icon zulip-icon-dm-groups-3"></span>
    <span class="conversation-partners">
      <span class="conversation-partners-list">이름들</span>
    </span>
    <div class="dm-markers-and-unreads">
      <span class="unread_mention_info">@</span>   <!-- 멘션이 있을 때만 -->
      <span class="unread_count [zero_count]">3</span>
    </div>
  </a>
</li>
```

- `data-is-group`이 `"true"`/`"false"`라서 1:1과 그룹을 CSS로 나눌 수 있습니다.
- 1:1 대화의 `data-user-ids-string`은 상대 한 명의 id입니다. 아바타는 `/avatar/<id>`로 가져옵니다([icons-and-variables.md](icons-and-variables.md)).
- 안 읽은 메시지가 없으면 `li`에 `zero-dm-unreads`가 붙습니다.
- 현재 보고 있는 대화는 `li.active-sub-filter`입니다.

`.dm-box`는 grid입니다. 왼쪽 아이콘 칸 폭이 `--left-sidebar-icon-column-width`(1em), 아이콘과 이름 사이가 `--left-sidebar-icon-content-gap`입니다. `.dm-box`에서 이 변수를 바꾸면 아이콘 칸만 넓어집니다. 아이콘은 `grid-area: starting-anchor-element`에 놓이고, 같은 칸에 다른 요소를 겹쳐 놓을 수 있습니다. 디스코드/노션 테마는 이 칸에 아바타를 넣고 상태 점을 오른쪽 아래로 옮깁니다.

## 채널 폴더 섹션 (`stream_list_section_container.hbs`)

```html
<div id="stream-list-{{id}}-container" data-section-id="{{id}}"
     class="stream-list-section-container [collapsed] [no-display]">
  <div class="left-sidebar-section-header stream-list-subsection-header">
    <i class="stream-list-section-toggle ... zulip-icon-heading-triangle-right rotate-icon-down"></i>
    <h4 class="left-sidebar-title">GENEARL</h4>
    <a class="add-stream-icon-container">...</a>      <!-- 있을 때만 -->
    <div class="markers-and-unreads">
      <span class="unread_mention_info"></span>      <!-- 멘션이 있으면 "@" -->
      <span class="unread_count normal-count"></span>
      <span class="masked_unread_count">...</span>
    </div>
  </div>
  <ul id="stream-list-{{id}}" class="stream-list-section"></ul>
</div>
```

- 접으면 컨테이너에 `collapsed`가 붙고, 토글 아이콘은 `rotate-icon-down`과 `rotate-icon-right`가 바뀝니다 (`stream_list.ts`).
- 보여줄 채널이 없는 섹션은 `no-display`입니다.
- 섹션 제목의 `.unread_count`에 섹션 전체의 안 읽은 수가 들어갑니다. 디스코드 레일은 이 값과 `.unread_mention_info`를 읽어서 표시합니다.

## 채널 행 (`stream_sidebar_row.hbs`)

```html
<li class="narrow-filter [active-filter] [out_of_home_view]" data-stream-id="{{id}}">
  <div class="bottom_left_row channel-header">
    <a href="{{url}}" class="subscription_block selectable_sidebar_block
                              [stream-with-count] [has-unmuted-unreads] ...">
      <span class="stream-privacy filter-icon" style="color: {{color}}">
        <i class="zulip-icon zulip-icon-hashtag"></i>   <!-- lock / globe / archive -->
      </span>
      <span class="stream-name">{{name}}</span>
      <div class="left-sidebar-controls">...</div>
      <div class="stream-markers-and-unreads">
        <span class="unread_mention_info"></span>
        <span class="unread_count normal-count"></span>
      </div>
      <span class="sidebar-menu-icon stream-sidebar-menu-icon">⋮</span>
    </a>
  </div>
  <!-- 펼쳐진 채널이면 아래에 topic-list -->
</li>
```

- 채널 아이콘 색은 채널마다 인라인 `style="color: ..."`로 들어갑니다. 덮어쓰려면 `!important`가 필요합니다.
- 공개 범위 아이콘 (`stream_privacy.hbs`): 보관됨 `zulip-icon-archive`, 비공개 `zulip-icon-lock`, 웹 공개 `zulip-icon-globe`, 그 밖에는 `zulip-icon-hashtag`.
- 안 읽은 상태 클래스 (`stream_list.ts`): `stream-with-count`, `has-unmuted-unreads`, `has-only-muted-unreads`, `has-unmuted-mentions`, `has-only-muted-mentions`. 모두 `.subscription_block`에 붙습니다.
- 현재 채널은 `li.narrow-filter.active-filter`입니다.

## 행 상태 스타일

```css
.top_left_row, .bottom_left_row { border-radius: 4px; }
/* hover: 1px 안쪽 테두리 + 배경 */
&:hover { box-shadow: inset 0 0 0 1px var(--color-shadow-sidebar-row-hover); }
&:not(.active-sub-filter):hover { background-color: var(--color-background-hover-narrow-filter); }

li.active-filter, li.top-left-active-filter, li.active-sub-filter {
    font-weight: 600 !important;
    color: var(--color-text-active-narrow-filter);
    background-color: var(--color-background-active-narrow-filter);
}
```

디스코드와 노션 테마는 hover 테두리(`box-shadow`)를 없애고 배경만 남깁니다.
