// ============ 手机罗盘（DeviceOrientation）+ 三种罗盘 ============
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

  var heading = null;
  var smoothHeading = null;
  var running = false;
  var simMode = false;
  var simTimer = null;
  var curType = 'circular'; // circular | bazhai | xuankong

  function norm360(d) { d = d % 360; if (d < 0) d += 360; return d; }

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
    var h = smoothHeading || 0;
    var deg = Math.round(h) % 360;
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

  // ============ 圆形罗盘（SVG） ============
  function buildSvg() {
    var cx = 200, cy = 200, s = '';
    s += '<svg id="compassSvg" viewBox="0 0 400 400" width="100%" height="100%">';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="198" fill="#fdf8ef" stroke="#a1a1a1" stroke-width="2"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="190" fill="none" stroke="#d9c9a8" stroke-width="1"/>';
    s += '<g id="dial">';
    for (var a = 0; a < 360; a += 15) {
      var major = (a % 30 === 0);
      var r1 = major ? 178 : 184, r2 = 190;
      s += '<line x1="' + (cx + r1 * Math.sin(a * Math.PI / 180)).toFixed(1) + '" y1="' + (cy - r1 * Math.cos(a * Math.PI / 180)).toFixed(1) + '" x2="' + (cx + r2 * Math.sin(a * Math.PI / 180)).toFixed(1) + '" y2="' + (cy - r2 * Math.cos(a * Math.PI / 180)).toFixed(1) + '" stroke="' + (major ? '#8a6d3b' : '#c4b48c') + '" stroke-width="' + (major ? 2 : 1) + '"/>';
    }
    for (var i = 0; i < 24; i++) {
      var ang = i * 15, rad = ang * Math.PI / 180;
      s += '<text x="' + (cx + 162 * Math.sin(rad)).toFixed(1) + '" y="' + (cy - 162 * Math.cos(rad) + 5).toFixed(1) + '" text-anchor="middle" font-size="17" fill="#5a4632" font-weight="600">' + SHAN24[i] + '</text>';
    }
    for (var j = 0; j < 12; j++) {
      var ang2 = j * 30, rad2 = ang2 * Math.PI / 180;
      var z = ZHI12[j];
      s += '<text x="' + (cx + 126 * Math.sin(rad2)).toFixed(1) + '" y="' + (cy - 126 * Math.cos(rad2) + 6).toFixed(1) + '" text-anchor="middle" font-size="20" font-weight="700" fill="' + (WX_COLOR[z] || '#333') + '">' + z + '</text>';
    }
    var four = [[0, '北', '#d41313'], [90, '东', '#228b22'], [180, '南', '#007bff'], [270, '西', '#ffa436']];
    for (var k = 0; k < 4; k++) {
      var a3 = four[k][0], r3 = 88, rad3 = a3 * Math.PI / 180;
      s += '<text x="' + (cx + r3 * Math.sin(rad3)).toFixed(1) + '" y="' + (cy - r3 * Math.cos(rad3) + 9).toFixed(1) + '" text-anchor="middle" font-size="30" font-weight="800" fill="' + four[k][2] + '">' + four[k][1] + '</text>';
    }
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="70" fill="none" stroke="#d9c9a8" stroke-width="1.5"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="30" fill="#fff" stroke="#a1a1a1" stroke-width="1.5"/>';
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
    var h = smoothHeading || 0;
    var dial = document.getElementById('dial');
    if (dial) dial.setAttribute('transform', 'rotate(' + (-h) + ' 200 200)');
  }

  // ============ 八宅方形罗盘 ============
  // 3x3 布局（上北）：[西北 北 东北 / 西 中 东 / 西南 南 东南]
  var BZ_GRID = [['西北', '北', '东北'], ['西', '中', '东'], ['西南', '南', '东南']];
  var QUALITY_CLS = { 吉: 'q-good', 凶: 'q-bad', 大吉: 'q-best', 大凶: 'q-worst', 中: 'q-mid' };

  function renderBazhai() {
    var FS = window.FengShui;
    var h = smoothHeading || 0;
    var dirIdx = Math.floor((h + 22.5) / 45) % 8;
    var facing = DIR8[dirIdx];            // 朝向（宅向）
    var houseGua = FS.GUA_NAMES[FS.mingGuaSectors(1).sectors[0].gua] ? (function () {
      // 朝向 → 宅卦（八宅以朝向定宅卦，朝向的八卦）
      var dirToGua = { 北: '坎', 东北: '艮', 东: '震', 东南: '巽', 南: '离', 西南: '坤', 西: '兑', 西北: '乾' };
      return dirToGua[facing];
    })() : '坎';
    var guaNum = FS.GUA_NAMES ? (function () {
      var m = { 坎: 1, 坤: 2, 震: 3, 巽: 4, 乾: 6, 兑: 7, 艮: 8, 离: 9 };
      return m[houseGua];
    })() : 1;

    var sectors = FS.bazhaiSectors(guaNum);
    var map = {};
    sectors.forEach(function (s) { map[s.direction] = s; });

    var h2 = '<div class="bz-pan-title">' + facing + '向 · ' + houseGua + '宅（大游年）</div>';
    h2 += '<div class="bz-grid">';
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        var d = BZ_GRID[r][c];
        if (d === '中') {
          h2 += '<div class="bz-cell bz-center"><div class="bz-star">' + houseGua + '</div><div class="bz-name">宅卦</div><div class="bz-gz">' + facing + '向</div></div>';
          continue;
        }
        var s = map[d];
        if (!s) { h2 += '<div class="bz-cell"></div>'; continue; }
        var isFacing = d === facing;
        h2 += '<div class="bz-cell' + (isFacing ? ' bz-facing' : '') + '">';
        h2 += '<div class="bz-dir">' + d + '</div>';
        h2 += '<div class="bz-star ' + QUALITY_CLS[s.quality] + '">' + s.star + '</div>';
        h2 += '<div class="bz-name">' + s.xing + '·' + s.wx + '</div>';
        h2 += '<div class="bz-q ' + QUALITY_CLS[s.quality] + '">' + s.quality + '</div>';
        h2 += '</div>';
      }
    }
    h2 += '</div>';
    document.getElementById('bazhai-pan').innerHTML = h2;

    // 命卦
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
          var d2 = BZ_GRID[r2][c2];
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
  // 3x3 布局（上南，传统）：[东南 南 西南 / 东 中 西 / 东北 北 西北]
  var XK_GRID = [['东南', '南', '西南'], ['东', '中', '西'], ['东北', '北', '西北']];
  var DIR_TO_LUOSHU = { 北: 1, 西南: 2, 东: 3, 东南: 4, 中: 5, 西北: 6, 西: 7, 东北: 8, 南: 9 };
  var LUOSHU_TO_DIR = {};
  for (var kk in DIR_TO_LUOSHU) LUOSHU_TO_DIR[DIR_TO_LUOSHU[kk]] = kk;

  function renderXuankong() {
    var FS = window.FengShui;
    var year = parseInt(document.getElementById('xk-year').value, 10) || new Date().getFullYear();
    // 坐山：下拉选择优先，否则跟随当前朝向
    var sel = document.getElementById('xk-shan');
    var shanIdx = sel && sel.value !== '' ? parseInt(sel.value, 10) : FS.shanIndexFromDegree(smoothHeading || 0);
    if (sel) sel.value = shanIdx;
    var pan = FS.xuankongPan(year, shanIdx);
    var cellMap = {};
    pan.palaces.forEach(function (p) { cellMap[p.direction] = p; });

    var h2 = '<div class="xk-pan-title">' + pan.yunName + ' · ' + pan.shan + '山' + pan.xiang + '向（坐' + pan.shanPalace + '朝' + pan.xiangPalace + '）</div>';
    h2 += '<div class="xk-sub">山星' + pan.shanStar + (pan.shanReverse ? '逆' : '顺') + '飞 · 向星' + pan.xiangStar + (pan.xiangReverse ? '逆' : '顺') + '飞</div>';
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
        h2 += '<div class="xk-cell">';
        h2 += '<div class="xk-dir">' + d + '</div>';
        h2 += '<div class="xk-yun" style="color:' + st.color + '">' + p.yun + '<span class="xk-sname">' + st.name.replace(/^[一二三四五六七八九]/, '') + '</span></div>';
        h2 += '<div class="xk-sx"><span>山' + p.shan + '</span><span>向' + p.xiang + '</span></div>';
        h2 += '</div>';
      }
    }
    h2 += '</div>';
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
    if (type === 'bazhai') renderBazhai();
    if (type === 'xuankong') renderXuankong();
  }

  // ============ 主更新分发 ============
  function updateUI() {
    var info = updateInfo();
    if (curType === 'circular') updateCircular();
    else if (curType === 'bazhai') renderBazhai();
    else if (curType === 'xuankong') renderXuankong();
  }

  function onOrientation(e) {
    var raw = getHeadingFromEvent(e);
    if (raw === null) return;
    heading = raw;
    smooth(raw);
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
        else {
          document.getElementById('status').textContent = '权限被拒绝，请允许访问运动传感器后重试';
          document.getElementById('status').className = 'err';
        }
      }).catch(function (err) {
        document.getElementById('status').textContent = '请求权限出错：' + err.message;
        document.getElementById('status').className = 'err';
      });
    } else {
      startSensors();
    }
  }

  function startSim() {
    if (simMode) return;
    simMode = true;
    running = true;
    smoothHeading = 0;
    document.getElementById('status').textContent = '模拟模式：自动旋转演示（桌面无传感器）';
    document.getElementById('status').className = 'sim';
    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('sim-btn').textContent = '停止模拟';
    simTimer = setInterval(function () {
      smoothHeading = norm360(smoothHeading + 0.8);
      heading = smoothHeading;
      updateUI();
    }, 50);
  }
  function stopSim() {
    if (simTimer) { clearInterval(simTimer); simTimer = null; }
    simMode = false;
    running = false;
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
    document.getElementById('degree').textContent = '--';
    document.getElementById('shan24').textContent = '--';
    document.getElementById('zhi12').textContent = '--';
    document.getElementById('dir8').textContent = '--';

    var api = 'deviceorientation' in window ? 'DeviceOrientation ✓' : '不支持';
    document.getElementById('api-status').textContent = 'API：' + api + (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function' ? '（iOS 需授权）' : '');

    document.getElementById('start-btn').addEventListener('click', requestPermissionAndStart);
    document.getElementById('sim-btn').addEventListener('click', toggleSim);
    document.getElementById('set-difen-btn').addEventListener('click', setDifen);

    // 类型切换
    var tabs = document.querySelectorAll('.type-tabs .tab');
    for (var i = 0; i < tabs.length; i++) {
      (function (t) {
        t.addEventListener('click', function () { setType(t.getAttribute('data-type')); });
      })(tabs[i]);
    }
    // 八宅控件
    document.getElementById('birth-year').addEventListener('input', renderBazhai);
    var radios = document.querySelectorAll('input[name=bg]');
    for (var j = 0; j < radios.length; j++) radios[j].addEventListener('change', renderBazhai);
    // 玄空控件
    document.getElementById('xk-year').addEventListener('input', renderXuankong);
    document.getElementById('xk-shan').addEventListener('change', renderXuankong);

    window.addEventListener('compassneedscalibration', function (e) {
      document.getElementById('status').textContent = '⚠ 罗盘需要校准：请将手机沿"8"字形转动';
      document.getElementById('status').className = 'warn';
      e.preventDefault();
    });

    // 玄空默认年份
    var now = new Date();
    if (!document.getElementById('xk-year').value) document.getElementById('xk-year').value = now.getFullYear();
    // 初始渲染（桌面直接显示三种盘面效果）
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
