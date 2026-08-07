// ============ 紫微斗数排盘 ============
(function () {
  var Solar = window.Solar;
  var LunarUtil = window.LunarUtil;
  var U = window.Utils;

  var GAN = '甲乙丙丁戊己庚辛壬癸';
  var ZHI = '子丑寅卯辰巳午未申酉戌亥';

  // 十二宫名称（命宫起逆排）
  var PALACE = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'];

  // 十四主星
  var STAR14 = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];
  // 辅星
  var STAR_FU = ['左辅', '右弼', '文昌', '文曲', '天魁', '天钺', '禄存', '擎羊', '陀罗', '火星', '铃星', '地空', '地劫', '天马'];

  // 五行局数（纳音五行 → 局数）：水2 木3 金4 土5 火6
  var JU_MAP = { 水: 2, 木: 3, 金: 4, 土: 5, 火: 6 };

  // 四化表（年干）
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

  // 五虎遁（年干 → 寅月干）
  var WU_HU = { 甲: '丙', 己: '丙', 乙: '戊', 庚: '戊', 丙: '庚', 辛: '庚', 丁: '壬', 壬: '壬', 戊: '甲', 癸: '甲' };

  // 纳音五行
  var NAYIN_WX = { 金: '金', 木: '木', 水: '水', 火: '火', 土: '土' };

  function wuXingOfNaYin(ny) {
    var last = ny ? ny.substr(-1) : '';
    return NAYIN_WX[last] || '';
  }

  // 星曜五行颜色类
  var STAR_WX = {
    紫微: '土', 天机: '木', 太阳: '火', 武曲: '金', 天同: '水', 廉贞: '火',
    天府: '土', 太阴: '水', 贪狼: '木', 巨门: '水', 天相: '水', 天梁: '土', 七杀: '金', 破军: '水',
    左辅: '土', 右弼: '水', 文昌: '金', 文曲: '水', 天魁: '火', 天钺: '火',
    禄存: '土', 擎羊: '火', 陀罗: '金', 火星: '火', 铃星: '火', 地空: '火', 地劫: '火', 天马: '火'
  };
  var WX_CLS = { 金: 'c-gold', 木: 'c-wood', 水: 'c-water', 火: 'c-fire', 土: 'c-earth' };

  function starColor(name, suse) {
    if (suse) return '<span>' + name + '</span>';
    return '<span class="' + (WX_CLS[STAR_WX[name]] || '') + '">' + name + '</span>';
  }

  // 地支 → 盘面位置（4x4 grid 的 row, col，1 起）
  var POS = {
    巳: [1, 1], 午: [1, 2], 未: [1, 3], 申: [1, 4],
    辰: [2, 1], 酉: [2, 4],
    卯: [3, 1], 戌: [3, 4],
    寅: [4, 1], 丑: [4, 2], 子: [4, 3], 亥: [4, 4]
  };

  // ============ 核心排盘 ============
  function paiPan(solar, gender) {
    var lunar = solar.getLunar();
    var bazi = lunar.getEightChar();
    bazi.setSect(1);

    var yearGan = lunar.getYearInGanZhi().substr(0, 1);
    var yearZhi = lunar.getYearInGanZhi().substr(1, 1);
    var month = lunar.getMonth();       // 农历月数
    var day = lunar.getDay();           // 农历日数
    var hourZhi = bazi.getTimeZhi();    // 时支
    var H = ZHI.indexOf(hourZhi);
    var M = month;
    if (lunar.getDay() < 1) day = 1;

    // 命宫 = (1 + M - H) % 12；身宫 = (1 + M + H) % 12
    var mingGong = (1 + M - H + 12) % 12;
    var shenGong = (1 + M + H + 12) % 12;

    // 命宫干支（五虎遁）
    var mingGongZhi = ZHI[mingGong];
    var startGan = WU_HU[yearGan] || '丙';
    var mingGongGan = GAN[(GAN.indexOf(startGan) + (mingGong - 2 + 12) % 12) % 10];
    var mingGongGZ = mingGongGan + mingGongZhi;

    // 五行局（命宫纳音五行）
    var naYin = LunarUtil.NAYIN[mingGongGZ] || '';
    var ju = JU_MAP[wuXingOfNaYin(naYin)] || 5;
    var juName = ({ 2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局' })[ju];

    // 紫微星 = (2 + floor((day-1)/ju)) % 12
    var ziwei = (2 + Math.floor((day - 1) / ju)) % 12;
    // 天府星 = (4 - ziwei + 12) % 12
    var tianfu = (4 - ziwei + 12) % 12;

    // 主星落宫
    var stars = {}; // 星名 -> 地支序号
    // 紫微星系（逆排）
    var ziweiSeq = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞'];
    for (var i = 0; i < ziweiSeq.length; i++) {
      stars[ziweiSeq[i]] = (ziwei - i + 12) % 12;
    }
    // 天府星系（顺排）
    var tianfuSeq = ['天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];
    for (var j = 0; j < tianfuSeq.length; j++) {
      stars[tianfuSeq[j]] = (tianfu + j) % 12;
    }

    // 辅星
    // 左辅 = 辰 + (M-1)；右弼 = 戌 - (M-1)
    stars['左辅'] = (4 + M - 1) % 12;
    stars['右弼'] = (10 - (M - 1) + 12) % 12;
    // 文昌 = 戌起子时逆数；文曲 = 辰起子时顺数
    stars['文昌'] = (10 - H + 12) % 12;
    stars['文曲'] = (4 + H) % 12;
    // 天魁天钺（= 天乙贵人，年干）
    var tianYi = window.ShenShaData ? window.ShenShaData.tianYi[yearGan] : ['丑', '未'];
    stars['天魁'] = ZHI.indexOf(tianYi[0]);
    stars['天钺'] = ZHI.indexOf(tianYi[1]);
    // 禄存（年干）
    var luShen = window.ShenShaData ? window.ShenShaData.luShen[yearGan] : '寅';
    var luIdx = ZHI.indexOf(luShen);
    stars['禄存'] = luIdx;
    stars['擎羊'] = (luIdx + 1) % 12;
    stars['陀罗'] = (luIdx - 1 + 12) % 12;
    // 火星铃星
    var huoStart, lingStart;
    if ('子午卯酉'.indexOf(yearZhi) >= 0) { huoStart = 2; lingStart = 10; }
    else if ('寅申巳亥'.indexOf(yearZhi) >= 0) { huoStart = 1; lingStart = 3; }
    else { huoStart = 8; lingStart = 5; }
    stars['火星'] = (huoStart + H) % 12;
    stars['铃星'] = (lingStart + H) % 12;
    // 地空地劫
    stars['地空'] = (11 + H) % 12;
    stars['地劫'] = (11 - H + 12) % 12;
    // 天马（年支驿马）：yiMa 表是 {地支: 神煞名}，反向查找
    var sanHe = window.ShenShaData ? window.ShenShaData.sanHe[yearZhi] : '';
    var yiMa = window.ShenShaData ? window.ShenShaData.yiMa[sanHe] : null;
    var tianMa = '寅';
    if (yiMa) {
      for (var tm in yiMa) {
        if (yiMa[tm] === '驿马') { tianMa = tm; break; }
      }
    }
    stars['天马'] = ZHI.indexOf(tianMa);

    // 四化（年干）
    var huaList = HUA[yearGan] || [];
    var hua = {};
    for (var k = 0; k < huaList.length; k++) {
      hua[huaList[k][1]] = { star: huaList[k][0], idx: stars[huaList[k][0]] };
    }

    // 十二宫（命宫起逆排）+ 大限
    var palaces = [];
    var isYang = '甲丙戊庚壬'.indexOf(yearGan) >= 0;
    var shun = (isYang && gender === 1) || (!isYang && gender === 0); // 阳男阴女顺
    var palaceIdx = 0;
    var daXianStart = ju;
    var visited = {};
    for (var p = 0; p < 12; p++) {
      var zhiIdx = (mingGong - p + 12) % 12;
      var starNames = [];
      for (var s in stars) {
        if (stars[s] === zhiIdx && STAR14.indexOf(s) >= 0) starNames.push(s);
      }
      for (var s2 in stars) {
        if (stars[s2] === zhiIdx && STAR_FU.indexOf(s2) >= 0) starNames.push(s2);
      }
      var huaIn = [];
      for (var hk in hua) {
        if (hua[hk].idx === zhiIdx) huaIn.push({ hua: hk, star: hua[hk].star });
      }
      // 大限
      var from = daXianStart + p * 10;
      var to = from + 9;
      palaces.push({
        zhi: ZHI[zhiIdx],
        name: PALACE[p],
        stars: starNames,
        hua: huaIn,
        isMing: zhiIdx === mingGong,
        isShen: zhiIdx === shenGong,
        daXian: from + '-' + to + '岁'
      });
    }

    return {
      info: {
        solar: solar, lunar: lunar, bazi: bazi, gender: gender,
        yearGan: yearGan, yearZhi: yearZhi,
        month: M, day: day, hourZhi: hourZhi,
        mingGong: mingGongZhi, shenGong: ZHI[shenGong],
        mingGongGZ: mingGongGZ, naYin: naYin, ju: ju, juName: juName,
        ziwei: ZHI[ziwei], tianfu: ZHI[tianfu],
        shun: shun
      },
      hua: hua,
      palaces: palaces
    };
  }

  // ============ 渲染 ============
  function render(pan) {
    var suse = 0;
    var info = pan.info;
    var h = '';

    // 出生信息（紧凑 3 行）
    h += '<div class="info-box" id="birth-info">';
    h += '<p><strong>公历</strong> ' + info.solar.getYear() + '-' + U.pad(info.solar.getMonth()) + '-' + U.pad(info.solar.getDay()) + ' ' + U.pad(info.solar.getHour()) + ':' + U.pad(info.solar.getMinute()) + '　<strong>农历</strong> ' + info.lunar.getYearInChinese() + '年' + info.lunar.getMonthInChinese() + '月' + info.lunar.getDayInChinese() + '日 ' + info.hourZhi + '时</p>';
    h += '<p><strong>八字</strong> ' + info.bazi.getYear() + ' ' + info.bazi.getMonth() + ' ' + info.bazi.getDay() + ' ' + info.bazi.getTime() + '　<strong>性别</strong> ' + (info.gender === 1 ? '男' : '女') + '　<strong>大限</strong> ' + info.ju + '岁起运' + (info.shun ? '顺行' : '逆行') + '</p>';
    h += '<p><strong>命宫</strong> ' + info.mingGongGZ + '（' + info.naYin + ' ' + info.juName + '）　<strong>身宫</strong> ' + info.shenGong + '　<strong>紫微</strong>' + info.ziwei + ' <strong>天府</strong>' + info.tianfu + '</p>';
    h += '</div>';

    // 十二宫盘面（4x4 grid）
    h += '<div class="zw-grid">';
    var byPos = {};
    for (var i = 0; i < pan.palaces.length; i++) {
      var pl = pan.palaces[i];
      var pos = POS[pl.zhi];
      byPos[pl.zhi] = pl;
    }
    for (var r = 1; r <= 4; r++) {
      for (var c = 1; c <= 4; c++) {
        var cellZhi = null;
        for (var z in POS) {
          if (POS[z][0] === r && POS[z][1] === c) { cellZhi = z; break; }
        }
        if (!cellZhi) {
          h += '<div class="zw-cell empty"></div>';
          continue;
        }
        var pl2 = byPos[cellZhi];
        h += '<div class="zw-cell' + (pl2.isMing ? ' ming' : '') + (pl2.isShen ? ' shen' : '') + '">';
        h += '<div class="zw-cell-head">' + pl2.zhi + ' ' + pl2.name + (pl2.isMing ? '【命】' : '') + (pl2.isShen ? '【身】' : '') + '</div>';
        h += '<div class="zw-daxian">' + pl2.daXian + '</div>';
        // 星曜
        var starHtml = '';
        for (var s = 0; s < pl2.stars.length; s++) {
          var nm = pl2.stars[s];
          // 找四化标记
          var huaMark = '';
          for (var hk = 0; hk < pl2.hua.length; hk++) {
            if (pl2.hua[hk].star === nm) {
              huaMark = '<span class="hua-mark ' + pl2.hua[hk].hua + '">' + pl2.hua[hk].hua + '</span>';
              break;
            }
          }
          starHtml += '<div class="zw-star">' + starColor(nm, suse) + huaMark + '</div>';
        }
        h += '<div class="zw-stars">' + starHtml + '</div>';
        h += '</div>';
      }
    }
    h += '</div>';

    // 四化说明
    h += '<div class="info-box">';
    h += '<p><strong>四化（' + info.yearGan + '年干）：</strong>';
    var huaDesc = [];
    for (var hh in pan.hua) {
      var hv = pan.hua[hh];
      huaDesc.push(hv.star + '化' + hh + '（' + ZHI[hv.idx] + '宫）');
    }
    h += huaDesc.join('，') + '</p>';
    h += '</div>';
    return h;
  }

  window.ZiWei = {
    paiPan: paiPan,
    render: render
  };
})();
