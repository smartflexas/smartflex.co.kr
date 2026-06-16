"/**
 * SmartFlex 개발 DNA 우주 애니메이션 v2.0
 * 파일명: docs/js/dna-animation.js
 * 
 * JSON 기반 데이터 로드, 3D 리본 효과, 태그 시스템, 다양한 움직임 패턴
 * D3.js v7 기반, 바닐라 JavaScript
 */

(function () {
  'use strict';

  let CATEGORIES = [];  // JSON에서 로드
  let ERAS = [];        // JSON에서 로드
  let currentEraIndex = 3; // 기본: 2020s

  /* ═══════════════════════════════════════════════════════════════════
   * ① 설정값
   * ═══════════════════════════════════════════════════════════════════ */
  const CFG = {
    dna: {
      helixRadius: 30,      // DNA 헬릭스 반지름
      helixHeight: 200,     // DNA 높이
      nodeCount: 16,        // 노드 개수
      nodeRadius: 4,        // 노드 크기
      ribbonWidth: 12,      // 리본 너비
      rotationSpeed: 0.001, // DNA 자전 속도
    },
    universe: {
      rotationSpeed: 0.0005, // 우주 회전 속도
      eraTransitionTime: 8000, // 시대 전환 시간 (ms)
    },
    tags: {
      show: true,
      maxVisible: 6,        // 동시에 보이는 최대 태그 수
      fadeDistance: 200,    // 태그가 사라지는 거리
    },
    tooltip: {
      offsetX: 15,
      offsetY: -30,
    }
  };

  /* ═══════════════════════════════════════════════════════════════════
   * ② 움직임 패턴 (각 DNA마다 다른 패턴)
   * ═══════════════════════════════════════════════════════════════════ */
  const MOVEMENT_PATTERNS = {
    orbit: (t, radius, offset) => ({
      x: Math.cos(t + offset) * radius,
      y: Math.sin(t + offset) * radius,
    }),
    spiral: (t, radius, offset) => ({
      x: Math.cos(t + offset) * (radius + Math.sin(t * 3) * 40),
      y: Math.sin(t + offset) * (radius + Math.cos(t * 3) * 40),
    }),
    wave: (t, radius, offset) => ({
      x: Math.cos(t + offset) * radius,
      y: Math.sin(t + offset) * radius + Math.sin(t * 5) * 60,
    }),
    ellipse: (t, radius, offset) => ({
      x: Math.cos(t + offset) * radius * 1.3,
      y: Math.sin(t + offset) * radius * 0.7,
    }),
    figure8: (t, radius, offset) => ({
      x: Math.sin(t + offset) * radius,
      y: Math.sin(t * 2 + offset) * radius * 0.8,
    }),
  };

  /* ═══════════════════════════════════════════════════════════════════
   * ③ DNA 우주 애니메이션 클래스
   * ═══════════════════════════════════════════════════════════════════ */
  class DNAUniverseAnimation {
    constructor(containerId) {
      this.el = document.getElementById(containerId);
      if (!this.el) {
        console.warn('[DNA Universe] 컨테이너를 찾을 수 없습니다.');
        return;
      }

      this.w = 0;
      this.h = 0;
      this.svg = null;
      this.universeTime = 0;
      this.dnaRotations = [];
      this.rafId = null;
      this.lastTs = 0;
      this.hoveredTech = null; // 마우스 오버된 기술

      this._init();
    }

    /* ──────────────────────────────────────
     * 초기화
     * ────────────────────────────────────── */
    async _init() {
      await this._loadData();
      this._setupSVG();
      this._setupTooltip();
      this._startEraRotation();
      this._animate(0);
      
      window.addEventListener('resize', () => this._resize());
    }

    /* ──────────────────────────────────────
     * JSON 데이터 로드
     * ────────────────────────────────────── */
    async _loadData() {
      try {
        const [catData, eraData] = await Promise.all([
          fetch('json/dna-categories.json').then(r => r.json()),
          fetch('json/era-timeline.json').then(r => r.json())
        ]);
        
        CATEGORIES = catData.categories;
        ERAS = eraData.eras;
        
        // 각 DNA 초기 회전값
        CATEGORIES.forEach(() => {
          this.dnaRotations.push(Math.random() * Math.PI * 2);
        });
        
        console.log('[DNA Universe] 데이터 로드 완료:', CATEGORIES.length, '카테고리');
      } catch (error) {
        console.error('[DNA Universe] 데이터 로드 실패:', error);
      }
    }

    /* ──────────────────────────────────────
     * SVG 초기 설정
     * ────────────────────────────────────── */
    _setupSVG() {
      this.w = this.el.offsetWidth || window.innerWidth;
      this.h = this.el.offsetHeight || window.innerHeight;

      this.svg = d3.select(this.el)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('position', 'absolute')
        .style('inset', '0')
        .style('overflow', 'visible');

      // 필터 정의
      const defs = this.svg.append('defs');
      
      // 각 카테고리별 글로우 필터
      CATEGORIES.forEach(cat => {
        const filterId = `glow-${cat.id}`;
        const f = defs.append('filter')
          .attr('id', filterId)
          .attr('x', '-150%').attr('y', '-150%')
          .attr('width', '400%').attr('height', '400%');
        
        f.append('feGaussianBlur')
          .attr('stdDeviation', 6)
          .attr('result', 'coloredBlur');
        
        const feMerge = f.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
      });

      // 그래디언트 (리본용)
      CATEGORIES.forEach(cat => {
        const gradId = `grad-${cat.id}`;
        const gradient = defs.append('linearGradient')
          .attr('id', gradId)
          .attr('x1', '0%').attr('y1', '0%')
          .attr('x2', '0%').attr('y2', '100%');
        
        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', cat.color)
          .attr('stop-opacity', 0.8);
        
        gradient.append('stop')
          .attr('offset', '50%')
          .attr('stop-color', cat.color)
          .attr('stop-opacity', 0.4);
        
        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', cat.color)
          .attr('stop-opacity', 0.8);
      });

      this.gUniverse = this.svg.append('g').attr('class', 'dna-universe');
    }

    /* ──────────────────────────────────────
     * 툴팁 설정
     * ────────────────────────────────────── */
    _setupTooltip() {
      this.tooltip = d3.select('body').append('div')
        .attr('class', 'tech-tooltip')
        .style('position', 'fixed')
        .style('background', 'rgba(26,26,46,0.98)')
        .style('border', '1px solid #2a2a45')
        .style('border-radius', '12px')
        .style('padding', '1rem 1.5rem')
        .style('color', '#e8e8f0')
        .style('font-family', 'Inter, sans-serif')
        .style('font-size', '0.9rem')
        .style('line-height', '1.6')
        .style('max-width', '300px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('z-index', 1000)
        .style('backdrop-filter', 'blur(12px)')
        .style('box-shadow', '0 8px 32px rgba(0,0,0,0.4)');
    }

    /* ──────────────────────────────────────
     * 시대 자동 전환
     * ────────────────────────────────────── */
    _startEraRotation() {
      setInterval(() => {
        currentEraIndex = (currentEraIndex + 1) % ERAS.length;
        this._updateEraDisplay();
      }, CFG.universe.eraTransitionTime);
      
      this._updateEraDisplay();
    }

    _updateEraDisplay() {
      const era = ERAS[currentEraIndex];
      const yearEl = document.getElementById('era-year');
      const descEl = document.getElementById('era-desc');
      
      if (yearEl && era) {
        yearEl.textContent = era.label;
        yearEl.style.color = era.color;
      }
      if (descEl && era) {
        descEl.textContent = era.description;
      }
    }

    /* ──────────────────────────────────────
     * 리사이즈
     * ────────────────────────────────────── */
    _resize() {
      this.w = this.el.offsetWidth || window.innerWidth;
      this.h = this.el.offsetHeight || window.innerHeight;
    }

    /* ──────────────────────────────────────
     * DNA 위치 계산 (움직임 패턴 적용)
     * ────────────────────────────────────── */
    _getDNAPosition(category, index) {
      const cx = this.w * 0.5;
      const cy = this.h * 0.5;
      const movement = category.movement;
      const pattern = MOVEMENT_PATTERNS[movement.type] || MOVEMENT_PATTERNS.orbit;
      
      const t = this.universeTime * movement.speed;
      const pos = pattern(t, movement.radius, movement.offset * Math.PI / 180);
      
      return {
        x: cx + pos.x,
        y: cy + pos.y,
      };
    }

    /* ──────────────────────────────────────
     * 단일 DNA 헬릭스 포인트 계산
     * ────────────────────────────────────── */
    _calcDNAPoints(category, categoryIndex) {
      const points = [];
      const rotation = this.dnaRotations[categoryIndex];
      
      for (let i = 0; i < CFG.dna.nodeCount; i++) {
        const t = i / (CFG.dna.nodeCount - 1);
        const y = -CFG.dna.helixHeight / 2 + t * CFG.dna.helixHeight;
        
        const angle1 = rotation + t * Math.PI * 5;
        const angle2 = angle1 + Math.PI;
        
        const z1 = Math.sin(angle1);
        const z2 = Math.sin(angle2);
        
        const scale1 = 0.7 + 0.3 * ((z1 + 1) / 2);
        const scale2 = 0.7 + 0.3 * ((z2 + 1) / 2);
        
        const techIndex = i % category.techs.length;
        const tech = category.techs[techIndex];
        
        points.push({
          index: i,
          y: y,
          x1: Math.cos(angle1) * CFG.dna.helixRadius,
          x2: Math.cos(angle2) * CFG.dna.helixRadius,
          z1, z2, scale1, scale2,
          opacity1: 0.4 + 0.6 * ((z1 + 1) / 2),
          opacity2: 0.4 + 0.6 * ((z2 + 1) / 2),
          tech: tech,
          category: category,
        });
      }
      
      return points;
    }

    /* ──────────────────────────────────────
     * 전체 렌더링
     * ────────────────────────────────────── */
    _render() {
      this.gUniverse.selectAll('g.dna-group').remove();
      
      CATEGORIES.forEach((category, idx) => {
        const pos = this._getDNAPosition(category, idx);
        const points = this._calcDNAPoints(category, idx);
        
        const dnaGroup = this.gUniverse.append('g')
          .attr('class', 'dna-group')
          .attr('transform', `translate(${pos.x}, ${pos.y})`);
        
        // 리본 (3D 면)
        this._drawRibbon(dnaGroup, points, category);
        
        // 노드
        this._drawNodes(dnaGroup, points, category);
        
        // 태그 (일부만 표시)
        this._drawTags(dnaGroup, points, category, pos);
        
        // 라벨
        this._drawLabel(dnaGroup, category);
      });
    }

    /* ──────────────────────────────────────
     * 리본 그리기 (3D 면 효과)
     * ────────────────────────────────────── */
    _drawRibbon(group, points, category) {
      // 스트랜드 1 리본
      const ribbon1Path = this._createRibbonPath(points, d => d.x1, d => d.y, CFG.dna.ribbonWidth);
      group.append('path')
        .attr('d', ribbon1Path)
        .attr('fill', `url(#grad-${category.id})`)
        .attr('stroke', category.color)
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.3)
        .attr('filter', `url(#glow-${category.id})`);
      
      // 스트랜드 2 리본
      const ribbon2Path = this._createRibbonPath(points, d => d.x2, d => d.y, CFG.dna.ribbonWidth);
      group.append('path')
        .attr('d', ribbon2Path)
        .attr('fill', `url(#grad-${category.id})`)
        .attr('stroke', category.color)
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.3)
        .attr('filter', `url(#glow-${category.id})`);
    }

    _createRibbonPath(points, xFn, yFn, width) {
      let path = '';
      const hw = width / 2;
      
      points.forEach((p, i) => {
        const x = xFn(p);
        const y = yFn(p);
        const angle = Math.atan2(1, 0); // 수직 방향
        
        const x1 = x - hw * Math.cos(angle);
        const x2 = x + hw * Math.cos(angle);
        
        if (i === 0) {
          path += `M ${x1},${y}`;
        } else {
          path += ` L ${x1},${y}`;
        }
      });
      
      for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i];
        const x = xFn(p);
        const y = yFn(p);
        const angle = Math.atan2(1, 0);
        const x2 = x + hw * Math.cos(angle);
        path += ` L ${x2},${y}`;
      }
      
      path += ' Z';
      return path;
    }

    /* ──────────────────────────────────────
     * 노드 그리기
     * ────────────────────────────────────── */
    _drawNodes(group, points, category) {
      const self = this;
      
      points.forEach(p => {
        // 노드 1
        group.append('circle')
          .attr('cx', p.x1)
          .attr('cy', p.y)
          .attr('r', CFG.dna.nodeRadius * p.scale1)
          .attr('fill', category.color)
          .attr('fill-opacity', p.opacity1)
          .attr('filter', `url(#glow-${category.id})`)
          .style('cursor', 'pointer')
          .on('mouseenter', function(event) {
            self._showTooltip(event, p.tech);
          })
          .on('mousemove', function(event) {
            self._moveTooltip(event);
          })
          .on('mouseleave', function() {
            self._hideTooltip();
          });
        
        // 노드 2
        group.append('circle')
          .attr('cx', p.x2)
          .attr('cy', p.y)
          .attr('r', CFG.dna.nodeRadius * p.scale2)
          .attr('fill', category.color)
          .attr('fill-opacity', p.opacity2)
          .attr('filter', `url(#glow-${category.id})`)
          .style('cursor', 'pointer')
          .on('mouseenter', function(event) {
            self._showTooltip(event, p.tech);
          })
          .on('mousemove', function(event) {
            self._moveTooltip(event);
          })
          .on('mouseleave', function() {
            self._hideTooltip();
          });
      });
    }

    /* ──────────────────────────────────────
     * 태그 그리기 (날아다니는 기술명)
     * ────────────────────────────────────── */
    _drawTags(group, points, category, dnaPos) {
      if (!CFG.tags.show) return;
      
      const visiblePoints = points.filter((p, i) => i % 3 === 0).slice(0, CFG.tags.maxVisible);
      
      visiblePoints.forEach(p => {
        const distance = Math.sqrt(Math.pow(dnaPos.x - this.w/2, 2) + Math.pow(dnaPos.y - this.h/2, 2));
        const opacity = Math.max(0, 1 - distance / CFG.tags.fadeDistance);
        
        if (opacity > 0.1) {
          const tagX = Math.max(p.x1, p.x2) + 20;
          
          group.append('text')
            .attr('x', tagX)
            .attr('y', p.y)
            .attr('fill', category.color)
            .attr('font-size', 9)
            .attr('font-weight', '600')
            .attr('font-family', \"'JetBrains Mono', monospace\")
            .attr('opacity', opacity * 0.7)
            .text(p.tech.name);
        }
      });
    }

    /* ──────────────────────────────────────
     * 라벨
     * ────────────────────────────────────── */
    _drawLabel(group, category) {
      const labelWidth = category.label.length * 9 + 20;
      const labelY = -CFG.dna.helixHeight / 2 - 40;
      
      group.append('rect')
        .attr('x', -labelWidth / 2)
        .attr('y', labelY)
        .attr('width', labelWidth)
        .attr('height', 26)
        .attr('rx', 13)
        .attr('fill', 'rgba(15,15,26,0.9)')
        .attr('stroke', category.color)
        .attr('stroke-width', 1.5);
      
      group.append('text')
        .attr('x', 0)
        .attr('y', labelY + 17)
        .attr('text-anchor', 'middle')
        .attr('fill', category.color)
        .attr('font-size', 10)
        .attr('font-weight', '700')
        .attr('font-family', \"'JetBrains Mono', monospace\")
        .text(category.label.toUpperCase());
    }

    /* ──────────────────────────────────────
     * 툴팁 표시
     * ────────────────────────────────────── */
    _showTooltip(event, tech) {
      this.hoveredTech = tech;
      this.tooltip
        .html(`<strong style=\"color: #a78bfa;\">${tech.name}</strong><br><span style=\"color: #9090b0; font-size: 0.85rem;\">${tech.desc}</span>`)
        .style('opacity', 1);
      this._moveTooltip(event);
    }

    _moveTooltip(event) {
      if (this.hoveredTech) {
        this.tooltip
          .style('left', (event.clientX + CFG.tooltip.offsetX) + 'px')
          .style('top', (event.clientY + CFG.tooltip.offsetY) + 'px');
      }
    }

    _hideTooltip() {
      this.hoveredTech = null;
      this.tooltip.style('opacity', 0);
    }

    /* ──────────────────────────────────────
     * 애니메이션 루프
     * ────────────────────────────────────── */
    _animate(ts) {
      const dt = Math.min(ts - this.lastTs, 50);
      this.lastTs = ts;
      
      this.universeTime += (dt || 16.7) * 0.001;
      
      this.dnaRotations = this.dnaRotations.map(rot => 
        rot + CFG.dna.rotationSpeed * (dt || 16.7)
      );
      
      this._render();
      this.rafId = requestAnimationFrame(t => this._animate(t));
    }

    /* ──────────────────────────────────────
     * 정리
     * ────────────────────────────────────── */
    destroy() {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      if (this.svg) this.svg.remove();
      if (this.tooltip) this.tooltip.remove();
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
   * ④ 초기화
   * ═══════════════════════════════════════════════════════════════════ */
  function init() {
    if (typeof d3 === 'undefined') {
      console.warn('[DNA Universe] D3.js가 로드되지 않았습니다.');
      return;
    }
    
    window._dnaUniverse = new DNAUniverseAnimation('dna-universe');
    console.log('[DNA Universe] 🧬 개발 DNA 우주 v2.0 시작!');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
"