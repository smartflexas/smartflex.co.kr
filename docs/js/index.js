/**
 * ===============================================
 * 📄 파일명: docs/js/index.js
 * ===============================================
 * 
 * 📌 파일 목적:
 * SmartFlex 인덱스 페이지(index.html)의 사용자 인터랙션 처리를 담당합니다.
 * 네비게이션 메뉴, 기술 스택 버튼, 연락처 등의 클릭 이벤트를 감지하고,
 * 슬라이딩 모달을 통해 pages/* 콘텐츠를 iframe으로 동적 로드합니다.
 * 
 * 🎯 핵심 기능:
 * - 네비게이션 링크 및 버튼 클릭 처리
 * - 슬라이딩 모달 열기/닫기
 * - iframe을 통한 페이지 동적 로드
 * - ESC 키, Enter 키 등 키보드 접근성 지원
 * 
 * 📦 의존성:
 * - docs/index.html: pageModal, modalIframe, modalTitle 요소 필요
 * - docs/css/style.css + docs/css/index.css: 모달 스타일
 * - pages/*.html: about.html, tech.html, contact.html
 * 
 * ===============================================
 */

/**
 * 페이지 맵 상수 (const)
 * 
 * @type {Object<string, {title: string, url: string}>}
 * 설명:
 *   - 각 내비게이션 링크에 대응하는 페이지 정보를 저장하는 객체
 *   - 'about', 'tech', 'contact' 등 data-page 속성값이 키
 *   - 각 키는 { title: 모달 헤더 제목, url: iframe src 경로 } 형태의 객체
 * 
 * 사용 예:
 *   pageMap.about => { title: '소개', url: 'pages/about.html' }
 */
const pageMap = {
  about: { title: '소개', url: 'pages/about.html' },
  tech: { title: '기술 스택', url: 'pages/tech.html' },
  contact: { title: '연락처', url: 'pages/contact.html' }
};


/**
 * 네비게이션 링크의 현재 선택 상태와 aria-current를 동기화합니다.
 * @param {string|null} pageName - 활성화할 pageMap 키 또는 초기화 값
 */
function setActiveNavigation(pageName) {
  document.querySelectorAll('[data-page]').forEach(element => {
    const isActive = pageName && element.dataset.page === pageName && element.tagName === 'A';
    element.classList.toggle('active', Boolean(isActive));
    if (isActive) element.setAttribute('aria-current', 'page');
    else element.removeAttribute('aria-current');
  });
}

/** 모바일 햄버거 네비게이션을 닫고 aria-expanded 상태를 초기화합니다. */
function closeMobileNavigation() {
  const navLinks = document.getElementById('navLinks');
  const hamburger = document.querySelector('.hamburger');
  if (navLinks) navLinks.classList.remove('active');
  if (hamburger) {
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
  }
}

/** 초기 URL 해시(#about 등)를 읽어 딥링크 모달을 엽니다. */
function openInitialHash() {
  const pageName = location.hash.replace('#', '');
  if (pageName && pageMap[pageName]) openPage(pageName);
}

/**
 * 함수명: openPage(pageName)
 * 
 * 📝 함수 설명:
 * 사용자가 클릭한 내비게이션 링크(약 또는 연락처 등)에 해당하는 페이지를 모달로 열기
 * 
 * 🔧 파라미터:
 *   @param {string} pageName
 *     - 설명: pageMap 객체의 키값 (예: 'about', 'tech', 'contact')
 *     - 출처: 마크업의 data-page 속성 (예: <a href="#" data-page="about">)
 *     - 검증: pageMap에 존재하는 값만 처리
 * 
 * 🔄 처리 순서:
 *   1. DOM에서 pageModal, modalIframe, modalTitle 요소를 선택
 *   2. 요소가 존재하는지 방어적으로 검증 (null 체크)
 *   3. pageMap에서 pageName 키로 페이지 정보 조회
 *   4. 페이지 정보가 존재하는지 검증
 *   5. 모달 제목(title 엘리먼트) 업데이트
 *   6. iframe src 속성에 페이지 URL 설정
 *   7. modal에 'active' 클래스 추가 → CSS 애니메이션 시작 (sliding up)
 * 
 * 📊 예시:
 *   openPage('about')
 *   → modalTitle.textContent = '소개'
 *   → modalIframe.src = 'pages/about.html'
 *   → pageModal.classList.add('active')
 * 
 * ⚠️ 에러 처리:
 *   - DOM 요소 없으면 조용히 반환 (early return)
 *   - pageMap에 없는 pageName이면 조용히 반환
 */
function openPage(pageName) {
  // === 1단계: DOM 요소 선택 ===
  const modal = document.getElementById('pageModal');      // 모달 전체 컨테이너
  const iframe = document.getElementById('modalIframe');   // 페이지 콘텐츠를 로드할 iframe
  const title = document.getElementById('modalTitle');     // 모달 헤더에 표시할 제목

  // === 2단계: 요소 존재 여부 검증 (defensive programming) ===
  if (!modal || !iframe || !title) return;

  // === 3단계: 요청한 페이지 정보 조회 ===
  const page = pageMap[pageName];
  if (!page) return;

  // === 4단계: 모달 헤더 제목 및 접근성 속성 설정 ===
  title.textContent = page.title;
  iframe.title = page.title;
  setActiveNavigation(pageName);

  // === 5단계: iframe 콘텐츠 URL 설정 및 로딩 상태 표시 ===
  modal.classList.add('loading');
  iframe.onload = () => modal.classList.remove('loading');
  iframe.src = page.url;
  if (location.hash !== `#${pageName}`) {
    history.pushState({ page: pageName }, page.title, `#${pageName}`);
  }

  // === 6단계: 모달 활성화 - CSS 애니메이션 트리거 ===
  // CSS의 .page-modal.active { transform: translateY(0) } 규칙으로 슬라이딩 애니메이션 실행
  modal.classList.add('active');
}

/**
 * 함수명: closeAllModals()
 * 
 * 📝 함수 설명:
 * 현재 열려있는 모든 모달을 닫고, iframe 콘텐츠를 정리하기
 * 사용자가 닫기 버튼 클릭, ESC 키 입력, 모달 바깥 클릭 등의 상황에서 호출됨
 * 
 * 🔄 처리 순서:
 *   1. pageModal, modalIframe DOM 요소 선택
 *   2. 요소 존재 여부 검증
 *   3. modal에서 'active' 클래스 제거 → CSS로 슬라이딩 애니메이션 시작
 *   4. 슬라이딩 애니메이션 완료 후(500ms, style.css의 transition 시간)
 *   5. iframe src를 빈 문자열로 설정하여 불필요한 콘텐츠 언로드
 * 
 * 📊 상태 전환:
 *   BEFORE: modal.classList = ['page-modal', 'active'] → 화면 아래에서 올라옴
 *   AFTER:  modal.classList = ['page-modal']         → 화면 아래로 내려감
 * 
 * ⚠️ setTimeout 사용 이유:
 *   - CSS transition이 0.5초 걸리므로, 그 동안 iframe이 표시되는 것을 방지
 *   - transition 완료 후에야 iframe src를 변경하여 부드러운 애니메이션 보장
 * 
 * 🎭 애니메이션:
 *   <css: .page-modal.active { transform: translateY(0) }>
 *   <css: .page-modal { transform: translateY(100%) }>
 *   transition: transform 0.5s cubic-bezier(...)
 */
function closeAllModals() {
  // === 1단계: DOM 요소 선택 ===
  const modal = document.getElementById('pageModal');      // 모달 컨테이너
  const iframe = document.getElementById('modalIframe');   // iframe 요소
  
  // === 2단계: 요소 존재 여부 검증 ===
  if (!modal || !iframe) return;

  // === 3단계: 모달 비활성화 - 슬라이딩 다운 애니메이션 시작 ===
  modal.classList.remove('active', 'loading');
  setActiveNavigation(null);
  closeMobileNavigation();
  if (location.hash) {
    history.pushState({}, '', location.pathname);
  }
  
  // === 4단계: 애니메이션 완료 후 iframe 콘텐츠 언로드 ===
  // 0.5초는 docs/css/index.css의 transition 시간과 동일
  // 이렇게 하면 애니메이션 중에 콘텐츠 변경으로 인한 깜빡임 방지
  setTimeout(() => {
    iframe.src = '';  // iframe 소스 제거 = 페이지 언로드 = 메모리 절약
  }, 500);
}

/**
 * 함수명: bindIndexEvents()
 * 
 * 📝 함수 설명:
 * index.html의 모든 상호작용 이벤트를 설정하는 핵심 함수
 * DOMContentLoaded 이벤트 후에 호출되어 마크업 요소에 이벤트 리스너를 등록
 * 모든 이벤트 바인딩은 addEventListener 기반 (onclick 속성 사용 금지)
 * 
 * 🎯 바인딩 대상 요소들:
 *   1. [data-page] 속성 요소들: 네비게이션 링크, 버튼 (예: <a data-page="about">)
 *   2. [data-action="close"] 요소들: 닫기 버튼, 모달 오버레이 (접근성 지원)
 *   3. .modal-close 요소: 모달 헤더의 X 버튼
 *   4. document (글로벌): ESC 키 처리
 * 
 * 🔄 4가지 이벤트 핸들링 섹션:
 * ===============================================
 */
function bindIndexEvents() {

  /**
   * === 섹션 0: 모바일 햄버거 메뉴 토글 ===
   */
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('active');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });
  }

  /**
   * === 섹션 1: [data-page] 요소들의 click 이벤트 ===
   * 
   * 목적:
   *   네비게이션 메뉴 항목 및 기술 스택 버튼 클릭 시 모달 열기
   * 
   * 선택자: document.querySelectorAll('[data-page]')
   *   - 모든 <a>, <button> 요소 중 data-page 속성을 가진 것
   *   - 예: <a href="#" data-page="about">소개</a>
   *   - 예: <button data-page="contact">연락하기</button>
   * 
   * 이벤트 흐름:
   *   1. 사용자가 요소 클릭
   *   2. event.preventDefault() 실행 → href="#" 기본 동작 방지
   *   3. element.dataset.page에서 페이지명 추출
   *   4. openPage(pageName) 호출 → 모달 열기
   */
  document.querySelectorAll('[data-page]').forEach(element => {
    element.addEventListener('click', (event) => {
      event.preventDefault();  // 기본 링크 동작 차단
      const pageName = element.dataset.page;  // <a data-page="about"> → pageName = 'about'
      if (pageName) {
        openPage(pageName);
        closeMobileNavigation();
      }  // pageMap에 존재하는 경우만 처리
    });
  });

  /**
   * === 섹션 2: [data-action="close"] 요소들의 click & keydown 이벤트 ===
   * 
   * 목적:
   *   닫기 버튼 및 모달 오버레이 클릭 시 모달 닫기
   *   키보드 접근성 지원 (Enter, Space 키)
   * 
   * 선택자: document.querySelectorAll('[data-action="close"]')
   *   - 예: <div data-action="close" role="button" tabindex="0">
   *   - 예: <button data-action="close">
   * 
   * 이벤트 1 (click):
   *   - 마우스 클릭으로 모달 닫기
   *   - closeAllModals() 호출
   * 
   * 이벤트 2 (keydown):
   *   - Enter 키 또는 Space 키로도 모달 닫기 가능
   *   - role="button" + tabindex="0"인 <div> 요소에 필수 (접근성)
   *   - event.preventDefault() 로 기본 동작 차단 (페이지 스크롤 등)
   */
  document.querySelectorAll('[data-action="close"]').forEach(element => {
    // click 이벤트: 마우스로 닫기
    element.addEventListener('click', closeAllModals);
    
    // keydown 이벤트: 키보드(Enter, Space)로 닫기 - 접근성
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();  // Space 키 기본 동작(스크롤) 방지
        closeAllModals();
      }
    });
  });

  /**
   * === 섹션 3: .modal-close 버튼의 click 이벤트 ===
   * 
   * 목적:
   *   모달 헤더 오른쪽의 X 버튼 클릭으로 모달 닫기
   * 
   * 선택자: document.querySelector('.modal-close')
   *   - 예: <button class="modal-close">×</button>
   *   - querySelector (단수): 첫 번째 일치 요소만 선택
   * 
   * 존재 여부 검증:
   *   - closeButton이 null일 수 있으므로 if 조건으로 검증
   *   - 존재하는 경우만 addEventListener 호출
   * 
   * 이벤트:
   *   - click: closeAllModals() 호출
   */
  const closeButton = document.querySelector('.modal-close');
  if (closeButton) closeButton.addEventListener('click', closeAllModals);

  /**
   * === 섹션 4: ESC 키의 전역 keydown 이벤트 ===
   * 
   * 목적:
   *   사용자가 ESC 키를 누르면 현재 열려있는 모달 닫기
   *   웹 표준 UX 패턴 (모달, 팝업 등)
   * 
   * 리스너 대상: document (전체 페이지)
   *   - 모든 keydown 이벤트 감시
   *   - event.key === 'Escape' 체크
   * 
   * 이벤트 흐름:
   *   1. 사용자가 ESC 키 입력
   *   2. keydown 이벤트 발생
   *   3. event.key === 'Escape' 비교
   *   4. closeAllModals() 호출 → 모달 닫기
   * 
   * 유의사항:
   *   - event.preventDefault() 호출 안 함 (ESC는 기본 동작 없음)
   *   - 버블링으로 인해 중첩 요소에서도 감지됨
   */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });

  window.addEventListener('popstate', () => {
    const pageName = location.hash.replace('#', '');
    if (pageName && pageMap[pageName]) openPage(pageName);
    else closeAllModals();
  });

  document.querySelectorAll('[data-era-index]').forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.eraIndex);
      if (window._dnaUniverse && Number.isInteger(index)) window._dnaUniverse.setEra(index);
    });
  });

  openInitialHash();
}


/**
 * === 초기화 (Initialization) ===
 * 
 * 목적:
 *   bindIndexEvents() 함수를 정확한 시점에 실행
 *   HTML 파싱이 완료된 후에만 DOM 조작을 하기 위한 안전장치
 * 
 * document.readyState 3가지 상태:
 *   1. 'loading':       HTML 파싱 중 (아직 끝나지 않음)
 *   2. 'interactive':   HTML 파싱 완료, defer 스크립트 실행 중
 *   3. 'complete':      모든 리소스 로드 완료 (이미지, CSS 등)
 * 
 * 🔄 실행 로직:
 *   - 현재 상태가 'loading'이면:
 *     → DOMContentLoaded 이벤트 대기 후 bindIndexEvents() 실행
 *   - 현재 상태가 'loading'이 아니면 (즉, 'interactive' 또는 'complete'):
 *     → 이 스크립트가 늦게 로드되었다는 뜻
 *     → 바로 bindIndexEvents() 실행 (더 이상 대기할 필요 없음)
 * 
 * 📌 왜 이렇게 복잡한가?
 *   - 이 스크립트 로드 타이밍이 불명확할 수 있음
 *   - defer 속성으로 로드되면, DOMContentLoaded 이후 실행될 수도 있음
 *   - 비동기 로드 또는 지연 로드되는 경우도 있음
 *   - 따라서 현재 상태를 체크해서 그에 맞게 처리
 * 
 * 📊 예시 상황들:
 *   상황 1: 스크립트가 <head>에 있고 defer 속성 있음
 *     → <script src="index.js" defer></script>
 *     → HTML 파싱 중일 때 로드
 *     → readyState = 'loading'
 *     → DOMContentLoaded 이벤트 등록 후 대기
 *     → HTML 파싱 완료 → DOMContentLoaded 발생 → bindIndexEvents() 실행 ✓
 * 
 *   상황 2: 스크립트가 </body> 바로 앞에 있음
 *     → </body 바로 앞: <script src="index.js"></script>
 *     → HTML 파싱이 거의 완료된 상태에서 로드
 *     → readyState = 'interactive' 또는 'complete'
 *     → if (document.readyState === 'loading') 조건이 거짓
 *     → else 블록 실행 → bindIndexEvents() 즉시 실행 ✓
 */
if (document.readyState === 'loading') {
  // HTML 파싱이 아직 진행 중 → DOMContentLoaded 이벤트 대기
  document.addEventListener('DOMContentLoaded', bindIndexEvents);
} else {
  // HTML 파싱이 이미 완료 → 즉시 실행
  bindIndexEvents();
}
