# 메시지 목록과 상단 내비바

## 상단 내비바 제목 (`web/templates/message_view_header.hbs`, `navbar_icon_and_title.hbs`)

`#message_view_header`가 지금 보고 있는 화면의 제목입니다.

```html
<div id="message_view_header">
  <!-- 채널 화면 -->
  <a class="message-header-stream-settings-button" href="...">
    <i class="navbar-icon zulip-icon zulip-icon-hashtag"></i>
    <span class="message-header-navbar-title">채널 이름</span>
  </a>
  <span class="narrow_description rendered_markdown">채널 설명</span>

  <!-- 그 밖의 화면 (DM, 받은편지함, 검색 등) -->
  <span class="navbar_title">
    <i class="navbar-icon zulip-icon zulip-icon-..."></i>
    <span class="message-header-navbar-title">제목</span>
  </span>
  <span class="narrow_description">설명</span>
</div>
```

노션 테마의 큰 제목은 여기서 `.message-header-navbar-title` 텍스트, `.narrow_description` 텍스트, `.navbar-icon`의 `zulip-icon-*` 클래스를 읽어 만듭니다.

## 피드 안에 요소를 넣을 자리

`#main_div` 안에서 `#message-lists-container` 바로 앞에 넣습니다([layout.md](layout.md)의 뼈대 참고). 메시지 목록은 화면이 바뀔 때마다 `#message-lists-container` 안에서 새로 만들어집니다. 그 앞에 둔 요소는 목록이 바뀌어도 남고, 이전 메시지를 더 불러와도 목록 맨 위에 있습니다. 노션 테마의 큰 제목이 이 자리를 씁니다.

## 메시지 행 (`single_message.hbs`, `message_body.hbs`)

```html
<div class="message_row [private-message] [messagebox-includes-sender]
            [direct_mention | group_mention] [unread] selectable_row"
     data-message-id="123">
  <div class="messagebox">
    <div class="messagebox-content">
      <!-- 보낸 사람이 바뀔 때만 -->
      <div class="message-avatar"> <img class="inline_profile_picture"> </div>
      <span class="message_sender">
        <span class="sender_name">
          <span class="sender_name_text"><span class="user-name">이름</span></span>
        </span>
      </span>
      <a class="message-time">11:07 AM</a>
      <div class="message_content rendered_markdown">본문</div>
      <div class="message_reactions">...</div>
    </div>
  </div>
</div>
```

- 나를 멘션한 메시지는 `direct_mention`, 그룹 멘션은 `group_mention` 클래스가 붙습니다. 배경은 `--color-background-direct-mention`, `--color-background-group-mention` 변수입니다 (`web/styles/message_row.css`).
- 본문 안 멘션 알약의 색은 `--color-background-text-direct-mention`, `--color-text-self-direct-mention`(그룹은 `group`)입니다.
- 선택된 메시지는 `.selected_message`이고 `--color-selected-message-outline` 테두리가 그려집니다.
- 대화 묶음 위의 제목 줄은 `.message_header .message-header-contents`입니다. 채널 메시지는 채널 색이 인라인 배경으로 들어가서 덮어쓰려면 `!important`가 필요합니다. DM은 `.message_header_private_message`입니다.

## 입력창

- `#compose-content`가 입력 영역 전체 상자입니다. 가운데 열과 같은 `margin-left` 계산을 씁니다.
- 색 변수: `--color-compose-box-background`, `--color-compose-message-content-background`, `--color-border-compose-content`, 보내기 버튼 `--color-compose-send-button-background`.
