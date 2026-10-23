# 레이아웃

## 뼈대 (`templates/zerver/app/index.html`)

```
#navbar-fixed-container          상단 고정 바 (position: fixed)
  #header-container              navbar.hbs가 들어감
.app
  .app-main                      position: relative, 가운데 정렬 가능
    .column-left#left-sidebar-container
      .left-sidebar#left-sidebar     (left_sidebar.hbs) position: fixed
    .column-middle
      .column-middle-inner
        #recent_view             최근 대화 보기
        #inbox-view              받은편지함 보기
        #message_feed_container
          .message-feed#main_div
            .top-messages-logo
            #loading_older_messages_indicator
            #page_loading_indicator
            #message_feed_errors_container
            #message-lists-container     메시지 목록이 여기 들어감
            #scheduled_message_indicator
            #typing_notifications
            #bottom_whitespace
        #compose > #compose-container    입력창
    .column-right#right-sidebar-container
      .right-sidebar#right-sidebar   (right_sidebar.hbs) position: fixed
```

상단 내비바(`navbar.hbs`)도 `.column-left`, `.column-middle`, `.column-right`를 가지고 있습니다. 그래서 `.column-left` 같은 선택자는 내비바와 본문 양쪽에 걸립니다. 본문만 고르려면 `.app-main .column-left`처럼 씁니다.

## 폭 변수 (`web/styles/app_variables.css`, `web/styles/zulip.css`)

| 변수 | 값 | 쓰이는 곳 |
| --- | --- | --- |
| `--left-sidebar-max-width` | `calc(20.6429em - var(--left-sidebar-right-margin))` (14px 기준 약 289px) | 왼쪽 최대 폭 |
| `--left-sidebar-width` | `min(33.3333vw, var(--left-sidebar-max-width))` | `.column-left`, `.left-sidebar` 폭 |
| `--left-sidebar-padding-left` | `8px` | `.left-sidebar` 왼쪽 안쪽 여백 |
| `--right-sidebar-width` | `min(20vw, var(--right-sidebar-max-width))` | `.column-right` 폭 |
| `--navbar-fixed-height` | 내비바 높이 | 사이드바와 메시지 목록의 `padding-top` |

가운데 열과 입력창의 왼쪽 여백은 이렇게 계산됩니다 (`zulip.css`).

```css
.column-middle,
#compose-content {
    margin-right: var(--right-sidebar-width);
    margin-left: calc(var(--left-sidebar-width) + var(--left-sidebar-padding-left));
}
```

`.left-sidebar`는 `width: var(--left-sidebar-width); padding-left: var(--left-sidebar-padding-left)`이고 box-sizing이 content-box입니다. 따라서 `--left-sidebar-padding-left`만 늘리면 사이드바 내용과 가운데 열이 같이 오른쪽으로 밀립니다. 디스코드 테마의 왼쪽 레일은 이 성질을 이용해서 이 변수를 `레일 폭 + 8px`로 바꿉니다.

## 가운데 정렬

`.header-main`, `.app .app-main`, `#compose-container`에는 `max-width`가 걸려 있습니다(왼쪽 최대 + 본문 최대 + 오른쪽 최대). 화면이 그보다 넓으면 전체가 가운데로 모이고, 왼쪽 사이드바는 화면 왼쪽 끝에 붙지 않습니다. 개인 설정의 "fluid layout width"를 켜면(`body.fluid_layout_width`) 제한이 풀립니다.

그래서 화면 왼쪽 끝 기준으로 `position: fixed; left: 0`인 요소를 두면 넓은 화면에서 사이드바와 떨어집니다. 레일은 `#left-sidebar-container` 안에 넣고 `left`를 지정하지 않았습니다. 그러면 fixed 요소가 원래 놓일 자리, 즉 왼쪽 열의 시작 지점에 붙습니다.

## 사이드바 숨김과 기준점

- 기준점 (`web/src/css_variables.ts`): `sm 576`, `md 768`, `mc 849`, `lg 992`, `xl 1200` (px). 컨테이너 쿼리용 `cq_*_min`은 같은 값을 16px 기준 em으로 바꾼 것입니다.
- `.app` 폭이 `md`보다 좁으면 왼쪽 사이드바가 숨겨지고(`@container app (width < $cq_md_min)`), 버튼으로 열면 `.column-left.expanded` 오버레이로 뜹니다. 이때 `.left-sidebar`의 `padding-left`는 10px로 고정됩니다.
- `xl`보다 좁으면 오른쪽 사이드바가 숨겨집니다.
- 사용자가 사이드바를 접으면 `body.hide-left-sidebar`, `body.hide-right-sidebar`가 붙습니다 (`web/src/sidebar_ui.ts`). 이때 가운데 열의 `margin-left`는 7px로 바뀌어서 폭 변수의 영향을 받지 않습니다.
- `.column-left`가 `display: none`이 되면 그 안의 레일도 같이 사라집니다. 오버레이(`.column-left.expanded`)일 때는 레일을 따로 숨깁니다.

## z-index

- `.left-sidebar`, `.right-sidebar`: `z-index: 100` (fixed)
- 펼친 사이드바 오버레이 `.column-left.expanded`: 10, 맨 위일 때 15
- 레일: 101 (사이드바 위)
