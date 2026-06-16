/* docs/js/script.js : SmartFlex 기술 상세 모달 및 인터랙션 스크립트입니다. */

const TECH_DATA = {
  lora: {
    icon: "🔬",
    title: "LoRA (Low-Rank Adaptation)",
    tag: "LLM Fine-tuning",
    body: "LoRA는 대형 언어 모델(LLM)을 효율적으로 파인튜닝하는 기법입니다. 전체 모델 가중치를 업데이트하는 대신, 저랭크 행렬(Low-Rank Matrix)만 학습시켜 GPU 메모리와 학습 비용을 획기적으로 절감합니다. GPT, LLaMA, Mistral 등 다양한 베이스 모델에 도메인 특화 지식을 주입할 때 활용합니다. 당사는 의료, 법률, 금융 등 특수 도메인 LLM 파인튜닝 경험을 보유하고 있습니다.",
    links: [{ label: "LoRA 논문 (arXiv)", href: "https://arxiv.org/abs/2106.09685" }, { label: "HuggingFace PEFT", href: "https://huggingface.co/docs/peft" }]
  },
  rag: {
    icon: "📚",
    title: "RAG (Retrieval-Augmented Generation)",
    tag: "Knowledge Retrieval",
    body: "RAG는 LLM의 환각(Hallucination) 문제를 해결하기 위해 외부 지식베이스에서 관련 문서를 검색하여 응답 생성에 활용하는 아키텍처입니다. 벡터 DB(Pinecone, Weaviate, pgvector)를 활용한 시맨틱 검색과 LLM 생성을 결합합니다. 기업 내부 문서, 고객 FAQ, 법규 데이터 등을 실시간으로 참조하는 AI 챗봇 및 검색 시스템 구축에 특화되어 있습니다.",
    links: [{ label: "LangChain RAG", href: "https://python.langchain.com/docs/use_cases/question_answering/" }]
  },
  vertexai: {
    icon: "✨",
    title: "Vertex AI (Gemini)",
    tag: "Google Cloud AI",
    body: "Google Cloud의 통합 AI 플랫폼으로, Gemini Pro/Ultra 모델 API 호출부터 모델 학습, 배포, 모니터링까지 엔드투엔드 MLOps를 지원합니다. 당사는 Vertex AI Workbench, Model Garden, Vector Search를 활용한 엔터프라이즈 AI 파이프라인을 구축합니다. 현재 일 250 요청 무료 한도 내에서 프로토타입을 운영 중이며 프로덕션 전환 시 과금 플랜으로 이전합니다.",
    links: [{ label: "Vertex AI Docs", href: "https://cloud.google.com/vertex-ai/docs" }]
  },
  vision: {
    icon: "👁️",
    title: "Vision AI",
    tag: "Computer Vision",
    body: "Google Cloud Vision API를 활용한 이미지 분석 서비스입니다. OCR(광학 문자 인식), 객체 감지, 얼굴 인식, 안전한 콘텐츠 필터링, 랜드마크 탐지 등의 기능을 REST API로 제공합니다. 월 1,000 요청 무료 한도를 활용해 현재 320건(32%)을 사용 중이며 문서 자동 처리 및 품질 검사 자동화 시스템에 통합되어 있습니다.",
    links: [{ label: "Cloud Vision API", href: "https://cloud.google.com/vision/docs" }]
  },
  stt: {
    icon: "🎙️",
    title: "Speech-to-Text",
    tag: "Audio AI",
    body: "Google Cloud Speech-to-Text API는 오디오를 텍스트로 변환하는 서비스로 125개 이상의 언어와 방언을 지원합니다. 실시간 스트리밍 인식과 배치 처리 모두 지원하며, 도메인 특화 모델 적응(Model Adaptation)을 통해 업계 용어 인식률을 향상시킵니다. 월 60분 무료 한도 중 25분(42%)을 사용 중이며 회의 자동 녹취 및 고객 상담 분석 시스템에 활용합니다.",
    links: [{ label: "Speech-to-Text Docs", href: "https://cloud.google.com/speech-to-text/docs" }]
  },
  translation: {
    icon: "🌐",
    title: "Translation API",
    tag: "NLP · Multilingual",
    body: "Google Cloud Translation API는 130개 이상의 언어 간 신경망 기계 번역(NMT)을 제공합니다. 기본 번역 외에도 커스텀 모델 학습을 통한 도메인 특화 번역이 가능합니다. 월 500,000자 무료 한도 중 120,000자(24%)를 사용 중으로 여유가 충분합니다. 다국어 콘텐츠 자동화, 글로벌 서비스 현지화, 고객 지원 다국어화에 활용합니다.",
    links: [{ label: "Translation API Docs", href: "https://cloud.google.com/translate/docs" }]
  },
  nodejs: {
    icon: "💚",
    title: "Node.js",
    tag: "Backend Runtime",
    body: "Chrome V8 엔진 기반의 비동기 이벤트 드리븐 JavaScript 런타임입니다. 높은 처리량이 필요한 I/O 집약적 API 서버, 실시간 웹소켓 서버, 마이크로서비스 아키텍처 구축에 최적화되어 있습니다. Express.js, Fastify, NestJS 프레임워크와 함께 RESTful API 및 GraphQL 서버를 구축하며, AI 파이프라인의 오케스트레이션 레이어로 활용합니다.",
    links: [{ label: "Node.js 공식 문서", href: "https://nodejs.org/docs" }]
  },
  mongodb: {
    icon: "🍃",
    title: "MongoDB (Atlas Cloud)",
    tag: "NoSQL Document DB",
    body: "MongoDB Atlas는 완전 관리형 클라우드 NoSQL 데이터베이스입니다. JSON 유사 BSON 문서 형식으로 유연한 스키마를 지원하며 수평 확장이 용이합니다. Atlas Vector Search를 활용하면 RAG 파이프라인의 벡터 저장소로도 활용할 수 있습니다. 집계 파이프라인, Change Streams, Atlas Search 등 강력한 기능을 제공합니다.",
    links: [{ label: "MongoDB Atlas", href: "https://cloud.mongodb.com" }, { label: "Atlas Vector Search", href: "https://www.mongodb.com/products/platform/atlas-vector-search" }]
  },
  redis: {
    icon: "🔴",
    title: "Redis (Cloud)",
    tag: "In-Memory Cache",
    body: "Redis는 인메모리 데이터 구조 스토어로, 캐싱, 세션 관리, 실시간 리더보드, pub/sub 메시지 브로커 등 다양한 용도로 활용합니다. Redis Cloud는 완전 관리형 서비스로 자동 복제, 자동 장애 조치, AOF/RDB 영속성을 제공합니다. AI 추론 결과 캐싱, API Rate Limiting, 실시간 알림 시스템 구축에 핵심적으로 사용합니다.",
    links: [{ label: "Redis Cloud", href: "https://cloud.redis.io" }, { label: "Redis 문서", href: "https://redis.io/docs" }]
  },
  cockroachdb: {
    icon: "🪳",
    title: "CockroachDB Cloud",
    tag: "Distributed SQL",
    body: "CockroachDB는 PostgreSQL 호환 분산 SQL 데이터베이스입니다. 글로벌 액티브-액티브 복제와 자동 샤딩을 통해 수평 확장이 가능하며, 노드 장애 시 자동 복구됩니다. ACID 트랜잭션을 완전히 지원하면서 지리적으로 분산된 데이터 배치가 가능해 데이터 레지던시 요구사항을 충족합니다. 금융, 의료 등 강력한 일관성이 필요한 시스템에 적합합니다.",
    links: [{ label: "CockroachDB Cloud", href: "https://cockroachlabs.cloud" }, { label: "CockroachDB 문서", href: "https://www.cockroachlabs.com/docs/" }]
  },
  supabase: {
    icon: "⚡",
    title: "Supabase",
    tag: "Backend-as-a-Service",
    body: "Supabase는 PostgreSQL 기반의 오픈소스 Firebase 대안입니다. 자동 생성된 RESTful API와 GraphQL, 실시간 구독, Row Level Security(RLS) 기반 인증, 파일 스토리지, Edge Functions를 통합 제공합니다. pgvector 확장을 통한 벡터 검색도 지원하여 RAG 시스템의 벡터 저장소로 활용할 수 있습니다. 빠른 MVP 개발과 프로덕션 확장 모두에 적합합니다.",
    links: [{ label: "Supabase", href: "https://supabase.com" }, { label: "pgvector 문서", href: "https://supabase.com/docs/guides/ai/vector-columns" }]
  },
  bigquery: {
    icon: "📊",
    title: "BigQuery",
    tag: "Data Analytics",
    body: "Google Cloud BigQuery는 서버리스 멀티페타바이트 규모의 데이터 웨어하우스입니다. 표준 SQL을 사용하며 수백 TB의 데이터도 초 단위로 쿼리할 수 있습니다. BigQuery ML을 통해 SQL 만으로 머신러닝 모델 학습과 예측이 가능합니다. 월 1TB 무료 쿼리 한도 중 200GB(20%)를 사용 중이며 사용자 행동 분석, AI 학습 데이터 파이프라인, 비즈니스 인텔리전스에 활용합니다.",
    links: [{ label: "BigQuery 콘솔", href: "https://console.cloud.google.com/bigquery" }, { label: "BigQuery ML", href: "https://cloud.google.com/bigquery/docs/bqml-introduction" }]
  },
  cloudrun: {
    icon: "🚀",
    title: "Cloud Run",
    tag: "Serverless Container",
    body: "Google Cloud Run은 완전 관리형 서버리스 컨테이너 플랫폼입니다. Docker 컨테이너를 배포하면 자동으로 스케일링되며 요청이 없을 때는 0 인스턴스로 축소되어 비용을 절감합니다. HTTP 요청 기반과 이벤트 기반(Eventarc) 트리거를 모두 지원합니다. 월 2M 요청 무료 한도 중 450k(23%)를 사용 중이며 AI 추론 API 서버, 웹훅 처리기, 마이크로서비스 배포에 활용합니다.",
    links: [{ label: "Cloud Run 문서", href: "https://cloud.google.com/run/docs" }]
  }
};

// 모달 관련 DOM 요소를 가져옵니다.
const overlay = document.getElementById("modalOverlay");
const modalIcon = document.getElementById("modalIcon");
const modalTitle = document.getElementById("modalTitle");
const modalTag = document.getElementById("modalTag");
const modalBody = document.getElementById("modalBody");
const modalLinks = document.getElementById("modalLinks");
const modalClose = document.getElementById("modalClose");

// 기술 카드 클릭 시 모달을 열고 내용을 채웁니다.
function openModal(key) {
  const d = TECH_DATA[key];
  if (!d) return;
  modalIcon.textContent = d.icon;
  modalTitle.textContent = d.title;
  modalTag.textContent = d.tag;
  modalBody.textContent = d.body;
  modalLinks.innerHTML = "";
  (d.links || []).forEach(l => {
    const a = document.createElement("a");
    a.href = l.href;
    a.textContent = l.label;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "modal-link";
    modalLinks.appendChild(a);
  });
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

// 모달 닫기 동작을 정의합니다.
function closeModal() {
  overlay.classList.remove("active");
  document.body.style.overflow = "";
}

// 기술 카드에 클릭 이벤트를 바인딩합니다.
document.querySelectorAll(".tech-card[data-tech]").forEach(card => {
  card.addEventListener("click", () => openModal(card.dataset.tech));
});

modalClose.addEventListener("click", closeModal);
overlay.addEventListener("click", e => { if (e.target === overlay) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

// 모바일 햄버거 메뉴 토글 동작입니다.
const hamburger = document.getElementById("hamburger");
const navLinks = document.querySelector(".nav-links");
hamburger.addEventListener("click", () => {
  navLinks.style.display = navLinks.style.display === "flex" ? "none" : "flex";
  navLinks.style.flexDirection = "column";
  navLinks.style.position = "absolute";
  navLinks.style.top = "64px";
  navLinks.style.left = "0";
  navLinks.style.right = "0";
  navLinks.style.background = "rgba(9,9,15,0.98)";
  navLinks.style.padding = "16px 24px";
  navLinks.style.borderBottom = "1px solid #2a2a45";
  navLinks.style.gap = "16px";
});

// 스크롤 시 요소가 화면에 나타나면 페이드 인 효과를 적용합니다.
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.style.opacity = "1"; });
}, { threshold: 0.1 });

document.querySelectorAll(".about-card, .tech-card, .quota-table tr").forEach(el => {
  el.style.opacity = "0";
  el.style.transition = "opacity 0.5s ease";
  observer.observe(el);
});