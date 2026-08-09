// ============ 手机罗盘（DeviceOrientation）+ 三种罗盘 + 天地人三盘/二十八宿/72龙/磁偏角/水平仪 ============
// 圆形罗盘（默认）/ 八宅方形罗盘 / 玄空方形罗盘
// 参考：github.com/OldrichKruchna/kompas + mikaboshi + suangua
(function () {
  'use strict';

  var GAN = '甲乙丙丁戊己庚辛壬癸';
  var ZHI = '子丑寅卯辰巳午未申酉戌亥';
  var SHAN24 = ['子', '癸', '丑', '艮', '寅', '甲', '卯', '乙', '辰', '巽', '巳', '丙', '午', '丁', '未', '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥', '壬'];
  var ZHI12 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var DIR8 = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  var WX_COLOR = { 子: '#007bff', 丑: '#a17323', 寅: '#228b22', 卯: '#228b22', 辰: '#a17323', 巳: '#d41313', 午: '#d41313', 未: '#a17323', 申: '#ffa436', 酉: '#ffa436', 戌: '#a17323', 亥: '#007bff' };

  // 二十八宿（顺序）与度数（传统宿度，共365.25度，此处用整数近似365用于显示）
  var XXIU = ['角', '亢', '氐', '房', '心', '尾', '箕', '斗', '牛', '女', '虚', '危', '室', '壁', '奎', '娄', '胃', '昴', '毕', '觜', '参', '井', '鬼', '柳', '星', '张', '翼', '轸'];
  var XXIU_DEG = [12, 9, 15, 5, 5, 18, 11, 26, 7, 11, 9, 16, 18, 9, 16, 12, 14, 11, 16, 1, 10, 33, 4, 15, 7, 18, 20, 17];
  // 先天八卦方位（乾南坤北离东坎西...）符号与角度
  var BAGUA_XT = [[0, '☰', '乾'], [45, '☱', '兑'], [90, '☲', '离'], [135, '☳', '震'], [180, '☷', '坤'], [225, '☶', '艮'], [270, '☵', '坎'], [315, '☴', '巽']];

  var heading = null;
  var smoothHeading = null;
  var beta = null, gamma = null;   // 陀螺仪倾角（水平仪）
  var running = false;
  var simMode = false;
  var simTimer = null;
  var curType = 'circular'; // circular | bazhai | xuankong
  var locked = false;         // 锁定罗盘：冻结指针朝向
  var lockedHeading = null;
  var panNeedle = 0;          // 盘针偏移：0=地盘正针, 7.5=人盘中针, 15=天盘缝针
  var declination = 0;        // 磁偏角（度，真北=磁北+磁偏角）
  var panStyle = 'all';       // 盘式：all=综合, sanyuan=三元, sanhe=三合

  function norm360(d) { d = d % 360; if (d < 0) d += 360; return d; }

  // 当前生效朝向（锁定优先）
  function currentHeading() {
    if (locked && lockedHeading !== null) return lockedHeading;
    return smoothHeading !== null ? smoothHeading : 0;
  }

  function toggleLock() {
    if (!locked) {
      locked = true;
      lockedHeading = smoothHeading !== null ? smoothHeading : heading;
      if (lockedHeading === null) lockedHeading = 0;
    } else {
      locked = false;
      lockedHeading = null;
    }
    var btn = document.getElementById('lock-btn');
    if (btn) btn.textContent = locked ? '解锁' : '锁定';
    var st = document.getElementById('status');
    if (st) {
      st.textContent = locked ? '已锁定朝向：' + Math.round(lockedHeading) + '°（点击「解锁」恢复跟随）' : '罗盘已解锁，继续跟随指南针';
      st.className = locked ? 'warn' : '';
    }
    updateUI();
  }

  function getHeadingFromEvent(e) {
    if (e.webkitCompassHeading !== undefined) return norm360(e.webkitCompassHeading);
    if (e.alpha !== null && e.alpha !== undefined) return norm360(360 - e.alpha);
    return null;
  }

  function smooth(raw) {
    if (smoothHeading === null) { smoothHeading = raw; return; }
    var diff = raw - smoothHeading;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    smoothHeading = norm360(smoothHeading + diff * 0.35);
  }

  // ============ 信息卡更新（共用） ============
  function updateInfo() {
    var h = currentHeading();
    var deg = Math.round(h) % 360;
    // 地盘正针读数
    var shanIdx = Math.floor((h + 7.5) / 15) % 24;
    var zhiIdx = Math.floor((h + 15) / 30) % 12;
    var dirIdx = Math.floor((h + 22.5) / 45) % 8;
    document.getElementById('degree').textContent = deg + '°';
    document.getElementById('shan24').textContent = SHAN24[shanIdx];
    var zhi = ZHI12[zhiIdx];
    document.getElementById('zhi12').textContent = zhi;
    document.getElementById('zhi12').style.color = WX_COLOR[zhi] || '#333';
    document.getElementById('dir8').textContent = dir8Name(dirIdx, h);
    window._compassDifen = zhi;
    var btn = document.getElementById('set-difen-btn');
    if (btn) btn.textContent = '设为金口诀地分（' + zhi + '）';
    // 盘针读数（人盘/天盘）
    var panRead = document.getElementById('pan-read');
    if (panRead) {
      if (panNeedle === 0) panRead.textContent = '';
      else {
        var ph = norm360(h + panNeedle);
        var pshan = SHAN24[Math.floor((ph + 7.5) / 15) % 24];
        var pname = panNeedle === 7.5 ? '人盘' : '天盘';
        panRead.textContent = pname + '：' + pshan;
      }
    }
    // 真北读数（磁偏角校正）
    var trueRead = document.getElementById('true-read');
    if (trueRead) {
      if (Math.abs(declination) < 0.01) trueRead.textContent = '';
      else {
        var th = norm360(h + declination);
        trueRead.textContent = '真北：' + Math.round(th) + '° ' + SHAN24[Math.floor((th + 7.5) / 15) % 24];
      }
    }
    return { deg: deg, shan: SHAN24[shanIdx], zhi: zhi, dir: DIR8[dirIdx] };
  }

  function dir8Name(idx, h) {
    var names = DIR8;
    var base = names[idx];
    var center = idx * 45;
    var dist = norm360(h - center);
    var prev = names[(idx + 7) % 8], next = names[(idx + 1) % 8];
    function diffChar(azi, b) {
      if (azi.length === 1) return azi;
      return azi.charAt(0) === b.charAt(0) ? azi.charAt(1) : azi.charAt(0);
    }
    if (dist < 7.5 || dist > 352.5) return base;
    if (dist < 22.5) return base + '偏' + diffChar(next, base);
    return base + '偏' + diffChar(prev, base);
  }

  // ============ 圆形罗盘（SVG，多层） ============
  function buildSvg() {
    var cx = 200, cy = 200, s = '';
    s += '<svg id="compassSvg" viewBox="0 0 400 400" width="100%" height="100%">';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="198" fill="#fdf8ef" stroke="#a1a1a1" stroke-width="2"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="190" fill="none" stroke="#d9c9a8" stroke-width="1"/>';
    s += '<g id="dial">';
    // 二十八宿外圈层（layer-xxiu）
    var xiuAcc = 0;
    for (var xi = 0; xi < 28; xi++) {
      var xDeg = XXIU_DEG[xi];
      var xStart = xiuAcc, xEnd = xiuAcc + xDeg;
      xiuAcc = xEnd;
      var xMid = (xStart + xEnd / 2) ? ((xStart + xEnd) / 2) : 0;
      var xMidN = norm360((xStart + xEnd) / 2 - 90); // 宿中点角度（0=正北？转正北上南下北）
      // 28宿以正北子位为"虚"宿起？传统：虚宿在子。这里简化按宿序从北方起排
      var xa = (xi * (360 / 28) + 180) % 360, xr = xa * Math.PI / 180;
      s += '<text class="layer-xxiu" x="' + (cx + 148 * Math.sin(xr)).toFixed(1) + '" y="' + (cy - 148 * Math.cos(xr) + 4).toFixed(1) + '" text-anchor="middle" font-size="11" fill="#8a6d3b">' + XXIU[xi] + '</text>';
    }
    for (var a = 0; a < 360; a += 15) {
      var major = (a % 30 === 0);
      var r1 = major ? 178 : 184, r2 = 190;
      var aa = a + 180; // 上南下北（传统罗盘持盘方向）
      s += '<line x1="' + (cx + r1 * Math.sin(aa * Math.PI / 180)).toFixed(1) + '" y1="' + (cy - r1 * Math.cos(aa * Math.PI / 180)).toFixed(1) + '" x2="' + (cx + r2 * Math.sin(aa * Math.PI / 180)).toFixed(1) + '" y2="' + (cy - r2 * Math.cos(aa * Math.PI / 180)).toFixed(1) + '" stroke="' + (major ? '#8a6d3b' : '#c4b48c') + '" stroke-width="' + (major ? 2 : 1) + '"/>';
    }
    for (var i = 0; i < 24; i++) {
      var ang = (i * 15 + 180) % 360, rad = ang * Math.PI / 180;
      s += '<text x="' + (cx + 162 * Math.sin(rad)).toFixed(1) + '" y="' + (cy - 162 * Math.cos(rad) + 5).toFixed(1) + '" text-anchor="middle" font-size="17" fill="#5a4632" font-weight="600">' + SHAN24[i] + '</text>';
    }
    for (var j = 0; j < 12; j++) {
      var ang2 = (j * 30 + 180) % 360, rad2 = ang2 * Math.PI / 180;
      var z = ZHI12[j];
      s += '<text x="' + (cx + 126 * Math.sin(rad2)).toFixed(1) + '" y="' + (cy - 126 * Math.cos(rad2) + 6).toFixed(1) + '" text-anchor="middle" font-size="20" font-weight="700" fill="' + (WX_COLOR[z] || '#333') + '">' + z + '</text>';
    }
    // 穿山72龙层（layer-72）：每山3格纳音五行字
    var nayin = window.LunarUtil && window.LunarUtil.NAYIN ? window.LunarUtil.NAYIN : null;
    var wxShort = { 金: '金', 木: '木', 水: '水', 火: '火', 土: '土' };
    var wxClr = { 金: '#b8860b', 木: '#228b22', 水: '#007bff', 火: '#d41313', 土: '#a17323' };
    var jiazi = [];
    for (var gg = 0; gg < 10; gg++) for (var zz = 0; zz < 12; zz++) if ((gg % 2) === (zz % 2)) jiazi.push(GAN[gg] + ZHI[zz]);
    for (var s72 = 0; s72 < 72; s72++) {
      var gz72 = jiazi[s72 % 60];
      var ny = nayin ? (nayin[gz72] || '') : '';
      var wxw = ny ? (ny.substr(-1)) : '';
      var clr = wxClr[wxw] || '#999';
      var a72 = (s72 * 5 + 180) % 360, r72 = a72 * Math.PI / 180;
      s += '<text class="layer-72" x="' + (cx + 108 * Math.sin(r72)).toFixed(1) + '" y="' + (cy - 108 * Math.cos(r72) + 3).toFixed(1) + '" text-anchor="middle" font-size="8" fill="' + clr + '">' + (wxw || '·') + '</text>';
    }
    // 先天八卦层（layer-bagua）
    for (var bi = 0; bi < 8; bi++) {
      var bg = BAGUA_XT[bi], ba = (bg[0] + 180) % 360, br = ba * Math.PI / 180;
      s += '<text class="layer-bagua" x="' + (cx + 96 * Math.sin(br)).toFixed(1) + '" y="' + (cy - 96 * Math.cos(br) + 4).toFixed(1) + '" text-anchor="middle" font-size="14" fill="#6b98c0">' + bg[1] + '</text>';
    }
    var four = [[0, '南', '#007bff'], [90, '西', '#ffa436'], [180, '北', '#d41313'], [270, '东', '#228b22']];
    for (var k = 0; k < 4; k++) {
      var a3 = four[k][0], r3 = 78, rad3 = a3 * Math.PI / 180;
      s += '<text x="' + (cx + r3 * Math.sin(rad3)).toFixed(1) + '" y="' + (cy - r3 * Math.cos(rad3) + 9).toFixed(1) + '" text-anchor="middle" font-size="30" font-weight="800" fill="' + four[k][2] + '">' + four[k][1] + '</text>';
    }
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="62" fill="none" stroke="#d9c9a8" stroke-width="1.5"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="28" fill="#fff" stroke="#a1a1a1" stroke-width="1.5"/>';
    s += '</g>';
    s += '<g id="needle">';
    s += '<polygon points="200,118 192,170 208,170" fill="#d41313"/>';
    s += '<polygon points="200,282 192,230 208,230" fill="#f5f5f5" stroke="#999" stroke-width="1"/>';
    s += '<circle cx="200" cy="200" r="8" fill="#b98c51" stroke="#fff" stroke-width="2"/>';
    s += '</g>';
    s += '<polygon points="200,6 193,20 207,20" fill="#d41313"/>';
    s += '</svg>';
    return s;
  }

  function updateCircular() {
    var h = currentHeading();
    var dial = document.getElementById('dial');
    if (dial) dial.setAttribute('transform', 'rotate(' + (-h - panNeedle - 180) + ' 200 200)');
  }

  // 盘式切换：控制各层显隐
  function applyPanStyle() {
    var svg = document.getElementById('compassSvg');
    if (!svg) return;
    function setLayer(cls, show) {
      var els = svg.querySelectorAll('.' + cls);
      for (var i = 0; i < els.length; i++) els[i].style.display = show ? '' : 'none';
    }
    // 综合=all 全显；三元=24山+先天八卦（无72龙无28宿？三元盘重八卦）；三合=24山+72龙（无八卦无28宿）
    setLayer('layer-xxiu', panStyle === 'all');
    setLayer('layer-72', panStyle === 'all' || panStyle === 'sanhe');
    setLayer('layer-bagua', panStyle === 'all' || panStyle === 'sanyuan');
  }

  // ============ 水平仪气泡 ============
  function updateBubble() {
    var bub = document.getElementById('level-bubble');
    if (!bub) return;
    if (beta === null || gamma === null) { bub.style.opacity = 0.3; return; }
    bub.style.opacity = 1;
    var dx = Math.max(-1, Math.min(1, gamma / 45)) * 14;   // 左右
    var dy = Math.max(-1, Math.min(1, beta / 45)) * 14;     // 前后
    var dot = document.getElementById('level-dot');
    if (dot) dot.setAttribute('transform', 'translate(' + dx.toFixed(1) + ' ' + dy.toFixed(1) + ')');
    var lvl = Math.abs(gamma) < 3 && Math.abs(beta) < 3;
    bub.className = lvl ? 'level-ok' : '';
  }

  // ============ 八宅方形罗盘 ============
  // 格子位置固定（3x3），方位标注随朝向轮转：朝向永远显示在顶部中间宫位
  var DIR8_ORDER = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  var BZ_BASE = [[3, 4, 5], [2, -1, 6], [1, 0, 7]];
  // 命卦盘固定布局（上南下北左东右西）
  var BZ_MING_GRID = [['东南', '南', '西南'], ['东', '中', '西'], ['东北', '北', '西北']];
  var QUALITY_CLS = { 吉: 'q-good', 凶: 'q-bad', 大吉: 'q-best', 大凶: 'q-worst', 中: 'q-mid' };
  var _bzFi = null;

  function updateBazhaiText(h) {
    var fi = Math.floor((h + 22.5) / 45) % 8;
    var ptr = document.getElementById('bz-ptr-txt');
    if (ptr) ptr.textContent = '向：' + DIR8_ORDER[fi];
    var seatBox = document.getElementById('bz-seat-box');
    if (seatBox) seatBox.textContent = '坐山 · ' + DIR8_ORDER[(fi + 4) % 8];
  }

  function renderBazhai(force) {
    var FS = window.FengShui;
    var h = currentHeading();
    var fi = Math.floor((h + 22.5) / 45) % 8;
    var facing = DIR8_ORDER[fi];
    var seat = DIR8_ORDER[(fi + 4) % 8];
    var houseGua = (function () {
      var dirToGua = { 北: '坎', 东北: '艮', 东: '震', 东南: '巽', 南: '离', 西南: '坤', 西: '兑', 西北: '乾' };
      return dirToGua[seat];
    })();
    var guaNum = FS.GUA_NAMES ? (function () {
      var m = { 坎: 1, 坤: 2, 震: 3, 巽: 4, 乾: 6, 兑: 7, 艮: 8, 离: 9 };
      return m[houseGua];
    })() : 1;

    if (!force && _bzFi === fi && document.getElementById('bz-grid')) {
      updateBazhaiText(h);
      return;
    }
    _bzFi = fi;
    var sectors = FS.bazhaiSectors(guaNum);
    var map = {};
    sectors.forEach(function (s) { map[s.direction] = s; });

    var h2 = '<div class="bz-pan-title">' + houseGua + '宅（大游年·伏位在坐山）</div>';
    h2 += '<div class="bz-wrap">';
    h2 += '<div class="bz-pointer"><span class="bz-tri">▲</span><span class="bz-ptr-txt" id="bz-ptr-txt">向：' + facing + '</span></div>';
    h2 += '<div class="bz-grid" id="bz-grid">';
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        var base = BZ_BASE[r][c];
        if (base === -1) { h2 += '<div class="bz-cell bz-center"><div class="bz-star">' + houseGua + '</div><div class="bz-name">宅卦</div></div>'; continue; }
        var d = DIR8_ORDER[(base + fi - 4 + 8) % 8];
        var s = map[d];
        if (!s) { h2 += '<div class="bz-cell"></div>'; continue; }
        var isFacing = (r === 0 && c === 1);
        var isSeat = (r === 2 && c === 1);
        var cls = isSeat ? ' bz-seat' : (isFacing ? ' bz-facing' : '');
        var mark = isFacing ? '·向' : (isSeat ? '·坐' : '');
        h2 += '<div class="bz-cell' + cls + '">';
        h2 += '<div class="bz-dir">' + d + mark + '</div>';
        h2 += '<div class="bz-star ' + QUALITY_CLS[s.quality] + '">' + s.star + '</div>';
        h2 += '<div class="bz-name">' + s.xing + '·' + s.wx + '</div>';
        h2 += '<div class="bz-q ' + QUALITY_CLS[s.quality] + '">' + s.quality + '</div>';
        h2 += '</div>';
      }
    }
    h2 += '</div>';
    h2 += '<div class="bz-seat-box" id="bz-seat-box">坐山 · ' + seat + '</div>';
    h2 += '</div>';
    document.getElementById('bazhai-pan').innerHTML = h2;
    updateBazhaiText(h);

    // 命卦（固定上南下北布局）
    var by = parseInt(document.getElementById('birth-year').value, 10);
    if (by && by > 1900 && by < 2100) {
      var gender = document.querySelector('input[name=bg]:checked').value === '1' ? 1 : 0;
      var mg = FS.calcMingGua(by, gender);
      var mgInfo = FS.mingGuaSectors(mg);
      var mmap = {};
      mgInfo.sectors.forEach(function (s) { mmap[s.direction] = s; });
      var mh = '<div class="bz-ming-title">命卦：' + mg + '（' + mgInfo.guaName + '）· ' + mgInfo.group + '</div>';
      mh += '<div class="bz-grid">';
      for (var r2 = 0; r2 < 3; r2++) {
        for (var c2 = 0; c2 < 3; c2++) {
          var d2 = BZ_MING_GRID[r2][c2];
          if (d2 === '中') { mh += '<div class="bz-cell bz-center"><div class="bz-star">' + mgInfo.guaName + '</div><div class="bz-name">命卦</div></div>'; continue; }
          var s2 = mmap[d2];
          if (!s2) { mh += '<div class="bz-cell"></div>'; continue; }
          mh += '<div class="bz-cell">';
          mh += '<div class="bz-dir">' + d2 + '</div>';
          mh += '<div class="bz-star ' + QUALITY_CLS[s2.quality] + '">' + s2.star + '</div>';
          mh += '<div class="bz-name">' + s2.xing + '</div>';
          mh += '<div class="bz-q ' + QUALITY_CLS[s2.quality] + '">' + s2.quality + '</div>';
          mh += '</div>';
        }
      }
      mh += '</div>';
      document.getElementById('bazhai-ming').innerHTML = mh;
    } else {
      document.getElementById('bazhai-ming').innerHTML = '<div class="bz-tip">输入出生年份与性别，查看个人命卦八方吉凶</div>';
    }
  }

  // ============ 玄空方形罗盘 ============
  var XK_GRID = [['东南', '南', '西南'], ['东', '中', '西'], ['东北', '北', '西北']];

  var _xkKey = '';
  function renderXuankong() {
    var FS = window.FengShui;
    var year = parseInt(document.getElementById('xk-year').value, 10) || new Date().getFullYear();
    var sel = document.getElementById('xk-shan');
    // 坐山：'跟随朝向'时按当前朝向（锁定优先），否则用下拉手动所选
    var autoFollow = !sel || sel.value === '';
    var shanIdx = autoFollow ? FS.shanIndexFromDegree(currentHeading()) : parseInt(sel.value, 10);
    if (autoFollow && sel) sel.value = '';
    // 山向未变则不重排（避免传感器高频刷新闪烁）
    var key = year + ':' + shanIdx;
    if (_xkKey === key && document.getElementById('xuankong-pan').innerHTML) return;
    _xkKey = key;
    var pan = FS.xuankongPan(year, shanIdx);
    var cellMap = {};
    pan.palaces.forEach(function (p) { cellMap[p.direction] = p; });

    var h2 = '<div class="xk-pan-title">' + pan.yunName + ' · ' + pan.shan + '山' + pan.xiang + '向（坐' + pan.shanPalace + '朝' + pan.xiangPalace + '）</div>';
    h2 += '<div class="xk-sub">山星' + pan.shanStar + (pan.shanReverse ? '逆' : '顺') + '飞 · 向星' + pan.xiangStar + (pan.xiangReverse ? '逆' : '顺') + '飞</div>';
    h2 += '<div class="bz-wrap">';
    h2 += '<div class="bz-pointer"><span class="bz-tri">▲</span><span class="bz-ptr-txt" id="xk-ptr-txt">向：' + pan.xiang + '（' + pan.xiangPalace + '）</span></div>';
    h2 += '<div class="xk-grid">';
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        var d = XK_GRID[r][c];
        if (d === '中') {
          h2 += '<div class="xk-cell xk-center"><div class="xk-yun">运' + pan.yun + '</div><div class="xk-sx">山' + pan.shanStar + ' 向' + pan.xiangStar + '</div><div class="xk-name">' + pan.shan + '山' + pan.xiang + '向</div></div>';
          continue;
        }
        var p = cellMap[d];
        if (!p) { h2 += '<div class="xk-cell"></div>'; continue; }
        var st = FS.STAR_INFO[p.yun];
        // 九星玄空断语（lunar.js NineStarUtil.LUCK_XUAN_KONG）
        var luck = (window.NineStarUtil && window.NineStarUtil.LUCK_XUAN_KONG) ? (window.NineStarUtil.LUCK_XUAN_KONG[p.yun] || '') : '';
        h2 += '<div class="xk-cell">';
        h2 += '<div class="xk-dir">' + d + '</div>';
        h2 += '<div class="xk-yun" style="color:' + st.color + '">' + p.yun + '<span class="xk-sname">' + st.name.replace(/^[一二三四五六七八九]/, '') + '</span></div>';
        h2 += '<div class="xk-sx"><span>山' + p.shan + '</span><span>向' + p.xiang + '</span></div>';
        if (luck) h2 += '<div class="xk-luck">' + luck + '</div>';
        h2 += '</div>';
      }
    }
    h2 += '</div>';
    h2 += '</div>'; // 关闭 bz-wrap
    document.getElementById('xuankong-pan').innerHTML = h2;
  }

  // ============ 模式切换 ============
  function setType(type) {
    curType = type;
    var tabs = document.querySelectorAll('.type-tabs .tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].className = 'tab' + (tabs[i].getAttribute('data-type') === type ? ' active' : '');
    var bodies = { circular: 'compass-box', bazhai: 'bazhai-body', xuankong: 'xuankong-body' };
    for (var k in bodies) {
      document.getElementById(bodies[k]).className = (k === type ? '' : 'hidden');
    }
    // 圆形罗盘控件区
    var circCtrl = document.getElementById('circular-ctrl');
    if (circCtrl) circCtrl.style.display = (type === 'circular') ? '' : 'none';
    var lockBtn = document.getElementById('lock-btn');
    if (lockBtn) lockBtn.style.display = (type === 'circular' || type === 'bazhai' || type === 'xuankong') ? '' : 'none';
    if (type === 'bazhai') renderBazhai(true);
    if (type === 'xuankong') renderXuankong();
  }

  // ============ 主更新分发 ============
  function updateUI() {
    var info = updateInfo();
    if (curType === 'circular') { updateCircular(); updateBubble(); }
    else if (curType === 'bazhai') renderBazhai(false);
    else if (curType === 'xuankong') renderXuankong();
  }

  function onOrientation(e) {
    var raw = getHeadingFromEvent(e);
    if (raw !== null) { heading = raw; smooth(raw); }
    if (e.beta !== null && e.beta !== undefined) beta = e.beta;
    if (e.gamma !== null && e.gamma !== undefined) gamma = e.gamma;
    updateUI();
  }

  function startSensors() {
    if (running) return;
    running = true;
    window.addEventListener('deviceorientationabsolute', onOrientation, true);
    window.addEventListener('deviceorientation', onOrientation, true);
    document.getElementById('status').textContent = '传感器已启动，请水平持机';
    document.getElementById('status').className = 'ok';
    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('sim-btn').style.display = 'inline-block';
  }

  function requestPermissionAndStart() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(function (state) {
        if (state === 'granted') startSensors();
        else { document.getElementById('status').textContent = '权限被拒绝，请允许访问运动传感器后重试'; document.getElementById('status').className = 'err'; }
      }).catch(function (err) { document.getElementById('status').textContent = '请求权限出错：' + err.message; document.getElementById('status').className = 'err'; });
    } else { startSensors(); }
  }

  function startSim() {
    if (simMode) return;
    simMode = true; running = true; smoothHeading = 0;
    document.getElementById('status').textContent = '模拟模式：自动旋转演示（桌面无传感器）';
    document.getElementById('status').className = 'sim';
    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('sim-btn').textContent = '停止模拟';
    simTimer = setInterval(function () { smoothHeading = norm360(smoothHeading + 0.8); heading = smoothHeading; beta = 0; gamma = 0; updateUI(); }, 50);
  }
  function stopSim() {
    if (simTimer) { clearInterval(simTimer); simTimer = null; }
    simMode = false; running = false;
    document.getElementById('status').textContent = '模拟已停止，可点击"启动罗盘"或再次"模拟演示"';
    document.getElementById('status').className = '';
    document.getElementById('sim-btn').textContent = '模拟演示';
  }
  function toggleSim() { if (simMode) stopSim(); else startSim(); }

  function setDifen() {
    var z = window._compassDifen || '寅';
    try { localStorage.setItem('compass_difen', z); } catch (e) {}
    var v = new URLSearchParams(location.search).get('v') || '';
    location.href = 'jinkoujue.html?difen=' + z + (v ? '&v=' + v : '');
  }

  function init() {
    document.getElementById('compass-box').innerHTML = buildSvg();
    applyPanStyle();
    document.getElementById('degree').textContent = '--';
    document.getElementById('shan24').textContent = '--';
    document.getElementById('zhi12').textContent = '--';
    document.getElementById('dir8').textContent = '--';

    var api = 'deviceorientation' in window ? 'DeviceOrientation ✓' : '不支持';
    document.getElementById('api-status').textContent = 'API：' + api + (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function' ? '（iOS 需授权）' : '');

    document.getElementById('start-btn').addEventListener('click', requestPermissionAndStart);
    document.getElementById('sim-btn').addEventListener('click', toggleSim);
    document.getElementById('set-difen-btn').addEventListener('click', setDifen);
    var lockBtn = document.getElementById('lock-btn');
    if (lockBtn) lockBtn.addEventListener('click', toggleLock);

    // 圆形罗盘控件：盘针/盘式/磁偏角
    var panNeedleSel = document.getElementById('pan-needle');
    if (panNeedleSel) panNeedleSel.addEventListener('change', function () { panNeedle = parseFloat(this.value) || 0; updateUI(); });
    var panStyleSel = document.getElementById('pan-style');
    if (panStyleSel) panStyleSel.addEventListener('change', function () { panStyle = this.value; applyPanStyle(); });
    var decInput = document.getElementById('declination');
    if (decInput) decInput.addEventListener('input', function () { declination = parseFloat(this.value) || 0; updateUI(); });

    var tabs = document.querySelectorAll('.type-tabs .tab');
    for (var i = 0; i < tabs.length; i++) {
      (function (t) { t.addEventListener('click', function () { setType(t.getAttribute('data-type')); }); })(tabs[i]);
    }
    document.getElementById('birth-year').addEventListener('input', renderBazhai);
    var radios = document.querySelectorAll('input[name=bg]');
    for (var j = 0; j < radios.length; j++) radios[j].addEventListener('change', renderBazhai);
    document.getElementById('xk-year').addEventListener('input', renderXuankong);
    document.getElementById('xk-shan').addEventListener('change', renderXuankong);

    window.addEventListener('compassneedscalibration', function (e) {
      document.getElementById('status').textContent = '⚠ 罗盘需要校准：请将手机沿"8"字形转动';
      document.getElementById('status').className = 'warn';
      e.preventDefault();
    });

    var now = new Date();
    if (!document.getElementById('xk-year').value) document.getElementById('xk-year').value = now.getFullYear();
    renderBazhai();
    renderXuankong();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.Compass = {
    startSensors: startSensors, startSim: startSim, stopSim: stopSim,
    setType: setType, getHeading: function () { return heading; }
  };
})();
