# 오른쪽 사용자 목록 (buddy list)

템플릿: `web/templates/right_sidebar.hbs`, `web/templates/presence_row.hbs`, `web/templates/buddy_list/section_header.hbs`. 스타일: `web/styles/right_sidebar.css`, `web/styles/user_circles.css`.

## 구조

```
#right-sidebar
  .right-sidebar-items
    #user-list[.with_avatars]
      #userlist-header                  "Filter users" 입력과 ⋮ 메뉴
      #buddy_list_wrapper               simplebar 스크롤 영역
        #buddy-list-participants-container       "THIS CONVERSATION"
          .buddy-list-subsection-header
          ul#buddy-list-participants.buddy-list-section
        #buddy-list-users-matching-view-container  채널을 볼 때의 구독자
          ...
        #buddy-list-other-users-container        "OTHERS"
          ...
        .invite-user-shortcut           "Invite to organization"
```

섹션은 화면에 따라 보이는 것만 보입니다(`.no-display`). 대화를 보고 있으면 참여자 섹션, 채널을 보고 있으면 구독자 섹션이 쓰입니다.

## 섹션 제목 (`buddy_list/section_header.hbs`)

```html
<i class="buddy-list-section-toggle zulip-icon zulip-icon-heading-triangle-right rotate-icon-down"></i>
<h5 class="buddy-list-heading no-style">
  <span class="buddy-list-heading-text">THIS CONVERSATION</span>
  <span class="buddy-list-heading-user-count-with-parens hide">
    (<span class="buddy-list-heading-user-count"></span>)
  </span>
</h5>
```

괄호는 별도 요소가 아니라 `-with-parens` 안의 텍스트 노드입니다. 괄호를 없애려면 바깥 span의 `font-size`를 0으로 하고 안쪽 `.buddy-list-heading-user-count`에 크기를 다시 줍니다. 디스코드 테마는 앞에 "— ", 노션 테마는 "· "를 `::before`로 붙입니다.

## 사용자 행 (`presence_row.hbs`)

표시 방식은 개인 설정 "사용자 목록 스타일"(`user_list_style`)에 따라 세 가지입니다.

```html
<li data-user-id="12" data-name="이름"
    class="user_sidebar_entry [with_avatar] [with_status] [user_sidebar_entry_me] narrow-filter [user-fade]">
  <div class="selectable_sidebar_block">
    <!-- WITH_AVATAR일 때 -->
    <div class="user-profile-picture-container">
      <div class="user-profile-picture avatar-preload-background">
        <img loading="lazy" src="...">
        <span class="zulip-icon zulip-icon-user-circle-active user-circle-active user-circle"></span>
      </div>
    </div>
    <a class="user-presence-link" href="...">
      <div class="user-name-and-status-emoji">
        <span class="user-name">이름</span>
        <span class="my_user_status">(you)</span>     <!-- 본인일 때 -->
        상태 이모지
      </div>
      <span class="status-text">상태 문구</span>
    </a>
    <span class="unread_count">...</span>
  </div>
</li>
```

- 상태 점 클래스: `user-circle-active`, `user-circle-idle`, `user-circle-offline` (`user-circle-deactivated`도 있음). 색 변수는 `--color-user-circle-active`, `--color-user-circle-idle`, `--color-user-circle-offline`입니다.
- 아바타 모드에서 상태 점은 사진 오른쪽 아래에 `position: absolute`로 놓이고, 배경색과 같은 `--color-background` 테두리를 둘러 사진과 떼어 놓습니다. 오프라인이면 점을 숨깁니다.
- 상태 점이 있으면 사진의 오른쪽 아래 모서리만 둥글게 깎습니다(`border-bottom-right-radius: 0.3875em`). 사진 전체를 원형으로 만들려면 `.user-profile-picture`와 `img`에 `border-radius: 50% !important`를 줍니다.
- 다른 사람이 화면에 맞지 않을 때(예: 대화 밖 사용자) `user-fade`가 붙습니다.
- 행 grid: `"avatar row-content markers-and-controls"`, 높이는 `--line-height-sidebar-row-with-avatars`.

이름이 `span.user-name` 하나에 들어 있어서 `enhance.js`가 이름을 읽어 계급을 `data-zr-rank`로 붙이기 쉽습니다. 메시지 보낸 사람 이름도 같은 `user_full_name.hbs`를 써서 같은 방식이 통합니다.
