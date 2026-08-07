// ============ 紫微斗数排盘（含流年/小限/星曜亮度/四化切换/宫干四化/星曜释义/流派） ============
(function () {
  var Solar = window.Solar;
  var LunarUtil = window.LunarUtil;
  var U = window.Utils;

  var GAN = '甲乙丙丁戊己庚辛壬癸';
  var ZHI = '子丑寅卯辰巳午未申酉戌亥';

  var PALACE = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'];
  var STAR14 = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];
  var STAR_FU = ['左辅', '右弼', '文昌', '文曲', '天魁', '天钺', '禄存', '擎羊', '陀罗', '火星', '铃星', '地空', '地劫', '天马'];
  var JU_MAP = { 水: 2, 木: 3, 金: 4, 土: 5, 火: 6 };

  // 四化表（年干，通用：生年/大限/流年均按天干查）
  var HUA = {
    甲: [['廉贞', '禄'], ['破军', '权'], ['武曲', '科'], ['太阳', '忌']],
    乙: [['天机', '禄'], ['天梁', '权'], ['紫微', '科'], ['太阴', '忌']],
    丙: [['天同', '禄'], ['天机', '权'], ['文昌', '科'], ['廉贞', '忌']],
    丁: [['太阴', '禄'], ['天同', '权'], ['天机', '科'], ['巨门', '忌']],
    戊: [['贪狼', '禄'], ['太阴', '权'], ['右弼', '科'], ['天机', '忌']],
    己: [['武曲', '禄'], ['贪狼', '权'], ['天梁', '科'], ['文曲', '忌']],
    庚: [['太阳', '禄'], ['武曲', '权'], ['太阴', '科'], ['天同', '忌']],
    辛: [['巨门', '禄'], ['太阳', '权'], ['文曲', '科'], ['文昌', '忌']],
    壬: [['天梁', '禄'], ['紫微', '权'], ['左辅', '科'], ['武曲', '忌']],
    癸: [['破军', '禄'], ['巨门', '权'], ['太阴', '科'], ['贪狼', '忌']]
  };
  var WU_HU = { 甲: '丙', 己: '丙', 乙: '戊', 庚: '戊', 丙: '庚', 辛: '庚', 丁: '壬', 壬: '壬', 戊: '甲', 癸: '甲' };
  var NAYIN_WX = { 金: '金', 木: '木', 水: '水', 火: '火', 土: '土' };
  function wuXingOfNaYin(ny) { var last = ny ? ny.substr(-1) : ''; return NAYIN_WX[last] || ''; }

  var STAR_WX = {
    紫微: '土', 天机: '木', 太阳: '火', 武曲: '金', 天同: '水', 廉贞: '火',
    天府: '土', 太阴: '水', 贪狼: '木', 巨门: '水', 天相: '水', 天梁: '土', 七杀: '金', 破军: '水',
    左辅: '土', 右弼: '水', 文昌: '金', 文曲: '水', 天魁: '火', 天钺: '火',
    禄存: '土', 擎羊: '火', 陀罗: '金', 火星: '火', 铃星: '火', 地空: '火', 地劫: '火', 天马: '火'
  };
  var WX_CLS = { 金: 'c-gold', 木: 'c-wood', 水: 'c-water', 火: 'c-fire', 土: 'c-earth' };
  function starColor(name) { return '<span class="' + (WX_CLS[STAR_WX[name]] || '') + '">' + name + '</span>'; }

  // 星曜亮度（庙旺平陷）：BRIGHT[星名] = [子,丑,寅,卯,辰,巳,午,未,申,酉,戌,亥] 的庙旺平陷
  var BRIGHT = {
    紫微: ['庙','庙','旺','旺','旺','旺','庙','庙','平','平','平','平'],
    天机: ['庙','陷','庙','庙','平','平','庙','陷','庙','庙','平','平'],
    太阳: ['陷','陷','旺','庙','庙','庙','庙','平','平','平','陷','陷'],
    武曲: ['平','庙','庙','庙','庙','庙','平','庙','庙','庙','庙','庙'],
    天同: ['旺','平','旺','平','陷','平','旺','陷','旺','平','陷','平'],
    廉贞: ['平','庙','庙','平','庙','庙','平','庙','庙','平','庙','庙'],
    天府: ['庙','庙','庙','庙','庙','庙','庙','庙','庙','庙','庙','庙'],
    太阴: ['庙','庙','旺','平','陷','陷','陷','陷','平','旺','庙','庙'],
    贪狼: ['旺','庙','平','旺','陷','平','旺','庙','平','旺','陷','平'],
    巨门: ['陷','陷','旺','庙','陷','陷','陷','陷','旺','庙','陷','陷'],
    天相: ['陷','庙','庙','陷','庙','庙','陷','庙','庙','陷','庙','庙'],
    天梁: ['庙','庙','庙','庙','庙','庙','庙','庙','庙','庙','庙','庙'],
    七杀: ['旺','庙','庙','旺','庙','庙','旺','庙','庙','旺','庙','庙'],
    破军: ['旺','庙','庙','旺','庙','庙','旺','庙','庙','旺','庙','庙']
  };
  var BRIGHT_CLR = { '庙': '#b8860b', '旺': '#228b22', '平': '#888', '陷': '#d41313' };

  // 星曜释义（点击弹窗）
  var STAR_DESC = {
    紫微: '帝星，至尊高贵，主官禄、权威。北帝之主，众星枢纽。',
    天机: '智多星，机智善谋，主兄弟。变动之星，宜参谋。',
    太阳: '主贵，热情博爱，主父、丈夫。男主自身，女主丈夫。',
    武曲: '财星，刚直果断，主财。将星，利于武职财经。',
    天同: '福星，乐观温和，主福。情绪之星，偏文职享受。',
    廉贞: '次桃花/囚星，主官禄、是非。感情与政治之星。',
    天府: '库星，稳重保守，主财帛田宅。南帝之主，善蓄财。',
    太阴: '母星，柔顺细腻，主母、妻。女主自身，男主妻。',
    贪狼: '桃花欲望之星，主欲望、才艺。应酬交际。',
    巨门: '暗星，口舌是非，主口。宜口才、研究。',
    天相: '印星，辅佐稳重，主衣食。宰相之才。',
    天梁: '荫星，寿星，主荫庇。逢凶化吉， elder.',
    七杀: '将星，肃杀刚毅，主权力。冲锋陷阵。',
    破军: '耗星，变革破坏，主夫妻、子女。开创变革。',
    左辅: '辅星，吉，主助力。贵人星。',
    右弼: '弼星，吉，主助力。贵人星。',
    文昌: '文书星，吉，主科名。学术文艺。',
    文曲: '才艺星，吉，主口才艺术。',
    天魁: '阳贵人，吉，主贵人提携（男贵）。',
    天钺: '阴贵人，吉，主贵人提携（女贵）。',
    禄存: '财禄星，吉，主进财稳定。',
    擎羊: '刑星，凶，主刑伤冲动。',
    陀罗: '忌星，凶，主拖延纠缠。',
    火星: '暴星，凶，主突发火厄。',
    铃星: '暗星，凶，主阴险火灾。',
    地空: '空亡星，凶，主精神空耗破财。',
    地劫: '劫财星，凶，主破财劫夺。',
    天马: '动星，中性，主奔波迁动。'
  };

  var POS = { 巳: [1, 1], 午: [1, 2], 未: [1, 3], 申: [1, 4], 辰: [2, 1], 酉: [2, 4], 卯: [3, 1], 戌: [3, 4], 寅: [4, 1], 丑: [4, 2], 子: [4, 3], 亥: [4, 4] };

  // ============ 核心排盘 ============
  function paiPan(solar, gender) {
    var lunar = solar.getLunar();
    var bazi = lunar.getEightChar();
    bazi.setSect(1);

    var yearGan = lunar.getYearInGanZhi().substr(0, 1);
    var yearZhi = lunar.getYearInGanZhi().substr(1, 1);
    var month = lunar.getMonth();
    var day = lunar.getDay();
    var hourZhi = bazi.getTimeZhi();
    var H = ZHI.indexOf(hourZhi);
    var M = month;
    if (lunar.getDay() < 1) day = 1;

    var mingGong = (1 + M - H + 12) % 12;
    var shenGong = (1 + M + H + 12) % 12;
    var mingGongZhi = ZHI[mingGong];
    var startGan = WU_HU[yearGan] || '丙';
    var mingGongGan = GAN[(GAN.indexOf(startGan) + (mingGong - 2 + 12) % 12) % 10];
    var mingGongGZ = mingGongGan + mingGongZhi;
    var naYin = LunarUtil.NAYIN[mingGongGZ] || '';
    var ju = JU_MAP[wuXingOfNaYin(naYin)] || 5;
    var juName = ({ 2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局' })[ju];

    var ziwei = (2 + Math.floor((day - 1) / ju)) % 12;
    var tianfu = (4 - ziwei + 12) % 12;

    var stars = {};
    var ziweiSeq = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞'];
    for (var i = 0; i < ziweiSeq.length; i++) stars[ziweiSeq[i]] = (ziwei - i + 12) % 12;
    var tianfuSeq = ['天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];
    for (var j = 0; j < tianfuSeq.length; j++) stars[tianfuSeq[j]] = (tianfu + j) % 12;

    stars['左辅'] = (4 + M - 1) % 12;
    stars['右弼'] = (10 - (M - 1) + 12) % 12;
    stars['文昌'] = (10 - H + 12) % 12;
    stars['文曲'] = (4 + H) % 12;
    var tianYi = window.ShenShaData ? window.ShenShaData.tianYi[yearGan] : ['丑', '未'];
    stars['天魁'] = ZHI.indexOf(tianYi[0]);
    stars['天钺'] = ZHI.indexOf(tianYi[1]);
    var luShen = window.ShenShaData ? window.ShenShaData.luShen[yearGan] : '寅';
    var luIdx = ZHI.indexOf(luShen);
    stars['禄存'] = luIdx;
    stars['擎羊'] = (luIdx + 1) % 12;
    stars['陀罗'] = (luIdx - 1 + 12) % 12;
    var huoStart, lingStart;
    if ('子午卯酉'.indexOf(yearZhi) >= 0) { huoStart = 2; lingStart = 10; }
    else if ('寅申巳亥'.indexOf(yearZhi) >= 0) { huoStart = 1; lingStart = 3; }
    else { huoStart = 8; lingStart = 5; }
    stars['火星'] = (huoStart + H) % 12;
    stars['铃星'] = (lingStart + H) % 12;
    stars['地空'] = (11 + H) % 12;
    stars['地劫'] = (11 - H + 12) % 12;
    var sanHe = window.ShenShaData ? window.ShenShaData.sanHe[yearZhi] : '';
    var yiMa = window.ShenShaData ? window.ShenShaData.yiMa[sanHe] : null;
    var tianMa = '寅';
    if (yiMa) { for (var tm in yiMa) { if (yiMa[tm] === '驿马') { tianMa = tm; break; } } }
    stars['天马'] = ZHI.indexOf(tianMa);

    // 生年四化
    var huaList = HUA[yearGan] || [];
    var hua = {};
    for (var k = 0; k < huaList.length; k++) hua[huaList[k][1]] = { star: huaList[k][0], idx: stars[huaList[k][0]] };

    // 十二宫 + 大限 + 宫干
    var isYang = '甲丙戊庚壬'.indexOf(yearGan) >= 0;
    var shun = (isYang && gender === 1) || (!isYang && gender === 0);
    var palaces = [];
    var daXianStart = ju;
    var yinGan = GAN.indexOf(WU_HU[yearGan] || '丙'); // 寅宫天干序号
    for (var p = 0; p < 12; p++) {
      var zhiIdx = (mingGong - p + 12) % 12;
      var starNames = [];
      for (var s in stars) { if (stars[s] === zhiIdx && STAR14.indexOf(s) >= 0) starNames.push(s); }
      for (var s2 in stars) { if (stars[s2] === zhiIdx && STAR_FU.indexOf(s2) >= 0) starNames.push(s2); }
      var huaIn = [];
      for (var hk in hua) { if (hua[hk].idx === zhiIdx) huaIn.push({ hua: hk, star: hua[hk].star }); }
      // 宫干：从寅宫干顺排到该宫支
      var gongZhiIdx = zhiIdx;
      var gongGanIdx = (yinGan + (gongZhiIdx - 2 + 12) % 12) % 10;
      var from = daXianStart + p * 10, to = from + 9;
      palaces.push({
        zhi: ZHI[zhiIdx], zhiIdx: zhiIdx, name: PALACE[p],
        stars: starNames, hua: huaIn,
        gongGan: GAN[gongGanIdx],
        isMing: zhiIdx === mingGong, isShen: zhiIdx === shenGong,
        daXian: from + '-' + to + '岁'
      });
    }

    return {
      info: {
        solar: solar, lunar: lunar, bazi: bazi, gender: gender,
        yearGan: yearGan, yearZhi: yearZhi, birthYear: solar.getYear(),
        month: M, day: day, hourZhi: hourZhi,
        mingGong: mingGongZhi, shenGong: ZHI[shenGong],
        mingGongGZ: mingGongGZ, naYin: naYin, ju: ju, juName: juName,
        ziwei: ZHI[ziwei], tianfu: ZHI[tianfu], shun: shun,
        stars: stars, isYang: isYang
      },
      hua: hua, palaces: palaces, HUA: HUA, BRIGHT: BRIGHT
    };
  }

  // 计算流年信息（render 时调用）
  function calcLiuNian(pan, liuYear) {
    var info = pan.info;
    var birthYear = info.birthYear;
    var age = liuYear - birthYear + 1; // 虚岁
    // 流年干支
    var ls = Solar.fromYmdHms(liuYear, 6, 1, 12, 0, 0);
    var ll = ls.getLunar();
    var lnGan = ll.getYearInGanZhiExact().substr(0, 1);
    var lnZhi = ll.getYearInGanZhiExact().substr(1, 1);
    var lnGongIdx = ZHI.indexOf(lnZhi); // 流年命宫=流年地支宫
    // 流年四化
    var huaList = HUA[lnGan] || [];
    var lnHua = {};
    for (var k = 0; k < huaList.length; k++) lnHua[huaList[k][1]] = { star: huaList[k][0], idx: pan.info.stars[huaList[k][0]] };
    // 流年禄存/擎羊/陀罗
    var luShen = window.ShenShaData ? window.ShenShaData.luShen[lnGan] : '寅';
    var luIdx = ZHI.indexOf(luShen);
    var lnStars = { '流禄': luIdx, '流羊': (luIdx + 1) % 12, '流陀': (luIdx - 1 + 12) % 12 };
    // 小限宫：从生年支起，男顺女逆数虚岁
    var birthZhiIdx = ZHI.indexOf(info.yearZhi);
    var xiaoXianIdx = info.gender === 1 ? (birthZhiIdx + age - 1) % 12 : (birthZhiIdx - (age - 1) + 120) % 12;
    return { year: liuYear, age: age, gan: lnGan, zhi: lnZhi, gongIdx: lnGongIdx, hua: lnHua, stars: lnStars, xiaoXianIdx: xiaoXianIdx };
  }

  // 宫干四化（某宫天干引发的四化落宫）
  function gongGanHua(gongGan, pan) {
    var huaList = HUA[gongGan] || [];
    var out = [];
    for (var k = 0; k < huaList.length; k++) {
      var star = huaList[k][0];
      out.push({ star: star, hua: huaList[k][1], idx: pan.info.stars[star] });
    }
    return out;
  }

  // ============ 渲染 ============
  function render(pan) {
    var info = pan.info;
    var h = '';
    var liuYear = parseInt(document.getElementById('zw-liunian').value, 10) || info.solar.getYear();
    var mode = document.getElementById('zw-mode') ? document.getElementById('zw-mode').value : 'ben';
    var huaType = document.getElementById('zw-huatype') ? document.getElementById('zw-huatype').value : 'year';
    var school = document.getElementById('zw-school') ? document.getElementById('zw-school').value : 'sanhe';
    var ln = calcLiuNian(pan, liuYear);
    var mingIdx = ZHI.indexOf(info.mingGong);
    // 当前大限索引（默认=虚岁所在大限）
    var daxianIdx = parseInt(document.getElementById('zw-daxian') ? document.getElementById('zw-daxian').value : '-1', 10);
    if (isNaN(daxianIdx) || daxianIdx < 0) {
      daxianIdx = 0;
      for (var dxi = 0; dxi < 12; dxi++) {
        var f0 = info.ju + dxi * 10, t0 = f0 + 9;
        if (ln.age >= f0 && ln.age <= t0) { daxianIdx = dxi; break; }
      }
      if (document.getElementById('zw-daxian')) document.getElementById('zw-daxian').value = daxianIdx;
    }
    var dxZhiIdx = info.shun ? (mingIdx + daxianIdx) % 12 : (mingIdx - daxianIdx + 12) % 12;
    // 四化来源
    var huaSrc = null, huaLabel = '';
    if (huaType === 'year') { huaSrc = pan.hua; huaLabel = info.yearGan + '生年'; }
    else if (huaType === 'liunian') { huaSrc = ln.hua; huaLabel = ln.gan + '流年'; }
    else if (huaType === 'daxian') {
      var dxPalace = null;
      for (var dpp = 0; dpp < pan.palaces.length; dpp++) { if (pan.palaces[dpp].zhiIdx === dxZhiIdx) { dxPalace = pan.palaces[dpp]; break; } }
      var dxGan = dxPalace ? dxPalace.gongGan : info.yearGan;
      var dh = HUA[dxGan] || [];
      huaSrc = {};
      for (var dhk = 0; dhk < dh.length; dhk++) huaSrc[dh[dhk][1]] = { star: dh[dhk][0], idx: info.stars[dh[dhk][0]] };
      huaLabel = dxGan + '大限（' + (dxPalace ? dxPalace.name + '宫' : '') + '）';
    }

    h += '<div class="info-box" id="birth-info">';
    h += '<p><strong>公历</strong> ' + info.solar.getYear() + '-' + U.pad(info.solar.getMonth()) + '-' + U.pad(info.solar.getDay()) + ' ' + U.pad(info.solar.getHour()) + ':' + U.pad(info.solar.getMinute()) + '　<strong>农历</strong> ' + info.lunar.getYearInChinese() + '年' + info.lunar.getMonthInChinese() + '月' + info.lunar.getDayInChinese() + '日 ' + info.hourZhi + '时</p>';
    h += '<p><strong>八字</strong> ' + info.bazi.getYear() + ' ' + info.bazi.getMonth() + ' ' + info.bazi.getDay() + ' ' + info.bazi.getTime() + '　<strong>性别</strong> ' + (info.gender === 1 ? '男' : '女') + '　<strong>大限</strong> ' + info.ju + '岁起运' + (info.shun ? '顺行' : '逆行') + '</p>';
    h += '<p><strong>命宫</strong> ' + info.mingGongGZ + '（' + info.naYin + ' ' + info.juName + '）　<strong>身宫</strong> ' + info.shenGong + '　<strong>紫微</strong>' + info.ziwei + ' <strong>天府</strong>' + info.tianfu + '</p>';
    h += '<p><strong>流年</strong> ' + ln.year + '（' + ln.gan + ln.zhi + '）　<strong>虚岁</strong> ' + ln.age + '　<strong>流年命宫</strong>' + ZHI[ln.gongIdx] + '　<strong>小限宫</strong>' + ZHI[ln.xiaoXianIdx] + '</p>';
    h += '</div>';

    // 十二宫盘面（4x4 grid）
    h += '<div class="zw-grid">';
    var byPos = {};
    for (var i = 0; i < pan.palaces.length; i++) byPos[pan.palaces[i].zhi] = pan.palaces[i];
    // 流年盘星（叠盘时显示）
    var lnPalaceStars = {};
    if (mode === 'liunian' || mode === 'die') {
      for (var sn in ln.stars) { var arr = lnPalaceStars[ln.stars[sn]] || (lnPalaceStars[ln.stars[sn]] = []); arr.push(sn); }
    }
    for (var r = 1; r <= 4; r++) {
      for (var c = 1; c <= 4; c++) {
        var cellZhi = null;
        for (var z in POS) { if (POS[z][0] === r && POS[z][1] === c) { cellZhi = z; break; } }
        if (!cellZhi) {
          // 中间 2x2 区域：仅 (2,2) 输出占 2x2 的中宫格，其余 3 格跳过（避免多余格子撑破 4x4 网格）
          if (r === 2 && c === 2) {
            const yGZ = info.bazi.getYear(), mGZ = info.bazi.getMonth(), dGZ = info.bazi.getDay(), tGZ = info.bazi.getTime();
            h += '<div class="zw-center-cell">';
            h += '<div class="zw-center-bazi">';
            h += '<div class="zw-cb-row zw-cb-head"><span>年</span><span>月</span><span>日</span><span>时</span></div>';
            h += '<div class="zw-cb-row">' + U.wuXingColor(yGZ.substr(0, 1)) + U.wuXingColor(mGZ.substr(0, 1)) + U.wuXingColor(dGZ.substr(0, 1)) + U.wuXingColor(tGZ.substr(0, 1)) + '</div>';
            h += '<div class="zw-cb-row">' + U.wuXingColor(yGZ.substr(1, 1)) + U.wuXingColor(mGZ.substr(1, 1)) + U.wuXingColor(dGZ.substr(1, 1)) + U.wuXingColor(tGZ.substr(1, 1)) + '</div>';
            h += '</div>';
            h += '<div class="zw-center-info">' + info.mingGongGZ + ' · ' + info.juName + '</div>';
            h += '<div class="zw-center-info2">身宫' + info.shenGong + '　紫微' + info.ziwei + '</div>';
            h += '</div>';
          }
          // 其余中心格 (2,3)(3,2)(3,3) 已被中宫格 span 覆盖，不输出
          continue;
        }
        var pl = byPos[cellZhi];
        var isLnGong = (pl.zhiIdx === ln.gongIdx);
        var isXiaoXian = (pl.zhiIdx === ln.xiaoXianIdx);
        h += '<div class="zw-cell' + (pl.isMing ? ' ming' : '') + (pl.isShen ? ' shen' : '') + (isLnGong ? ' lngong' : '') + '">';
        h += '<div class="zw-cell-head">' + pl.zhi + ' ' + pl.name + (pl.isMing ? '【命】' : '') + (pl.isShen ? '【身】' : '') + (isLnGong ? '【流】' : '') + (isXiaoXian ? '【限】' : '') + '</div>';
        h += '<div class="zw-daxian">' + pl.daXian + ' · 宫干' + pl.gongGan + '</div>';
        // 本命星 + 亮度
        var starHtml = '';
        for (var s = 0; s < pl.stars.length; s++) {
          var nm = pl.stars[s];
          var huaMark = '';
          if (huaSrc) { for (var hk in huaSrc) { if (huaSrc[hk].star === nm) { huaMark = '<span class="hua-mark ' + hk + '">' + hk + '</span>'; break; } } }
          var br = BRIGHT[nm] ? BRIGHT[nm][pl.zhiIdx] : '';
          var brHtml = br ? '<span class="zw-bright" style="color:' + (BRIGHT_CLR[br] || '#888') + '">' + br + '</span>' : '';
          starHtml += '<div class="zw-star zw-star-click" data-star="' + nm + '">' + starColor(nm) + huaMark + brHtml + '</div>';
        }
        // 流年星（叠盘）
        if (mode === 'die' && lnPalaceStars[pl.zhiIdx]) {
          var lns = lnPalaceStars[pl.zhiIdx];
          for (var li2 = 0; li2 < lns.length; li2++) starHtml += '<div class="zw-star zw-lnstar zw-star-click" data-star="' + lns[li2] + '">' + lns[li2] + '</div>';
        }
        h += '<div class="zw-stars">' + starHtml + '</div>';
        // 宫干四化（飞星派显示）
        if (school === 'feixing') {
          var ggh = gongGanHua(pl.gongGan, pan);
          var gghHtml = '';
          for (var gi = 0; gi < ggh.length; gi++) gghHtml += ggh[gi].star + ggh[gi].hua + ZHI[ggh[gi].idx] + ' ';
          h += '<div class="zw-gonghua">' + gghHtml + '</div>';
        }
        h += '</div>';
      }
    }
    h += '</div>';

    // 大限条（点击切换大限四化）
    h += '<div class="info-box"><div class="zw-bar-title">大限（' + (info.shun ? '顺行' : '逆行') + '）</div><div class="zw-bar">';
    for (var dxi2 = 0; dxi2 < 12; dxi2++) {
      var dz2 = info.shun ? (mingIdx + dxi2) % 12 : (mingIdx - dxi2 + 12) % 12;
      var dp2 = null;
      for (var dq = 0; dq < pan.palaces.length; dq++) { if (pan.palaces[dq].zhiIdx === dz2) { dp2 = pan.palaces[dq]; break; } }
      var f2 = info.ju + dxi2 * 10;
      var cur2 = dxi2 === daxianIdx;
      h += '<div class="zw-bar-item' + (cur2 ? ' cur' : '') + '" data-dx="' + dxi2 + '">' + (dp2 ? U.wuXingColor(dp2.gongGan + ZHI[dz2]) : '') + '<span>' + f2 + '岁起</span></div>';
    }
    h += '</div></div>';

    // 流年条（点击切换流年）
    h += '<div class="info-box"><div class="zw-bar-title">流年（点击切换）</div><div class="zw-bar">';
    for (var ly2 = liuYear - 5; ly2 <= liuYear + 5; ly2++) {
      var lso = Solar.fromYmdHms(ly2, 6, 1, 12, 0, 0);
      var lz = lso.getLunar().getYearInGanZhiExact();
      var cur3 = ly2 === liuYear;
      h += '<div class="zw-bar-item' + (cur3 ? ' cur' : '') + '" data-ln="' + ly2 + '">' + U.wuXingColor(lz) + '<span>' + ly2 + '</span></div>';
    }
    h += '</div></div>';

    // 四化说明
    var huaShow = huaSrc || pan.hua;
    h += '<div class="info-box">';
    h += '<p><strong>四化（' + huaLabel + '）：</strong>';
    var huaDesc = [];
    for (var hh in huaShow) { var hv = huaShow[hh]; huaDesc.push(hv.star + '化' + hh + '（' + ZHI[hv.idx] + '宫）'); }
    h += huaDesc.join('，') + '</p>';
    h += '<p style="color:#888;font-size:1rem;">星名后小字为庙旺平陷（<span style="color:#b8860b">庙</span>/<span style="color:#228b22">旺</span>/<span style="color:#888">平</span>/<span style="color:#d41313">陷</span>）；点击星名查看释义</p>';
    h += '</div>';
    return h;
  }

  window.ZiWei = {
    paiPan: paiPan,
    render: render,
    calcLiuNian: calcLiuNian,
    STAR_DESC: STAR_DESC
  };
})();
