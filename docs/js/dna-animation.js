
/**
 * SmartFlex 개발 DNA 우주 애니메이션
 * 파일명: docs/js/dna-animation.js
 * 설명: D3.js 기반으로 여러 DNA 구조를 우주 홀로그램처럼 회전시키고,
 *       시대별 기술 흐름과 Node.js 중심 기술을 강조하는 시각화를 구현합니다.
 */

(function () {
  'use strict';

  const CFG = {
    dna: {
      helixRadius: 32,
      helixHeight: 220,
      nodeCount: 16,
      nodeRadius: 4,
      ribbonWidth: 14,
      rotationSpeed: 0.0014,
      pulseSpeed: 5,
    },
    universe: {
      rotationSpeed: 0.0006,
      eraTransitionTime: 9000,
    },
    tags: {
      show: true,
      maxVisible: 5,
      fadeDistance: 320,
    },
    tooltip: {
      offsetX: 18,
      offsetY: -34,
    },
  };

  const MOVEMENT_PATTERNS = {
    orbit: (t, radius, offset) => ({ x: Math.cos(t + offset) * radius, y: Math.sin(t + offset) * radius * 0.85 }),
    spiral: (t, radius, offset) => ({ x: Math.cos(t + offset) * (radius + Math.sin(t * 2) * 50), y: Math.sin(t + offset) * (radius + Math.cos(t * 2) * 30) }),
    wave: (t, radius, offset) => ({ x: Math.cos(t + offset) * radius * 1.05, y: Math.sin(t + offset) * radius + Math.sin(t * 4) * 40 }),
    ellipse: (t, radius, offset) => ({ x: Math.cos(t + offset) * radius * 1.4, y: Math.sin(t + offset) * radius * 0.65 }),
    figure8: (t, radius, offset) => ({ x: Math.sin(t + offset) * radius * 0.95, y: Math.sin(t * 2 + offset) * radius * 0.7 }),
  };

  let CATEGORIES = [];
  let ERAS = [];
  let currentEraIndex = 3;

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
      this.gUniverse = null;
      this.tooltip = null;
      this.universeTime = 0;
      this.dnaRotations = [];
      this.rafId = null;
      this.lastTs = 0;
      this.hoveredTech = null;

      this._init();
    }

    async _init() {
      await this._loadData();
      this._setupSVG();
      this._setupTooltip();
      this._startEraRotation();
      this._animate(0);
      window.addEventListener('resize', () => this._resize());
    }

    async _loadData() {
      try {
        const [categoryData, eraData] = await Promise.all([
          fetch('json/dna-categories.json').then(res => res.json()),
          fetch('json/era-timeline.json').then(res => res.json()),
        ]);

        CATEGORIES = categoryData.categories;
        ERAS = eraData.eras;
        this.dnaRotations = CATEGORIES.map(() => Math.random() * Math.PI * 2);
      } catch (err) {
        console.error('[DNA Universe] 데이터 로드 실패', err);
      }
    }

    _setupSVG() {
      this._resize();
      this.svg = d3.select(this.el)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('position', 'absolute')
        .style('inset', '0')
        .style('overflow', 'visible');

      const defs = this.svg.append('defs');
      defs.append('radialGradient')
        .attr('id', 'universe-glow')
        .attr('cx', '50%').attr('cy', '50%').attr('r', '50%')
        .selectAll('stop')
        .data([
          { offset: '0%', color: 'rgba(108,99,255,0.3)' },
          { offset: '60%', color: 'rgba(108,99,255,0.05)' },
          { offset: '100%', color: 'rgba(9,9,15,0)' },
        ])
        .enter()
        .append('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color);

      CATEGORIES.forEach(category => {
        defs.append('filter')
          .attr('id', `glow-${category.id}`)
          .attr('x', '-200%')
          .attr('y', '-200%')
          .attr('width', '500%')
          .attr('height', '500%')
          .append('feGaussianBlur')
          .attr('stdDeviation', 5);

        const gradient = defs.append('linearGradient')
          .attr('id', `grad-${category.id}`)
          .attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');

        gradient.append('stop').attr('offset', '0%').attr('stop-color', category.color).attr('stop-opacity', 0.9);
        gradient.append('stop').attr('offset', '50%').attr('stop-color', category.color).attr('stop-opacity', 0.35);
        gradient.append('stop').attr('offset', '100%').attr('stop-color', category.color).attr('stop-opacity', 0.95);
      });

      this.svg.append('rect')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('fill', 'url(#universe-glow)');

      this.gUniverse = this.svg.append('g').attr('class', 'dna-universe');
    }

    _setupTooltip() {
      this.tooltip = d3.select('body').append('div')
        .attr('class', 'tech-tooltip')
        .style('position', 'fixed')
        .style('background', 'rgba(15,15,26,0.95)')
        .style('border', '1px solid rgba(255,255,255,0.08)')
        .style('border-radius', '14px')
        .style('padding', '14px 18px')
        .style('color', '#f8f8ff')
        .style('font-family', 'Inter, sans-serif')
        .style('font-size', '0.95rem')
        .style('line-height', '1.6')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('z-index', 1000)
        .style('box-shadow', '0 18px 40px rgba(0,0,0,0.35)');
    }

    _startEraRotation() {
      this._updateEraDisplay();
      this.eraTimer = setInterval(() => {
        currentEraIndex = (currentEraIndex + 1) % ERAS.length;
        this._updateEraDisplay();
      }, CFG.universe.eraTransitionTime);
    }

    /** 사용자가 선택한 시대 인덱스로 DNA 강조 상태를 즉시 전환합니다. */
    setEra(index) {
      if (!ERAS[index]) return;
      currentEraIndex = index;
      this._updateEraDisplay();
    }

    _updateEraDisplay() {
      const era = ERAS[currentEraIndex];
      const yearEl = document.getElementById('era-year');
      const descEl = document.getElementById('era-desc');
      if (!era || !yearEl || !descEl) return;
      yearEl.textContent = era.label;
      yearEl.style.color = era.color;
      descEl.textContent = era.description;
      document.querySelectorAll('[data-era-index]').forEach(button => {
        button.classList.toggle('active', Number(button.dataset.eraIndex) === currentEraIndex);
      });
    }

    _resize() {
      this.w = this.el.offsetWidth || window.innerWidth;
      this.h = this.el.offsetHeight || window.innerHeight;
    }

    _getDNAPosition(category, index) {
      const cx = this.w / 2;
      const cy = this.h / 2;
      const movement = category.movement;
      const pattern = MOVEMENT_PATTERNS[movement.type] || MOVEMENT_PATTERNS.orbit;
      const t = this.universeTime * movement.speed;
      const radius = movement.radius * (1 + Math.sin(this.universeTime * 0.65 + index) * 0.08);
      const offset = movement.offset * Math.PI / 180;
      return {
        x: cx + pattern(t, radius, offset).x,
        y: cy + pattern(t, radius, offset).y,
      };
    }

    _calcDNAPoints(category, categoryIndex) {
      return Array.from({ length: CFG.dna.nodeCount }).map((_, i) => {
        const t = i / (CFG.dna.nodeCount - 1);
        const yBase = -CFG.dna.helixHeight / 2 + t * CFG.dna.helixHeight;
        const rotation = this.dnaRotations[categoryIndex];

        const angle1 = rotation + t * Math.PI * 5;
        const angle2 = angle1 + Math.PI;
        const z1 = Math.sin(angle1);
        const z2 = Math.sin(angle2);

        const x1 = Math.cos(angle1) * CFG.dna.helixRadius;
        const x2 = Math.cos(angle2) * CFG.dna.helixRadius;
        const y1 = yBase + z1 * 18;
        const y2 = yBase + z2 * 18;

        const tech = category.techs[i % category.techs.length];

        return {
          index: i,
          x1,
          y1,
          x2,
          y2,
          z1,
          z2,
          scale1: 0.75 + 0.25 * ((z1 + 1) / 2),
          scale2: 0.75 + 0.25 * ((z2 + 1) / 2),
          opacity1: 0.35 + 0.65 * ((z1 + 1) / 2),
          opacity2: 0.35 + 0.65 * ((z2 + 1) / 2),
          tech,
          category,
        };
      });
    }

    _render() {
      this.gUniverse.selectAll('g.dna-group').remove();
      const currentEra = ERAS[currentEraIndex];

      CATEGORIES.forEach((category, index) => {
        const pos = this._getDNAPosition(category, index);
        const points = this._calcDNAPoints(category, index);
        const eraActive = currentEra && category.era === currentEra.id;
        const group = this.gUniverse.append('g')
          .attr('class', 'dna-group')
          .attr('transform', `translate(${pos.x}, ${pos.y})`)
          .attr('opacity', eraActive ? 1 : 0.22);

        if (category.highlight || category.nodejs) {
          group.append('ellipse')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('rx', 90)
            .attr('ry', 40)
            .attr('fill', category.color)
            .attr('fill-opacity', 0.05)
            .attr('transform', `rotate(${(this.universeTime * 22) % 360})`);
          group.append('ellipse')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('rx', 130)
            .attr('ry', 58)
            .attr('fill', category.color)
            .attr('fill-opacity', 0.03)
            .attr('transform', `rotate(${(this.universeTime * -15) % 360})`);
        }

        this._drawRibbon(group, points, category);
        this._drawNodes(group, points, category);
        this._drawTags(group, points, category, pos, eraActive);
        this._drawLabel(group, category, eraActive);
      });
    }

    _drawRibbon(group, points, category) {
      const ribbon1 = this._createRibbonPath(points, d => d.x1, d => d.y1, CFG.dna.ribbonWidth);
      group.append('path')
        .attr('d', ribbon1)
        .attr('fill', `url(#grad-${category.id})`)
        .attr('fill-opacity', 0.76)
        .attr('stroke', category.color)
        .attr('stroke-width', 1.2)
        .attr('stroke-opacity', 0.25)
        .attr('filter', `url(#glow-${category.id})`);

      const ribbon2 = this._createRibbonPath(points, d => d.x2, d => d.y2, CFG.dna.ribbonWidth);
      group.append('path')
        .attr('d', ribbon2)
        .attr('fill', `url(#grad-${category.id})`)
        .attr('fill-opacity', 0.68)
        .attr('stroke', category.color)
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.18)
        .attr('filter', `url(#glow-${category.id})`);
    }

    _createRibbonPath(points, xFn, yFn, width) {
      const half = width / 2;
      let path = '';

      points.forEach((p, i) => {
        const x = xFn(p);
        const y = yFn(p);
        const px = x - half;
        if (i === 0) path += `M ${px},${y}`;
        else path += ` L ${px},${y}`;
      });

      for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i];
        const x = xFn(p);
        const y = yFn(p);
        const px = x + half;
        path += ` L ${px},${y}`;
      }

      path += ' Z';
      return path;
    }

    _drawNodes(group, points, category) {
      points.forEach(p => {
        const pulse = 1 + Math.sin(this.universeTime * CFG.dna.pulseSpeed + p.index * 0.8) * 0.08;
        const baseSize = CFG.dna.nodeRadius * (category.highlight || category.nodejs ? 1.18 : 1);

        group.append('circle')
          .attr('cx', p.x1)
          .attr('cy', p.y1)
          .attr('r', baseSize * p.scale1 * pulse)
          .attr('fill', category.color)
          .attr('fill-opacity', p.opacity1)
          .attr('filter', `url(#glow-${category.id})`)
          .style('cursor', 'pointer')
          .on('mouseenter', event => this._showTooltip(event, p.tech))
          .on('mousemove', event => this._moveTooltip(event))
          .on('mouseleave', () => this._hideTooltip());

        group.append('circle')
          .attr('cx', p.x2)
          .attr('cy', p.y2)
          .attr('r', baseSize * p.scale2 * pulse)
          .attr('fill', category.color)
          .attr('fill-opacity', p.opacity2)
          .attr('filter', `url(#glow-${category.id})`)
          .style('cursor', 'pointer')
          .on('mouseenter', event => this._showTooltip(event, p.tech))
          .on('mousemove', event => this._moveTooltip(event))
          .on('mouseleave', () => this._hideTooltip());
      });
    }

    _drawTags(group, points, category, dnaPos, eraActive) {
      if (!CFG.tags.show) return;
      const visiblePoints = points.filter((p, i) => i % 3 === 0).slice(0, CFG.tags.maxVisible);
      const baseOpacity = eraActive ? 0.82 : 0.2;

      visiblePoints.forEach((p, index) => {
        const offset = (index % 2 === 0 ? 1 : -1) * 34;
        group.append('text')
          .attr('x', Math.max(p.x1, p.x2) + offset)
          .attr('y', (p.y1 + p.y2) / 2)
          .attr('fill', category.color)
          .attr('font-size', 10)
          .attr('font-weight', '700')
          .attr('font-family', "'JetBrains Mono', monospace")
          .attr('opacity', baseOpacity * (0.65 + Math.sin(this.universeTime + index) * 0.18))
          .text(p.tech.name);
      });
    }

    _drawLabel(group, category, eraActive) {
      const labelText = category.nodejs ? `${category.label} · Node.js` : category.label;
      const labelWidth = Math.max(labelText.length * 9, 120);
      const yOffset = -CFG.dna.helixHeight / 2 - 38;

      group.append('rect')
        .attr('x', -labelWidth / 2)
        .attr('y', yOffset)
        .attr('width', labelWidth)
        .attr('height', 28)
        .attr('rx', 14)
        .attr('fill', 'rgba(10,12,20,0.88)')
        .attr('stroke', category.color)
        .attr('stroke-width', 1.2)
        .attr('opacity', eraActive ? 1 : 0.35);

      group.append('text')
        .attr('x', 0)
        .attr('y', yOffset + 19)
        .attr('text-anchor', 'middle')
        .attr('fill', category.color)
        .attr('font-size', 10)
        .attr('font-weight', '700')
        .attr('font-family', "'JetBrains Mono', monospace")
        .attr('opacity', eraActive ? 1 : 0.4)
        .text(labelText.toUpperCase());
    }

    _showTooltip(event, tech) {
      this.hoveredTech = tech;
      this.tooltip
        .html(`<strong style="color:#a78bfa;">${tech.name}</strong><br/><span style="color:#c8c8e4; font-size:0.85rem;">${tech.desc}</span>`)
        .style('opacity', 1);
      this._moveTooltip(event);
    }

    _moveTooltip(event) {
      if (!this.hoveredTech) return;
      this.tooltip
        .style('left', `${event.clientX + CFG.tooltip.offsetX}px`)
        .style('top', `${event.clientY + CFG.tooltip.offsetY}px`);
    }

    _hideTooltip() {
      this.hoveredTech = null;
      this.tooltip.style('opacity', 0);
    }

    _animate(ts) {
      const dt = Math.min(ts - this.lastTs, 50);
      this.lastTs = ts;
      this.universeTime += (dt || 16.7) * 0.001;
      this.dnaRotations = this.dnaRotations.map((rot, index) => rot + CFG.dna.rotationSpeed * (1 + index * 0.003) * (dt || 16.7));
      this._render();
      this.rafId = requestAnimationFrame(t => this._animate(t));
    }

    destroy() {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      if (this.eraTimer) clearInterval(this.eraTimer);
      if (this.svg) this.svg.remove();
      if (this.tooltip) this.tooltip.remove();
    }
  }

  function init() {
    if (typeof d3 === 'undefined') {
      console.warn('[DNA Universe] D3.js가 로드되지 않았습니다.');
      return;
    }
    window._dnaUniverse = new DNAUniverseAnimation('dna-universe');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
