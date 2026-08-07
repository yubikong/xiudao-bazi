// ============ 手机罗盘（DeviceOrientation） ============
// 参考：github.com/OldrichKruchna/kompas + MDN deviceorientation
// iOS: webkitCompassHeading (0-360 顺时针 正北=0)
// Android: deviceorientationabsolute.alpha → 360-alpha
(function () {
  'use strict';

  // ---- 基础数据 ----
  var GAN = '甲乙丙丁戊己庚辛壬癸';
  var ZHI = '子丑寅卯辰巳午未申酉戌亥';
  // 二十四山（每山 15°，子=0°）
  var SHAN24 = ['子', '癸', '丑', '艮', '寅', '甲', '卯', '乙', '辰', '巽', '巳', '丙', '午', '丁', '未', '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥', '壬'];
  // 十二地支方位（每 30°，子=0°）
  var ZHI12 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  // 八方向（每 45°）
  var DIR8 = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  // 五行色
  var WX_COLOR = { 子: '#007bff', 丑: '#a17323', 寅: '#228b22', 卯: '#228b22', 辰: '#a17323', 巳: '#d41313', 午: '#d41313', 未: '#a17323', 申: '#ffa436', 酉: '#ffa436', 戌: '#a17323', 亥: '#007bff' };

  var heading = null;      // 当前朝向（0-360）
  var smoothHeading = null; // 平滑后的朝向
  var running = false;     // 传感器是否在跑
  var simMode = false;     // 模拟模式（桌面演示）
  var simTimer = null;

  function norm360(d) { d = d % 360; if (d < 0) d += 360; return d; }

  // 从事件提取朝向（跨平台）
  function getHeadingFromEvent(e) {
    if (e.webkitCompassHeading !== undefined) {
      return norm360(e.webkitCompassHeading);
    }
    if (e.absolute && e.alpha !== null && e.alpha !== undefined) {
      return norm360(360 - e.alpha);
    }
    if (e.alpha !== null && e.alpha !== undefined) {
      // 非绝对方向（可能是相对），仍尽力使用
      return norm360(360 - e.alpha);
    }
    return null;
  }

  // 指数平滑（处理 0/360 环绕）
  function smooth(raw) {
    if (smoothHeading === null) { smoothHeading = raw; return; }
    var diff = raw - smoothHeading;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    smoothHeading = norm360(smoothHeading + diff * 0.35);
  }

  // ---- UI 更新 ----
  function updateUI() {
    var h = smoothHeading;
    var deg = Math.round(h) % 360;
    var shanIdx = Math.floor((h + 7.5) / 15) % 24;
    var zhiIdx = Math.floor((h + 15) / 30) % 12;
    var dirIdx = Math.floor((h + 22.5) / 45) % 8;
    var shan = SHAN24[shanIdx];
    var zhi = ZHI12[zhiIdx];

    document.getElementById('degree').textContent = deg + '°';
    document.getElementById('shan24').textContent = shan;
    document.getElementById('zhi12').textContent = zhi;
    document.getElementById('zhi12').style.color = WX_COLOR[zhi] || '#333';
    document.getElementById('dir8').textContent = dir8Name(dirIdx, h);

    // 盘面旋转 -h（北转到真实方向）
    var dial = document.getElementById('dial');
    if (dial) dial.setAttribute('transform', 'rotate(' + (-h) + ' 200 200)');
    // 中央指示刻度标记（顶部三角）不需要动

    // 地分联动
    window._compassDifen = zhi;
    var btn = document.getElementById('set-difen-btn');
    if (btn) {
      btn.textContent = '设为金口诀地分（' + zhi + '）';
      btn.setAttribute('data-zhi', zhi);
    }
  }

  function dir8Name(idx, h) {
    // 8 方位（每 45°），以方位中心角为基准做"偏"向描述
    // 例：北偏东 / 东北偏北 / 东偏南 / 西北偏西
    var names = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
    var base = names[idx];
    var center = idx * 45;
    var dist = norm360(h - center);          // 从中心顺时针偏角（0-360）
    var prev = names[(idx + 7) % 8], next = names[(idx + 1) % 8];
    // 取相邻方位名中与 base 不同的单字作为偏转方向（双字方位取另一字）
    function diffChar(azi, b) {
      if (azi.length === 1) return azi;
      return azi.charAt(0) === b.charAt(0) ? azi.charAt(1) : azi.charAt(0);
    }
    if (dist < 7.5 || dist > 352.5) return base;                    // 正方位
    if (dist < 22.5) return base + '偏' + diffChar(next, base);     // 顺时针偏：北偏东
    return base + '偏' + diffChar(prev, base);                      // 逆时针偏：东北偏北 / 北偏西
  }

  // ---- 传感器启动 ----
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
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+
      DeviceOrientationEvent.requestPermission().then(function (state) {
        if (state === 'granted') {
          startSensors();
        } else {
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

  // ---- 模拟模式（桌面演示：自动旋转） ----
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
  function toggleSim() {
    if (simMode) stopSim(); else startSim();
  }

  // ---- SVG 罗盘生成 ----
  function buildSvg() {
    var cx = 200, cy = 200;
    var s = '';
    s += '<svg id="compassSvg" viewBox="0 0 400 400" width="100%" height="100%">';
    // 外圈底色
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="198" fill="#fdf8ef" stroke="#a1a1a1" stroke-width="2"/>';
    // 外圈细环
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="190" fill="none" stroke="#d9c9a8" stroke-width="1"/>';
    // 旋钮组（盘面）
    s += '<g id="dial">';
    // 刻度线（每 15°）：30°主刻度长线，15°次刻度短线
    for (var a = 0; a < 360; a += 15) {
      var major = (a % 30 === 0);
      var r1 = major ? 178 : 184;
      var r2 = 190;
      var x1 = cx + r1 * Math.sin(a * Math.PI / 180), y1 = cy - r1 * Math.cos(a * Math.PI / 180);
      var x2 = cx + r2 * Math.sin(a * Math.PI / 180), y2 = cy - r2 * Math.cos(a * Math.PI / 180);
      s += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + (major ? '#8a6d3b' : '#c4b48c') + '" stroke-width="' + (major ? 2 : 1) + '"/>';
    }
    // 二十四山文字（半径 162，每 15°，保持文字水平）
    for (var i = 0; i < 24; i++) {
      var ang = i * 15;
      var rad = ang * Math.PI / 180;
      var tx = cx + 162 * Math.sin(rad), ty = cy - 162 * Math.cos(rad);
      s += '<text x="' + tx.toFixed(1) + '" y="' + (ty + 5).toFixed(1) + '" text-anchor="middle" font-size="17" fill="#5a4632" font-weight="600">' + SHAN24[i] + '</text>';
    }
    // 十二地支文字（半径 126，五行色）
    for (var j = 0; j < 12; j++) {
      var ang2 = j * 30;
      var rad2 = ang2 * Math.PI / 180;
      var tx2 = cx + 126 * Math.sin(rad2), ty2 = cy - 126 * Math.cos(rad2);
      var z = ZHI12[j];
      s += '<text x="' + tx2.toFixed(1) + '" y="' + (ty2 + 6).toFixed(1) + '" text-anchor="middle" font-size="20" font-weight="700" fill="' + (WX_COLOR[z] || '#333') + '">' + z + '</text>';
    }
    // 四正方位大字（半径 88）
    var four = [[0, '北', '#d41313'], [90, '东', '#228b22'], [180, '南', '#007bff'], [270, '西', '#ffa436']];
    for (var k = 0; k < 4; k++) {
      var a3 = four[k][0], r3 = 88;
      var rad3 = a3 * Math.PI / 180;
      var tx3 = cx + r3 * Math.sin(rad3), ty3 = cy - r3 * Math.cos(rad3);
      s += '<text x="' + tx3.toFixed(1) + '" y="' + (ty3 + 9).toFixed(1) + '" text-anchor="middle" font-size="30" font-weight="800" fill="' + four[k][2] + '">' + four[k][1] + '</text>';
    }
    // 内圈
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="70" fill="none" stroke="#d9c9a8" stroke-width="1.5"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="30" fill="#fff" stroke="#a1a1a1" stroke-width="1.5"/>';
    s += '</g>';
    // 中央指针（固定指上：红色=北，白灰=南）
    s += '<g id="needle">';
    // 北针（红）
    s += '<polygon points="200,118 192,170 208,170" fill="#d41313"/>';
    // 南针（白底灰边）
    s += '<polygon points="200,282 192,230 208,230" fill="#f5f5f5" stroke="#999" stroke-width="1"/>';
    // 中央轴点
    s += '<circle cx="200" cy="200" r="8" fill="#b98c51" stroke="#fff" stroke-width="2"/>';
    s += '</g>';
    // 顶部指北标记（固定小三角）
    s += '<polygon points="200,6 193,20 207,20" fill="#d41313"/>';
    s += '</svg>';
    return s;
  }

  // ---- 地分联动：跳转金口诀并带上当前地支 ----
  function setDifen() {
    var z = document.getElementById('set-difen-btn').getAttribute('data-zhi') || '寅';
    try {
      localStorage.setItem('compass_difen', z);
    } catch (e) {}
    // 尝试从当前 URL 提取 v 参数带过去
    var v = new URLSearchParams(location.search).get('v') || '';
    var q = v ? '?v=' + v : '';
    location.href = 'jinkoujue.html' + q;
  }

  // ---- 初始化 ----
  function init() {
    var svgBox = document.getElementById('compass-box');
    if (svgBox) svgBox.innerHTML = buildSvg();
    document.getElementById('degree').textContent = '--';
    document.getElementById('shan24').textContent = '--';
    document.getElementById('zhi12').textContent = '--';
    document.getElementById('dir8').textContent = '--';

    // API 检测
    var api = 'deviceorientation' in window ? 'DeviceOrientation ✓' : '不支持';
    document.getElementById('api-status').textContent = 'API 检测：' + api + (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function' ? '（iOS 需点击授权）' : '');
    document.getElementById('start-btn').addEventListener('click', requestPermissionAndStart);
    document.getElementById('sim-btn').addEventListener('click', toggleSim);
    document.getElementById('set-difen-btn').addEventListener('click', setDifen);

    // 校准提示
    window.addEventListener('compassneedscalibration', function (e) {
      document.getElementById('status').textContent = '⚠ 罗盘需要校准：请将手机沿"8"字形转动';
      document.getElementById('status').className = 'warn';
      e.preventDefault();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.Compass = { startSensors: startSensors, startSim: startSim, stopSim: stopSim, getHeading: function () { return heading; } };
})();
