// ============ 金口诀排盘（按 kentang2017/kinjinkou 权威算法重写） ============
(function () {
  var Solar = window.Solar;
  var LunarUtil = window.LunarUtil;
  var SS = window.ShenShaData;
  var U = window.Utils;

  var GAN = '甲乙丙丁戊己庚辛壬癸';
  var ZHI = '子丑寅卯辰巳午未申酉戌亥';
  // 将神星名（子=神后...亥=登明）
  var JIANG_NAME = ['神后', '大吉', '功曹', '太冲', '天罡', '太乙', '胜光', '小吉', '传送', '从魁', '河魁', '登明'];
  // 贵神地支特殊顺序（贵人腾蛇朱雀六合勾陈青龙天空白虎太常玄武太阴天后）
  var GUI_DIZHI = '丑巳午卯辰寅戌申未子酉亥'.split('');
  var GUI_SHEN = ['贵人', '腾蛇', '朱雀', '六合', '勾陈', '青龙', '天空', '白虎', '太常', '玄武', '太阴', '天后'];
  // 地支方位
  var DIRECTION = { 子: '北', 丑: '东北', 寅: '东北', 卯: '东', 辰: '东南', 巳: '东南', 午: '南', 未: '西南', 申: '西南', 酉: '西', 戌: '西北', 亥: '西北' };
  // 五行相生（SHENG[a]=b 表示 a 生 b）与相克（KE[a]=b 表示 a 克 b）
  var SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  var KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  // 五子元遁（日干 → 子位起干序号，1=甲子）
  var WUZI = { 甲: 1, 己: 1, 乙: 3, 庚: 3, 丙: 5, 辛: 5, 丁: 7, 壬: 7, 戊: 9, 癸: 9 };

  // 新增神煞数据表
  var TAI_JI = { 甲: ['子', '午'], 乙: ['子', '午'], 丙: ['卯', '酉'], 丁: ['卯', '酉'], 戊: ['辰', '戌', '丑', '未'], 己: ['辰', '戌', '丑', '未'], 庚: ['寅', '亥'], 辛: ['寅', '亥'], 壬: ['巳', '申'], 癸: ['巳', '申'] };
  var GUO_YIN = { 甲: '戌', 乙: '亥', 丙: '丑', 丁: '寅', 戊: '丑', 己: '寅', 庚: '辰', 辛: '巳', 壬: '未', 癸: '申' };
  var CI_GUAN = { 甲: '巳', 乙: '午', 丙: '申', 丁: '亥', 戊: '申', 己: '亥', 庚: '寅', 辛: '卯', 壬: '午', 癸: '巳' };
  var FU_XING = { 甲: '寅', 乙: '丑', 丙: '子', 丁: '亥', 戊: '申', 己: '未', 庚: '午', 辛: '巳', 壬: '辰', 癸: '卯' };
  var DE_XIU = { 寅午戌: { de: ['丙', '丁'], xiu: ['戊', '己'] }, 申子辰: { de: ['壬', '癸'], xiu: ['甲', '乙'] }, 亥卯未: { de: ['甲', '乙'], xiu: ['壬', '癸'] }, 巳酉丑: { de: ['庚', '辛'], xiu: ['丙', '丁'] } };
  var HE_GAN = { 甲: '己', 乙: '庚', 丙: '辛', 丁: '壬', 戊: '癸', 己: '甲', 庚: '乙', 辛: '丙', 壬: '丁', 癸: '戊' };
  var LIU_PO = { 子: '酉', 丑: '辰', 寅: '亥', 卯: '午', 辰: '丑', 巳: '申', 午: '卯', 未: '戌', 申: '巳', 酉: '子', 戌: '未', 亥: '寅' };

  var COMMON_SHEN = ['天乙贵人', '驿马', '天德贵人', '月德贵人', '空亡（日柱）', '空亡（年柱）', '六破', '禄神', '桃花', '华盖', '将星', '劫煞', '灾煞', '亡神', '阳刃', '红鸾', '天喜', '天医', '魁罡', '金舆', '文昌'];

  var _state = null;

  function parseInput(v) {
    v = String(v || '').replace(/[^\d]/g, '');
    if (v.length < 4) return null;
    var year = parseInt(v.substr(0, 4), 10);
    var month = v.length >= 6 ? parseInt(v.substr(4, 2), 10) : 6;
    var day = v.length >= 8 ? parseInt(v.substr(6, 2), 10) : 1;
    var hour = v.length >= 10 ? parseInt(v.substr(8, 2), 10) : 12;
    var minute = v.length >= 12 ? parseInt(v.substr(10, 2), 10) : 0;
    try { return Solar.fromYmdHms(year, month, day, hour, minute, 0); } catch (e) { return null; }
  }

  // 中气换月将表（太阳过宫：某中气后至下一中气前用该将）
  var JIANG_BY_ZHONGQI = { '雨水': '亥', '春分': '戌', '谷雨': '酉', '小满': '申', '夏至': '未', '大暑': '午', '处暑': '巳', '秋分': '辰', '霜降': '卯', '小雪': '寅', '冬至': '丑', '大寒': '子' };
  // 月将按中气精确换将：取当前日期之前（含）最近的中气
  function getMonthJiangByZhongQi(lunar) {
    try {
      var table = lunar.getJieQiTable();
      var nowJd = lunar.getSolar().getJulianDay();
      var best = null, bestJd = -1;
      for (var name in JIANG_BY_ZHONGQI) {
        var item = table[name];
        if (!item || typeof item.getJulianDay !== 'function') continue;
        var jd = item.getJulianDay();
        if (jd <= nowJd && jd > bestJd) { bestJd = jd; best = name; }
      }
      if (best) return JIANG_BY_ZHONGQI[best];
      return '丑'; // 年初（1/1~大寒前）＝冬至后，丑将
    } catch (e) {
      return null;
    }
  }

  // ============ 金口诀四课（权威算法） ============
  function calcKe(solar, difen, customJiang) {
    var lunar = solar.getLunar();
    var bazi = lunar.getEightChar();
    bazi.setSect(1);
    var yearGan = bazi.getYearGan(), yearZhi = bazi.getYearZhi();
    var monthGan = bazi.getMonthGan(), monthZhi = bazi.getMonthZhi();
    var dayGan = bazi.getDayGan(), dayZhi = bazi.getDayZhi();
    var timeGan = bazi.getTimeGan(), timeZhi = bazi.getTimeZhi();

    var mz = ZHI.indexOf(monthZhi);
    var dz = ZHI.indexOf(dayZhi);
    var tz = ZHI.indexOf(timeZhi);
    var df = ZHI.indexOf(difen);

    // 1. 月将：自定义优先（12 将），否则默认按中气换将（太阳过宫）
    var yuejiang = customJiang && ZHI.indexOf(customJiang) >= 0 ? customJiang : null;
    var yuejiangAuto = true;
    if (!yuejiang) {
      yuejiang = getMonthJiangByZhongQi(lunar);
      if (!yuejiang) {
        // 兜底：月支公式（13 - 月支序）
        yuejiang = ZHI[(13 - mz) % 12];
      }
    } else {
      yuejiangAuto = false;
    }
    var yuejiangIdx = ZHI.indexOf(yuejiang);

    // 2. 起天盘（月将加时）
    var offset = ((yuejiangIdx - tz) % 12 + 12) % 12;
    var tianPan = [];
    var panJiang = []; // 天盘对应将神星名
    for (var i = 0; i < 12; i++) {
      tianPan[i] = ZHI[(i + offset) % 12];
      panJiang[i] = JIANG_NAME[(i + offset) % 12];
    }

    // 3. 将神 = 数到地分
    var jiangshen = tianPan[df];
    var jiangshenName = panJiang[df];

    // 4. 贵神：贵人位 + 顺逆行神盘
    var isDay = ['卯', '辰', '巳', '午', '未', '申'].indexOf(timeZhi) >= 0;
    var guiRen;
    if (['甲', '戊', '庚'].indexOf(dayGan) >= 0) guiRen = isDay ? '丑' : '未';
    else if (['乙', '己'].indexOf(dayGan) >= 0) guiRen = isDay ? '子' : '申';
    else if (['丙', '丁'].indexOf(dayGan) >= 0) guiRen = isDay ? '亥' : '酉';
    else if (['壬', '癸'].indexOf(dayGan) >= 0) guiRen = isDay ? '巳' : '卯';
    else guiRen = isDay ? '寅' : '午'; // 辛：昼贵寅、夜贵午（金口诀"六辛逢马虎"，辛日旦贵在寅）
    var isShun = (isDay && ['壬', '癸', '辛'].indexOf(dayGan) < 0) || (!isDay && ['壬', '癸', '辛'].indexOf(dayGan) >= 0);
    var idx = ZHI.indexOf(guiRen);
    var shenPan = new Array(12);
    for (var s = 1; s <= 12; s++) {
      var key;
      if (isShun) {
        if (idx + s >= 13) idx -= 12;
        key = idx + s;
      } else {
        if (idx - s + 2 <= 0) idx += 12;
        key = idx - s + 2;
      }
      shenPan[key - 1] = GUI_DIZHI[s - 1];
    }
    var guishen = shenPan[df];
    var guishenName = GUI_SHEN[GUI_DIZHI.indexOf(guishen)];

    // 5. 五子元遁（日干起）→ 人元（只干）/ 将神干 / 贵神干
    var ss = WUZI[dayGan];
    function ganFromZhi(zhiIdx) {
      return GAN[((zhiIdx + ss - 1) % 10 + 10) % 10];
    }
    var renyuan = ganFromZhi(df);
    var jianggan = ganFromZhi(ZHI.indexOf(jiangshen));
    var shengan = ganFromZhi(ZHI.indexOf(guishen));

    // 6. 旺衰（课内五行生克定旺）
    var wangShuai = calcWangShuai([renyuan, guishen, jiangshen, difen]);

    // 7. 用神（阴阳）
    var yongShen = calcYongShen([renyuan, guishen, jiangshen, difen]);

    // 8. 四大空亡（日柱纳音）
    var sidakongwang = calcSiDaKongWang(dayGan + dayZhi);

    return {
      difen: difen, difenDir: DIRECTION[difen],
      zhanshi: timeZhi,
      yuejiang: yuejiang,
      yuejiangAuto: yuejiangAuto,
      renyuan: renyuan,
      renyuanWX: U.wuXingMap(renyuan),
      renyuanYY: '阳阴'.charAt(GAN.indexOf(renyuan) % 2),
      gui: { gan: shengan, zhi: guishen, ganzhi: shengan + guishen, shen: guishenName, wx: U.wuXingMap(guishen), yy: '阳阴'.charAt(ZHI.indexOf(guishen) % 2) },
      jiang: { gan: jianggan, zhi: jiangshen, ganzhi: jianggan + jiangshen, name: jiangshenName, wx: U.wuXingMap(jiangshen), yy: '阳阴'.charAt(ZHI.indexOf(jiangshen) % 2) },
      difenWX: U.wuXingMap(difen),
      difenYY: '阳阴'.charAt(df % 2),
      wangShuai: wangShuai,
      yongShen: yongShen,
      sidakongwang: sidakongwang,
      isDay: isDay, guiRen: guiRen, isShun: isShun,
      tianPan: tianPan, panJiang: panJiang, shenPan: shenPan,
      bazi: { yearGan: yearGan, yearZhi: yearZhi, monthGan: monthGan, monthZhi: monthZhi, dayGan: dayGan, dayZhi: dayZhi, timeGan: timeGan, timeZhi: timeZhi },
      idx: { mz: mz, dz: dz, tz: tz, df: df }
    };
  }

  // 旺衰（参考《金口诀旺衰判断》图片规则：课内四位人元干/贵神支/将神支/地分支的五行判断）
  // 1. 四种五行齐全 → 不受克为旺（缺的五行所克者旺，如缺土→水不被土克→水旺）
  // 2. 三种五行(2+1+1) → 克他爻为旺（课内实际存在的克关系中克者旺）
  // 3. 两种五行(3+1) → 多者为旺（一个五行出三次，此五行最旺，无视生克）
  // 4. 两种五行(2+2) → 克关系取克者旺；生关系取受生者旺
  // 5. 一种五行 → 该五行旺
  function calcWangShuai(gzList) {
    var wxs = gzList.map(function (g) { return U.wuXingMap(g); });
    var cnt = {};
    wxs.forEach(function (w) { cnt[w] = (cnt[w] || 0) + 1; });
    var present = Object.keys(cnt);
    var wang = null;
    // 判断 w 是否被课内其他五行克制
    function isKeBy(w) {
      for (var i = 0; i < present.length; i++) {
        if (present[i] !== w && KE[present[i]] === w) return true;
      }
      return false;
    }
    // 课内存在的克关系中的克者集合
    function keZhe() {
      var out = [];
      for (var i = 0; i < present.length; i++) {
        for (var j = 0; j < present.length; j++) {
          if (i !== j && KE[present[i]] === present[j]) { out.push(present[i]); break; }
        }
      }
      return out;
    }
    if (present.length === 4) {
      // 不受克为旺：唯一没有被课内五行克到的
      var unKe = present.filter(function (w) { return !isKeBy(w); });
      wang = unKe[0] || present[0];
    } else if (present.length === 3) {
      // 克他爻为旺
      var kers = keZhe();
      if (kers.length === 1) {
        wang = kers[0];
      } else if (kers.length > 1) {
        // 多个克者：优先取自身不受克者，再取成对者，再取数量多者
        var unKe2 = kers.filter(function (x) { return !isKeBy(x); });
        if (unKe2.length === 1) wang = unKe2[0];
        else if (unKe2.length > 1) {
          var pair2 = unKe2.filter(function (x) { return cnt[x] >= 2; });
          wang = pair2[0] || unKe2[0];
        } else {
          var pair3 = kers.filter(function (x) { return cnt[x] >= 2; });
          wang = pair3[0] || kers[0];
        }
      } else {
        // 无克关系（不常见）：取成对的五行
        var pair = present.filter(function (x) { return cnt[x] >= 2; });
        wang = pair[0] || present[0];
      }
    } else if (present.length === 2) {
      var a = present[0], b = present[1];
      if (cnt[a] >= 3 || cnt[b] >= 3) {
        // 3+1：多者为旺（无视生克）
        wang = cnt[a] >= 3 ? a : b;
      } else {
        // 2+2 二对：克关系→克者旺；生关系→受生者旺
        if (KE[a] === b) wang = a;
        else if (KE[b] === a) wang = b;
        else if (SHENG[a] === b) wang = b;
        else if (SHENG[b] === a) wang = a;
        else wang = a;
      }
    } else {
      wang = present[0]; // 一种五行
    }
    // 旺相休囚死（旺=最旺者、相=旺所生、休=生旺者、囚=克旺者、死=旺所克）
    var res = {};
    wxs.forEach(function (w, idx) {
      var g = gzList[idx];
      if (w === wang) res[g] = '旺';
      else if (SHENG[wang] === w) res[g] = '相';
      else if (SHENG[w] === wang) res[g] = '休';
      else if (KE[wang] === w) res[g] = '死';
      else if (KE[w] === wang) res[g] = '囚';
      else res[g] = '';
    });
    res.wang = wang;
    return res;
  }

  // 用神（阴阳）
  function calcYongShen(gzList) {
    var yys = gzList.map(function (g) { return '阳阴'.charAt((GAN.indexOf(g) >= 0 ? GAN.indexOf(g) : ZHI.indexOf(g)) % 2); });
    var yang = 0;
    yys.forEach(function (y) { if (y === '阳') yang++; });
    if (yang === 0) return '将神';
    if (yang === 1) { var i = yys.indexOf('阳'); return ['人元', '贵神', '将神', '地分'][i]; }
    if (yang === 2) return '将神';
    if (yang === 3) { var j = yys.indexOf('阴'); return ['人元', '贵神', '将神', '地分'][j]; }
    return '贵神';
  }

  // 四大空亡（日柱纳音旬）
  function calcSiDaKongWang(dayGZ) {
    var jiazi = LunarUtil.JIA_ZI || [];
    var n = jiazi.indexOf(dayGZ) + 1; // 1-60
    if (n < 1) n = 1;
    if ((n >= 1 && n <= 10) || (n >= 31 && n <= 40)) return '水';
    if ((n >= 21 && n <= 30) || (n >= 51 && n <= 60)) return '金';
    return '无';
  }

  // ============ 神煞计算 ============
  var P = [], P_COMMON = [], P_RARE = [];
  var ke = null;
  function resetP() { P = []; P_COMMON = []; P_RARE = []; }
  function isCommon(name) { return COMMON_SHEN.indexOf(name) >= 0; }
  function hitGanArr(arr) {
    var list = [ke.bazi.yearGan, ke.bazi.monthGan, ke.bazi.dayGan, ke.bazi.timeGan, ke.renyuan, ke.gui.gan, ke.jiang.gan];
    var pos = ['年干', '月干', '日干', '时干', '人元', '贵神', '将神'];
    var found = [];
    for (var i = 0; i < list.length; i++) { for (var j = 0; j < arr.length; j++) { if (list[i] === arr[j]) { found.push(pos[i]); break; } } }
    return found;
  }
  function hitZhiArr(arr) {
    var list = [ke.bazi.yearZhi, ke.bazi.monthZhi, ke.bazi.dayZhi, ke.bazi.timeZhi, ke.difen, ke.jiang.zhi];
    var pos = ['年支', '月支', '日支', '时支', '地分', '将神'];
    var found = [];
    for (var i = 0; i < list.length; i++) { for (var j = 0; j < arr.length; j++) { if (list[i] === arr[j]) { found.push(pos[i]); break; } } }
    return found;
  }
  function hitStr(found) { return found.length ? '✓' + found.join('、') : ''; }
  function push(name, tag, val, hit) {
    var item = { name: name, tag: tag, val: val, hit: hit || '' };
    P.push(item);
    if (isCommon(name)) P_COMMON.push(item); else P_RARE.push(item);
  }
  function pushZhi(name, tag, zhiArr, src) {
    var arr = Array.isArray(zhiArr) ? zhiArr : [zhiArr];
    var found = hitZhiArr(arr);
    push(name, tag, arr.join('、') + '（' + src + '）', hitStr(found));
  }
  function pushGan(name, tag, ganArr, src) {
    var arr = Array.isArray(ganArr) ? ganArr : [ganArr];
    var found = hitGanArr(arr);
    push(name, tag, arr.join('、') + '（' + src + '）', hitStr(found));
  }
  function pushRizhu(name, tag, ok, dayGZ, listStr) {
    push(name, tag, ok ? '✓ ' + dayGZ + ' 入格' : '— ' + dayGZ + ' 不入格' + (listStr ? '（' + listStr + '）' : ''), '');
  }
  function yiMaZhi(map, name) {
    if (!map) return '';
    for (var k in map) if (map[k] === name) return k;
    return '';
  }

  function calcShenSha() {
    resetP();
    var b = ke.bazi;
    var dayGZ = b.dayGan + b.dayZhi;
    var sanHeY = SS.sanHe[b.yearZhi];
    var sanHeD = SS.sanHe[b.dayZhi];
    var yiMaY = SS.yiMa[sanHeY] || {};
    var yiMaD = SS.yiMa[sanHeD] || {};
    var de = SS.erDe[b.monthZhi] || ['', ''];

    // ---- 常用神煞 ----
    pushZhi('天乙贵人', '吉', SS.tianYi[b.dayGan] || [], '日干' + b.dayGan);
    pushZhi('驿马', '吉', [yiMaZhi(yiMaY, '驿马'), yiMaZhi(yiMaD, '驿马')].filter(Boolean), '年支' + b.yearZhi + '/日支' + b.dayZhi);
    if (de[0]) pushGan('天德贵人', '吉', de[0], '月支' + b.monthZhi);
    if (de[1]) pushGan('月德贵人', '吉', de[1], '月支' + b.monthZhi);
    var kongWang = U.xunKong(dayGZ);
    pushZhi('空亡（日柱）', '凶', [kongWang.substr(0, 1), kongWang.substr(1, 1)], '日柱' + dayGZ + '旬空');
    pushZhi('空亡（年柱）', '凶', SS.jieKong[b.yearGan] || [], '年干' + b.yearGan);
    var poZhis = [];
    var po1 = LIU_PO[b.yearZhi], po2 = LIU_PO[b.dayZhi];
    if (po1) poZhis.push(po1);
    if (po2 && poZhis.indexOf(po2) < 0) poZhis.push(po2);
    pushZhi('六破', '凶', poZhis, '年支' + b.yearZhi + '/日支' + b.dayZhi + '之破');
    pushZhi('禄神', '吉', SS.luShen[b.dayGan] || '', '日干' + b.dayGan);
    pushZhi('桃花', '杂', SS.taoHua[sanHeY] || SS.taoHua[sanHeD] || '', '三合' + sanHeY);
    pushZhi('华盖', '吉', [yiMaZhi(yiMaY, '华盖'), yiMaZhi(yiMaD, '华盖')].filter(Boolean), '三合' + sanHeY);
    pushZhi('将星', '吉', [yiMaZhi(yiMaY, '将星'), yiMaZhi(yiMaD, '将星')].filter(Boolean), '三合' + sanHeY);
    pushZhi('劫煞', '凶', yiMaZhi(yiMaY, '劫煞'), '三合' + sanHeY);
    pushZhi('灾煞', '凶', yiMaZhi(yiMaY, '灾煞'), '三合' + sanHeY);
    pushZhi('亡神', '凶', yiMaZhi(yiMaY, '亡神'), '三合' + sanHeY);
    pushZhi('阳刃', '凶', SS.yangRen[b.dayGan] || '', '日干' + b.dayGan);
    pushZhi('红鸾', '吉', SS.hongLuan[b.yearZhi] || '', '年支' + b.yearZhi);
    pushZhi('天喜', '吉', SS.tianXi[b.monthZhi] || '', '月支' + b.monthZhi);
    pushZhi('天医', '吉', SS.tianYiZhi[b.monthZhi] || '', '月支' + b.monthZhi);
    pushRizhu('魁罡', '吉', SS.kuiGang.indexOf(dayGZ) >= 0, dayGZ, SS.kuiGang.join('、'));
    pushZhi('金舆', '吉', SS.jinYu[b.dayGan] || '', '日干' + b.dayGan);
    pushZhi('文昌', '吉', [SS.wenChang[b.yearGan] || '', SS.wenChang[b.dayGan] || ''].filter(Boolean), '年干' + b.yearGan + '/日干' + b.dayGan);

    // ---- 不常见神煞 ----
    pushZhi('太极贵人', '吉', TAI_JI[b.dayGan] || [], '日干' + b.dayGan);
    if (de[0]) pushGan('天德合', '吉', HE_GAN[de[0]], '天德' + de[0] + '之合');
    if (de[1]) pushGan('月德合', '吉', HE_GAN[de[1]], '月德' + de[1] + '之合');
    pushZhi('国印', '吉', GUO_YIN[b.dayGan] || '', '日干' + b.dayGan);
    pushZhi('学堂', '吉', SS.xueTang[b.dayGan] || '', '日干' + b.dayGan);
    pushZhi('词馆', '吉', CI_GUAN[b.dayGan] || '', '日干' + b.dayGan);
    pushZhi('福星贵人', '吉', FU_XING[b.dayGan] || '', '日干' + b.dayGan);
    var tianShe = SS.tianSheRi[b.monthZhi];
    if (tianShe) pushRizhu('天赦日', '吉', dayGZ === tianShe, dayGZ, tianShe + '为' + b.monthZhi + '月天赦');
    var gans = [b.yearGan, b.monthGan, b.dayGan, b.timeGan];
    var shen3 = '';
    for (var i = 0; i <= 1; i++) {
      if (gans[i] + gans[i + 1] + gans[i + 2] === '甲戊庚') shen3 = '天上三奇';
      if (gans[i] + gans[i + 1] + gans[i + 2] === '乙丙丁') shen3 = '地下三奇';
      if (gans[i] + gans[i + 1] + gans[i + 2] === '壬癸辛') shen3 = '人中三奇';
    }
    push('三奇贵人', shen3 ? '吉' : '杂', shen3 || '无（甲戊庚/乙丙丁/壬癸辛）', shen3 ? '✓四柱连见' : '');
    var dx = DE_XIU[sanHeD] || DE_XIU[sanHeY];
    if (dx) {
      var deGan = gans.filter(function (g) { return dx.de.indexOf(g) >= 0; });
      var xiuGan = gans.filter(function (g) { return dx.xiu.indexOf(g) >= 0; });
      push('德秀贵人', (deGan.length || xiuGan.length) ? '吉' : '杂', '德见' + (deGan.join('') || '无') + ' 秀见' + (xiuGan.join('') || '无') + '（' + (sanHeD || sanHeY) + '月）', '');
    }
    pushZhi('攀鞍', '吉', [yiMaZhi(yiMaY, '攀鞍'), yiMaZhi(yiMaD, '攀鞍')].filter(Boolean), '三合' + sanHeY);
    pushRizhu('十灵日', '吉', SS.shiLingRi.indexOf(dayGZ) >= 0, dayGZ, SS.shiLingRi.join('、'));
    pushRizhu('十富日', '吉', SS.shiFuRi.indexOf(dayGZ) >= 0, dayGZ, SS.shiFuRi.join('、'));
    var ly = SS.liuYaoTianXi[sanHeD] || SS.liuYaoTianXi[sanHeY];
    pushZhi('六曜天喜', '吉', ly || '', '三合' + (sanHeD || sanHeY));
    pushZhi('阴刃', '凶', SS.yinRen[b.dayGan] || '', '日干' + b.dayGan);
    pushZhi('飞刃', '凶', SS.feiRen[b.dayGan] || '', '日干' + b.dayGan);
    pushZhi('红艳', '凶', [SS.hongYan[b.dayGan] || '', SS.hongYan[b.yearGan] || ''].filter(Boolean), '日干/年干');
    pushZhi('流霞', '凶', [SS.liuXia[b.dayGan] || '', SS.liuXia[b.yearGan] || ''].filter(Boolean), '日干' + b.dayGan + '/年干' + b.yearGan);
    pushRizhu('孤鸾', '凶', SS.guNuan.indexOf(dayGZ) >= 0, dayGZ, SS.guNuan.join('、'));
    var tianLuo = (b.dayZhi === '戌' || b.dayZhi === '亥' || b.yearZhi === '戌' || b.yearZhi === '亥');
    var diWang = (b.dayZhi === '辰' || b.dayZhi === '巳' || b.yearZhi === '辰' || b.yearZhi === '巳');
    push('天罗', tianLuo ? '凶' : '杂', tianLuo ? '✓ 日/年支见戌亥' : '—（戌亥为天罗）', tianLuo ? '✓' : '');
    push('地网', diWang ? '凶' : '杂', diWang ? '✓ 日/年支见辰巳' : '—（辰巳为地网）', diWang ? '✓' : '');
    pushZhi('天哭', '凶', SS.tianKuMap[b.yearZhi] || '', '年支' + b.yearZhi);
    pushZhi('天虚', '凶', SS.tianXuMap[b.yearZhi] || '', '年支' + b.yearZhi);
    pushRizhu('进神', '杂', SS.jinBuShen.indexOf(dayGZ) >= 0, dayGZ, SS.jinBuShen.join('、'));
    pushRizhu('退神', '凶', SS.tuiBuShen.indexOf(dayGZ) >= 0, dayGZ, SS.tuiBuShen.join('、'));
    var yiMaList = [['天煞', yiMaZhi(yiMaY, '天煞')], ['地煞', yiMaZhi(yiMaY, '地煞')], ['年煞', yiMaZhi(yiMaY, '年煞')], ['月煞', yiMaZhi(yiMaY, '月煞')], ['六害', yiMaZhi(yiMaY, '六害')]];
    for (var t = 0; t < yiMaList.length; t++) if (yiMaList[t][1]) pushZhi(yiMaList[t][0], '凶', yiMaList[t][1], '三合' + sanHeY);
    var gg = SS.guGua[sanHeY] || SS.guGua[sanHeD];
    if (gg) { pushZhi('孤辰', '凶', gg[0], '三合' + sanHeY); pushZhi('寡宿', '凶', gg[1], '三合' + sanHeY); }
    pushRizhu('阴差阳错', '凶', SS.yinChaYangCuo.indexOf(dayGZ) >= 0, dayGZ, SS.yinChaYangCuo.join('、'));
    pushRizhu('八专', '凶', SS.baZhuan.indexOf(dayGZ) >= 0, dayGZ, SS.baZhuan.join('、'));
    pushRizhu('九丑', '凶', SS.jiuChou.indexOf(dayGZ) >= 0, dayGZ, SS.jiuChou.join('、'));
    pushRizhu('十恶大败', '凶', SS.shiEDaBai.indexOf(dayGZ) >= 0, dayGZ, SS.shiEDaBai.join('、'));
    pushRizhu('金神', '凶', SS.jinShen.indexOf(dayGZ) >= 0, dayGZ, SS.jinShen.join('、'));
    var tianZhuan = SS.tianZhuan[b.monthZhi]; if (tianZhuan) pushRizhu('天转', '凶', dayGZ === tianZhuan, dayGZ, b.monthZhi + '月' + tianZhuan);
    var diZhuan = SS.diZhuan[b.monthZhi]; if (diZhuan) pushRizhu('地转', '凶', dayGZ === diZhuan, dayGZ, b.monthZhi + '月' + diZhuan);
    var siFei = SS.siFeiRi[b.monthZhi]; if (siFei) pushRizhu('四废日', '凶', dayGZ === siFei, dayGZ, b.monthZhi + '月' + siFei);
    pushRizhu('阴阳差错', '凶', SS.yinYang.indexOf(dayGZ) >= 0, dayGZ, SS.yinYang.join('、'));
    var shuiNi = SS.shuiNi[b.dayGan] || []; if (shuiNi.length) pushZhi('水溺', '凶', shuiNi, '日干' + b.dayGan);
    pushZhi('埋儿煞', '凶', SS.maiEr[b.monthZhi] || '', '月支' + b.monthZhi);
    pushZhi('阴注阳受', '凶', SS.yinZhuYangShou[b.yearZhi] || '', '年支' + b.yearZhi);
    pushZhi('年干沐浴', '杂', SS.nianGanMuYu[b.yearGan] || '', '年干' + b.yearGan);
    var ziYi = SS.ziYi[b.dayZhi] || SS.ziYi[b.yearZhi];
    if (ziYi) pushZhi('自缢', '凶', ziYi, '日支/年支' + (SS.ziYi[b.dayZhi] ? b.dayZhi : b.yearZhi));
    var poArr = ['子午卯酉', '寅申巳亥', '辰戌丑未'];
    var poZhi = '';
    for (var q = 0; q < 3; q++) { if (poArr[q].indexOf(b.yearZhi) >= 0) { poZhi = SS.poSui[poArr[q]]; break; } }
    pushZhi('破碎', '凶', poZhi || '', '年支' + b.yearZhi);
    var geJiaoHit = '';
    for (var g = 0; g < SS.geJiao.length; g++) { var pair = SS.geJiao[g]; var zArr = [b.yearZhi, b.monthZhi, b.dayZhi, b.timeZhi]; if (zArr.indexOf(pair[0]) >= 0 && zArr.indexOf(pair[1]) >= 0) { geJiaoHit = '✓ ' + pair; break; } }
    push('隔角', geJiaoHit ? '凶' : '杂', geJiaoHit || '—（' + SS.geJiao.join('、') + '）', geJiaoHit ? '✓' : '');
    pushZhi('丧门', '凶', SS.sangMen[b.yearZhi] || '', '年支' + b.yearZhi);
    pushZhi('吊客', '凶', SS.diaoKe[b.yearZhi] || '', '年支' + b.yearZhi);
    pushZhi('勾煞', '凶', SS.gouSha[b.yearZhi] || '', '年支' + b.yearZhi);
    pushZhi('绞煞', '凶', SS.jiaoSha[b.yearZhi] || '', '年支' + b.yearZhi);
    pushZhi('白虎', '凶', SS.baiHu[b.yearZhi] || '', '年支' + b.yearZhi);
    pushZhi('官符', '凶', SS.guanFu[b.yearZhi] || '', '年支' + b.yearZhi);
    pushZhi('病符', '凶', SS.bingFu[b.yearZhi] || '', '年支' + b.yearZhi);
    pushZhi('死符', '凶', SS.siFu[b.yearZhi] || '', '年支' + b.yearZhi);
    pushZhi('大耗', '凶', SS.daHao[b.yearZhi] || '', '年支' + b.yearZhi);
    pushZhi('宅煞', '凶', SS.zhaiSha[b.yearZhi] || '', '年支' + b.yearZhi);
    pushZhi('墓煞', '凶', SS.muSha[b.yearZhi] || '', '年支' + b.yearZhi);
    pushZhi('三丘', '凶', SS.sanQiu[b.monthZhi] || '', '月支' + b.monthZhi);
    pushZhi('五墓', '凶', SS.wuMu[b.monthZhi] || '', '月支' + b.monthZhi);
  }

  // ============ 三动五动（课内四位生克，非日干） ============
  // 五行：干=人元天干、神=贵神地支、将=将神地支、方=地分支
  // 五动（克）：妻动=干克方、官动=神克干、贼动=神克将、财动=将克神、鬼动=方克干
  // 三动（生/比）：父母动=方生干、子孙动=干生方、兄弟动=干方比
  var WUDONG_GJ = {
    妻动: '妻动于妻妾，官财防损折',
    官动: '官动利求官，相逢禄位迁',
    贼动: '贼动内贼生，勾连诈不明',
    财动: '财动利求财，占官定不谐',
    鬼动: '鬼动忧灾祸，官事并疾病'
  };
  var SANDONG_GJ = {
    父母动: '方生干，主印绶文书职称，求有得',
    子孙动: '干生方，主添人进口、外来财物',
    兄弟动: '干方比和，主朋友兄弟间争执不和'
  };
  function calcSanDong() {
    var gWX = ke.renyuanWX;   // 干：人元天干五行
    var sWX = ke.gui.wx;      // 神：贵神地支五行
    var jWX = ke.jiang.wx;    // 将：将神地支五行
    var fWX = ke.difenWX;     // 方：地分支五行

    // 五动（课内相克）
    var wuDong = [];
    if (KE[gWX] === fWX) wuDong.push({ name: '妻动', cond: '干克方', left: '人元', leftGZ: ke.renyuan, leftWX: gWX, right: '地分', rightGZ: ke.difen, rightWX: fWX });
    if (KE[sWX] === gWX) wuDong.push({ name: '官动', cond: '神克干', left: '贵神', leftGZ: ke.gui.ganzhi, leftWX: sWX, right: '人元', rightGZ: ke.renyuan, rightWX: gWX });
    if (KE[sWX] === jWX) wuDong.push({ name: '贼动', cond: '神克将', left: '贵神', leftGZ: ke.gui.ganzhi, leftWX: sWX, right: '将神', rightGZ: ke.jiang.ganzhi, rightWX: jWX });
    if (KE[jWX] === sWX) wuDong.push({ name: '财动', cond: '将克神', left: '将神', leftGZ: ke.jiang.ganzhi, leftWX: jWX, right: '贵神', rightGZ: ke.gui.ganzhi, rightWX: sWX });
    if (KE[fWX] === gWX) wuDong.push({ name: '鬼动', cond: '方克干', left: '地分', leftGZ: ke.difen, leftWX: fWX, right: '人元', rightGZ: ke.renyuan, rightWX: gWX });

    // 三动（课内相生/比和）
    var sanDong = [];
    if (SHENG[fWX] === gWX) sanDong.push({ name: '父母动', cond: '方生干', left: '地分', leftGZ: ke.difen, leftWX: fWX, right: '人元', rightGZ: ke.renyuan, rightWX: gWX });
    if (SHENG[gWX] === fWX) sanDong.push({ name: '子孙动', cond: '干生方', left: '人元', leftGZ: ke.renyuan, leftWX: gWX, right: '地分', rightGZ: ke.difen, rightWX: fWX });
    if (gWX === fWX) sanDong.push({ name: '兄弟动', cond: '干方比', left: '人元', leftGZ: ke.renyuan, leftWX: gWX, right: '地分', rightGZ: ke.difen, rightWX: fWX });

    return { wuDong: wuDong, sanDong: sanDong };
  }

  // ============ 渲染 ============
  function renderAll() {
    ke = calcKe(_state.solar, _state.difen, _state.jiang || null);
    calcShenSha();
    var sd = calcSanDong();
    var suse = $('#suse').prop('checked') ? 1 : 0;
    var solar = _state.solar;
    var lunar = solar.getLunar();
    var b = ke.bazi;
    var dayGZ = b.dayGan + b.dayZhi;
    var kongWang = U.xunKong(dayGZ);
    var wsCls = { 旺: 'wang', 相: 'xiang', 休: 'xiu', 囚: 'qiu', 死: 'si' };

    var h = '';

    // 出生信息
    h += '<div class="bazi-section">';
    h += '<div class="bazi-pillars">';
    var pGans = [b.yearGan, b.monthGan, b.dayGan, b.timeGan];
    var pZhis = [b.yearZhi, b.monthZhi, b.dayZhi, b.timeZhi];
    var ganToShiShen = {
      '甲甲': '比肩', '甲乙': '劫财', '甲丙': '食神', '甲丁': '伤官', '甲戊': '偏财', '甲己': '正财', '甲庚': '七杀', '甲辛': '正官', '甲壬': '偏印', '甲癸': '正印',
      '乙甲': '劫财', '乙乙': '比肩', '乙丙': '伤官', '乙丁': '食神', '乙戊': '正财', '乙己': '偏财', '乙庚': '正官', '乙辛': '七杀', '乙壬': '正印', '乙癸': '偏印',
      '丙甲': '偏印', '丙乙': '正印', '丙丙': '比肩', '丙丁': '劫财', '丙戊': '食神', '丙己': '伤官', '丙庚': '偏财', '丙辛': '正财', '丙壬': '七杀', '丙癸': '正官',
      '丁甲': '正印', '丁乙': '偏印', '丁丙': '劫财', '丁丁': '比肩', '丁戊': '伤官', '丁己': '食神', '丁庚': '正财', '丁辛': '偏财', '丁壬': '正官', '丁癸': '七杀',
      '戊甲': '七杀', '戊乙': '正官', '戊丙': '偏印', '戊丁': '正印', '戊戊': '比肩', '戊己': '劫财', '戊庚': '食神', '戊辛': '伤官', '戊壬': '偏财', '戊癸': '正财',
      '己甲': '正官', '己乙': '七杀', '己丙': '正印', '己丁': '偏印', '己戊': '劫财', '己己': '比肩', '己庚': '伤官', '己辛': '食神', '己壬': '正财', '己癸': '偏财',
      '庚甲': '偏财', '庚乙': '正财', '庚丙': '七杀', '庚丁': '正官', '庚戊': '偏印', '庚己': '正印', '庚庚': '比肩', '庚辛': '劫财', '庚壬': '食神', '庚癸': '伤官',
      '辛甲': '正财', '辛乙': '偏财', '辛丙': '正官', '辛丁': '七杀', '辛戊': '正印', '辛己': '偏印', '辛庚': '劫财', '辛辛': '比肩', '辛壬': '伤官', '辛癸': '食神',
      '壬甲': '食神', '壬乙': '伤官', '壬丙': '偏财', '壬丁': '正财', '壬戊': '七杀', '壬己': '正官', '壬庚': '偏印', '壬辛': '正印', '壬壬': '比肩', '壬癸': '劫财',
      '癸甲': '伤官', '癸乙': '食神', '癸丙': '正财', '癸丁': '偏财', '癸戊': '正官', '癸己': '七杀', '癸庚': '正印', '癸辛': '偏印', '癸壬': '劫财', '癸癸': '比肩'
    };
    for (var i = 0; i < 4; i++) {
      var ganShort = ganToShiShen[b.dayGan + pGans[i]] || '';
      var zhiW = U.wuXingMap(pZhis[i]);
      var pillarNames = ['年', '月', '日', '时'];
      var infoTypes = ['nian', 'yue', 'ri', 'shi'];
      h += '<div class="bazi-pillar">';
      h += '<div class="bazi-pillar-label">' + pillarNames[i] + '柱</div>';
      h += '<div class="bazi-pillar-gan" data-pillar="' + infoTypes[i] + '" data-type="gan" title="点击切换上一年/月/日/时辰">' + U.wuXingColor(pGans[i], 'span') + '</div>';
      h += '<div class="bazi-pillar-zhi" data-pillar="' + infoTypes[i] + '" data-type="zhi" title="点击切换下一年/月/日/时辰">' + U.wuXingColor(pZhis[i], 'span') + '</div>';
      h += '<div class="bazi-pillar-attr"><span>' + (pGans[i] === '甲' || pGans[i] === '丙' || pGans[i] === '戊' || pGans[i] === '庚' || pGans[i] === '壬' ? '阳' : '阴') + '</span> <span class="lbl">' + ganShort + '</span></div>';
      h += '<div class="bazi-pillar-attr"><span class="lbl">' + pZhis[i] + '</span>' + (zhiW || '') + ' <span class="lbl">' + (ganToShiShen[b.dayGan + '甲乙丙丁戊己庚辛壬癸'.charAt(ZHI.indexOf(pZhis[i]) % 10)] || '') + '</span></div>';
      h += '</div>';
    }
    h += '</div>';
    // 胎元命宫身宫
    var taiGan = GAN[(GAN.indexOf(b.monthGan) + 1) % 10];
    var taiZhi = ZHI[(ZHI.indexOf(b.monthZhi) + 3) % 12];
    var M = ({ 寅: 1, 卯: 2, 辰: 3, 巳: 4, 午: 5, 未: 6, 申: 7, 酉: 8, 戌: 9, 亥: 10, 子: 11, 丑: 12 })[b.monthZhi];
    var H = ZHI.indexOf(b.timeZhi);
    var mingGong = ZHI[(1 + M - H + 12) % 12];
    var shenGong = ZHI[(1 + M + H) % 12];
    h += '<div class="bazi-info"><span class="key">胎元</span>' + taiGan + taiZhi + ' <span class="key">命宫</span>' + mingGong + ' <span class="key">身宫</span>' + shenGong + ' <span class="key">空亡</span>' + kongWang + ' <span class="key">四大空亡</span>' + ke.sidakongwang + '</div>';
    h += '<div class="bazi-info"><span class="key">占时</span>' + U.wuXingColor(b.timeZhi, 'span') + ' <span class="key">月将</span>' + U.wuXingColor(ke.yuejiang, 'span') + (ke.yuejiangAuto ? '<span style="color:#999;font-size:1rem;">(中气)</span>' : '<span style="color:#6b98c0;font-size:1rem;">(自定义)</span>') + ' <span class="key">' + (ke.isDay ? '昼贵' : '夜贵') + '</span>' + U.wuXingColor(ke.guiRen, 'span') + (ke.isShun ? '顺' : '逆') + '</div>';
    h += '</div>';

    // 十二宫 + 中间四课（4x4 grid，中间合并区域 4 行竖排）
    h += '<div class="jkj-section">';
    h += '<div class="jkj-title">金口诀盘</div>';
    h += '<div class="jkj-pan">';
    var layout = [
      ['巳', '午', '未', '申'],
      ['辰', null, null, '酉'],
      ['卯', null, null, '戌'],
      ['寅', '丑', '子', '亥']
    ];
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 4; c++) {
        var z = layout[r][c];
        if (!z) {
          if (r === 1 && c === 1) {
            h += '<div class="jkj-ke-wrap">';
            h += renderKeRow('人元', ke.renyuan, '', ke.renyuanWX + ke.renyuanYY, ke.wangShuai[ke.renyuan], wsCls, ke.yongShen === '人元');
            h += renderKeRow('贵神', ke.gui.ganzhi, ke.gui.shen, ke.gui.wx + ke.gui.yy, ke.wangShuai[ke.gui.zhi], wsCls, ke.yongShen === '贵神');
            h += renderKeRow('将神', ke.jiang.ganzhi, ke.jiang.name, ke.jiang.wx + ke.jiang.yy, ke.wangShuai[ke.jiang.zhi], wsCls, ke.yongShen === '将神');
            h += renderKeRow('地分', ke.difen, ke.difenDir, ke.difenWX + ke.difenYY, ke.wangShuai[ke.difen], wsCls, ke.yongShen === '地分');
            h += '</div>';
          }
          continue;
        }
        var act = z === ke.difen ? ' active' : '';
        var zidx = ZHI.indexOf(z);
        h += '<div class="jkj-cell' + act + '" data-zhi="' + z + '">';
        h += '<div class="zr">' + U.wuXingColor(z, 'span') + '</div>';
        h += '<div class="xi">' + DIRECTION[z] + '</div>';
        h += '<div class="attr">天盘' + U.wuXingColor(ke.tianPan[zidx], 'span') + '</div>';
        h += '<div class="attr">神盘' + U.wuXingColor(ke.shenPan[zidx], 'span') + '</div>';
        h += '</div>';
      }
    }
    h += '</div>';
    h += '<div style="font-size:1.1rem; color:#999; padding:4px 6px 0;">点击外框十二宫切换地分</div>';
    h += '</div>';

    // 起课说明（紧凑一行）
    h += '<div class="jkj-desc">';
    h += '<span class="k">人元</span>' + U.wuXingColor(ke.renyuan, 'span') + '　<span class="k">贵神</span>' + U.wuXingColor(ke.gui.ganzhi, 'span') + ke.gui.shen + '　<span class="k">将神</span>' + U.wuXingColor(ke.jiang.ganzhi, 'span') + ke.jiang.name + '　<span class="k">地分</span>' + U.wuXingColor(ke.difen, 'span') + ke.difenDir;
    h += '</div>';

    // 神煞
    h += '<div class="ss-section">';
    h += '<div class="ss-title">常用神煞（' + P_COMMON.length + '）</div>';
    h += renderShenShaList(P_COMMON, 8);
    h += '<div class="ss-title" style="margin-top:8px;">不常见神煞（' + P_RARE.length + '）</div>';
    h += renderShenShaList(P_RARE, 0);    h += '</div>';

    // 三动五动（课内四位生克）
    h += '<div class="sd-section">';
    // 五动
    h += '<div class="sd-row"><span class="name">五动</span>（课内相克）';
    if (sd.wuDong.length) {
      h += sd.wuDong.map(function (d) { return '<span class="name">' + d.name + '</span>'; }).join(' ');
    } else {
      h += '<span class="desc">课内无相克</span>';
    }
    h += '</div>';
    for (var wd = 0; wd < sd.wuDong.length; wd++) {
      var it = sd.wuDong[wd];
      h += '<div class="sd-row">　' + U.wuXingColor(it.leftGZ, 'span') + '（' + it.left + it.leftWX + '）' + it.cond + U.wuXingColor(it.rightGZ, 'span') + '（' + it.right + it.rightWX + '）→ <span class="name">' + it.name + '</span>';
      h += '<div class="sd-row desc">　' + (WUDONG_GJ[it.name] || '') + '</div>';
    }
    // 三动
    h += '<div class="sd-row" style="margin-top:4px;"><span class="name">三动</span>（人元·地分生比）';
    if (sd.sanDong.length) {
      h += sd.sanDong.map(function (d) { return '<span class="name">' + d.name + '</span>'; }).join(' ');
    } else {
      h += '<span class="desc">无生比</span>';
    }
    h += '</div>';
    for (var sd2 = 0; sd2 < sd.sanDong.length; sd2++) {
      var it2 = sd.sanDong[sd2];
      h += '<div class="sd-row">　' + U.wuXingColor(it2.leftGZ, 'span') + '（' + it2.left + it2.leftWX + '）' + it2.cond + U.wuXingColor(it2.rightGZ, 'span') + '（' + it2.right + it2.rightWX + '）→ <span class="name">' + it2.name + '</span>';
      h += '<div class="sd-row desc">　' + (SANDONG_GJ[it2.name] || '') + '</div>';
    }
    h += '</div>';

    $('#content').html(h);
    bindAll();
  }

  function renderKeRow(name, gz, gn, wxYY, ws, wsCls, isYong) {
    var h = '<div class="jkj-ke">';
    h += '<span class="name">' + name + (isYong ? '（用）' : '') + '</span>';
    h += '<span class="gz">' + U.wuXingColor(gz, 'span') + '</span>';
    if (gn) h += '<span class="gn">' + gn + '</span>';
    h += '<span class="wxyy">' + (wxYY || '') + '</span>';
    h += '<span class="ws ' + (wsCls[ws] || '') + '">' + (ws || '') + '</span>';
    h += '</div>';
    return h;
  }

  // 神煞渲染：maxShow 限制条数，其余折叠（点击展开）
  function renderShenShaList(list, maxShow) {
    if (!list.length) return '';
    var h = '';
    var groups = { 吉: [], 凶: [], 杂: [] };
    for (var i = 0; i < list.length; i++) (groups[list[i].tag] = groups[list[i].tag] || []).push(list[i]);
    var order = ['吉', '凶', '杂'];
    var total = 0;
    for (var g = 0; g < order.length; g++) total += (groups[order[g]] || []).length;
    // maxShow: null/undefined=全部显示; 0=全部折叠; N>0=显示N条
    var shown = 0;
    for (var g = 0; g < order.length; g++) {
      var grp = groups[order[g]];
      if (!grp || !grp.length) continue;
      for (var j = 0; j < grp.length; j++) {
        var hidden = (typeof maxShow === 'number') && shown >= maxShow;
        var it = grp[j];
        h += '<div class="ss-row' + (hidden ? ' ss-more' : '') + '"' + (hidden ? ' style="display:none;"' : '') + '>';
        h += '<span class="name">' + it.name + '</span>';
        var hits = it.hit ? ' <span class="tag">' + it.hit + '</span>' : '';
        h += '<span class="desc">' + it.val + hits + '</span>';
        h += '</div>';
        shown++;
      }
    }
    // 折叠按钮（仅当有隐藏项时）
    if (typeof maxShow === 'number' && total > maxShow) {
      var hideCnt = total - Math.min(maxShow, total);
      h += '<div class="ss-more-btn" data-state="closed" data-cnt="' + hideCnt + '" style="cursor:pointer;color:#b98c51;font-size:1.15rem;padding:4px 0;text-align:center;">展开全部神煞（' + hideCnt + '）▾</div>';
    }
    return h;
  }

  function bindAll() {
    $('#content').off('click.cell', '.jkj-cell').on('click.cell', '.jkj-cell', function () {
      var z = $(this).attr('data-zhi');
      if (!z || z === _state.difen) return;
      _state.difen = z;
      renderAll();
    });

    // 神煞展开/折叠按钮
    $('#content').off('click.ssmore', '.ss-more-btn').on('click.ssmore', '.ss-more-btn', function () {
      var $btn = $(this);
      var $wrap = $btn.closest('.ss-section');
      var isOpen = $btn.attr('data-state') === 'open';
      var cnt = $btn.attr('data-cnt') || '';
      $wrap.find('.ss-row.ss-more').css('display', isOpen ? 'none' : '');
      $btn.attr('data-state', isOpen ? 'closed' : 'open');
      $btn.text(isOpen ? ('展开全部神煞（' + cnt + '）▾') : '收起神煞▴');
    });

    // 八字柱点击增减（干/支 → 上下一年/月/日/时辰）
    $('#content').off('click.pillar', '.bazi-pillar-gan, .bazi-pillar-zhi').on('click.pillar', '.bazi-pillar-gan, .bazi-pillar-zhi', function () {
      if (!_state) return;
      var s = _state.solar;
      var pillar = $(this).attr('data-pillar');
      var type = $(this).attr('data-type');
      var delta = type === 'gan' ? -1 : 1;
      var y = s.getYear(), m = s.getMonth(), d = s.getDay(), h = s.getHour(), mi = s.getMinute();
      var newV = null;
      if (pillar === 'nian') {
        newV = (y + delta) + U.pad(m) + U.pad(d) + U.pad(h) + U.pad(mi);
      } else if (pillar === 'yue') {
        var mm = m + delta;
        var yy = y;
        if (mm < 1) { mm = 12; yy -= 1; }
        if (mm > 12) { mm = 1; yy += 1; }
        newV = yy + U.pad(mm) + U.pad(d) + U.pad(h) + U.pad(mi);
      } else if (pillar === 'ri') {
        // 用 Julian 日增减确保跨月/跨年正确
        var jul = s.getJulianDay() + delta;
        var ns = Solar.fromJulianDay(jul);
        newV = ns.getYear() + U.pad(ns.getMonth()) + U.pad(ns.getDay()) + U.pad(ns.getHour()) + U.pad(ns.getMinute());
      } else if (pillar === 'shi') {
        var nh = h + delta * 2; // 一个时辰=2小时
        if (nh < 0) nh += 24;
        if (nh >= 24) nh -= 24;
        newV = y + U.pad(m) + U.pad(d) + U.pad(nh) + U.pad(mi);
      }
      if (!newV) return;
      var suffix = $('#gender_man').prop('checked') ? '+' : '-';
      $('#input').val(newV + suffix);
      sync(newV + suffix);
      updateBirthTitle();
    });
  }

  function updateBirthTitle() {
    if (!_state) return;
    var s = _state.solar;
    var lunar = s.getLunar();
    $('#birth-title').text(s.getYear() + '年' + s.getMonth() + '月' + s.getDay() + '日(' + lunar.getMonthInChinese() + '月' + lunar.getDayInChinese() + ')' + U.pad(s.getHour()) + ':' + U.pad(s.getMinute()));
  }

  // ============ 对外同步 ============
  function sync(vStr) {
    var solar = parseInput(vStr);
    if (!solar) return;
    if (!_state || !_state.difen) {
      var lunar = solar.getLunar();
      var bazi = lunar.getEightChar();
      bazi.setSect(1);
      var df = bazi.getTimeZhi() || '子';
      // 罗盘联动：URL 参数 difen 优先（罗盘页跳转），其次 localStorage（备用）
      var fromUrl = false;
      try {
        var p = new URLSearchParams(location.search);
        var dp = p.get('difen');
        if (dp && '子丑寅卯辰巳午未申酉戌亥'.indexOf(dp) >= 0) { df = dp; fromUrl = true; }
      } catch (e) {}
      if (!fromUrl) {
        try {
          var cd = localStorage.getItem('compass_difen');
          if (cd && '子丑寅卯辰巳午未申酉戌亥'.indexOf(cd) >= 0) {
            df = cd;
            localStorage.removeItem('compass_difen'); // 用一次即清除
          }
        } catch (e) {}
      }
      // 自定义月将：URL 参数 jiang 或 UI 下拉（'auto' 为自动按中气）
      var jiang = null;
      try {
        var pj = new URLSearchParams(location.search);
        var dj = pj.get('jiang');
        if (dj === 'auto' || !dj) { jiang = null; }
        else if ('子丑寅卯辰巳午未申酉戌亥'.indexOf(dj) >= 0) { jiang = dj; }
      } catch (e) {}
      if (!jiang && $('#jiang-sel').length && $('#jiang-sel').val() !== 'auto') {
        var vj = $('#jiang-sel').val();
        if ('子丑寅卯辰巳午未申酉戌亥'.indexOf(vj) >= 0) jiang = vj;
      }
      _state = { solar: solar, difen: df, jiang: jiang };
    } else {
      _state.solar = solar;
    }
    // 同步月将下拉显示
    if ($('#jiang-sel').length) {
      $('#jiang-sel').val(_state.jiang ? _state.jiang : 'auto');
    }
    renderAll();
  }

  function reroll() {
    if (!_state) return;
    var zhis = ZHI.split('');
    _state.difen = zhis[Math.floor(Math.random() * 12)];
    renderAll();
  }

  // 初始化
  $(function () {
    var params = new URLSearchParams(location.search);
    var v = params.get('v') || '';
    if (!v) {
      var now = Solar.fromDate(new Date());
      v = now.toYmdHms().replace(/[- :]/gim, '').substr(0, 12);
    }
    var gParam = params.get('gender');
    if (gParam === '0') $('#gender_woman').prop('checked', true);
    var suffix = $('#gender_man').prop('checked') ? '+' : '-';
    $('#input').val(String(v).replace(/[^\d]/g, '') + suffix);
    sync(v + suffix);

    var s = _state.solar;
    var lunar = s.getLunar();
    $('#birth-title').text(s.getYear() + '年' + s.getMonth() + '月' + s.getDay() + '日(' + lunar.getMonthInChinese() + '月' + lunar.getDayInChinese() + ')' + U.pad(s.getHour()) + ':' + U.pad(s.getMinute()));

    $('#input').on('input.jkj', function () { sync($(this).val()); });
    $('input[name=gender], #sect, #suse').on('change.jkj', function () { sync($('#input').val()); });
    // 月将切换（auto=按中气自动，或 12 将自定义）
    $('#jiang-sel').on('change.jkj', function () {
      var v = $(this).val();
      if (v === 'auto') { _state.jiang = null; }
      else if ('子丑寅卯辰巳午未申酉戌亥'.indexOf(v) >= 0) { _state.jiang = v; }
      renderAll();
    });
    $('#now-btn').on('click', function () {
      var now = Solar.fromDate(new Date());
      var v2 = now.toYmdHms().replace(/[- :]/gim, '').substr(0, 12);
      var g = $('#gender_man').prop('checked') ? '+' : '-';
      $('#input').val(v2 + g);
      sync(v2 + g);
    });
    $('#menu-btn').on('click', function () {
      $('#control-panel').toggle();
    });
    $('#reroll-btn').on('click', reroll);
  });

  window.Jinkoujue = { sync: sync, calcKe: calcKe, calcSanDong: calcSanDong, calcWangShuai: calcWangShuai };
})();
