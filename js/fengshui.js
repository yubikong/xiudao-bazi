// ============ 八宅 + 玄空风水核心算法 ============
// 算法来源：
// - 八宅命卦/游年：GitHub Sudo-Biao/suangua (core/fengshui/calculator.py) + 大游年歌诀
// - 玄空飞星：GitHub minagawah/mikaboshi (src/jiuxing.rs) 三元九运/运盘/山向盘
(function () {
  'use strict';

  // ---- 基础 ----
  var GUA_NAMES = { 1: '坎', 2: '坤', 3: '震', 4: '巽', 6: '乾', 7: '兑', 8: '艮', 9: '离' };
  var GUA_NUM = { 坎: 1, 坤: 2, 震: 3, 巽: 4, 乾: 6, 兑: 7, 艮: 8, 离: 9 };
  var ELEMENT = { 1: '水', 2: '土', 3: '木', 4: '木', 6: '金', 7: '金', 8: '土', 9: '火' };

  // ============ 一、八宅 ============

  // 命卦计算（suangua 公式：男减女加，2000 年后调整）
  function calcMingGua(birthYear, gender) {
    var y = birthYear % 100;
    while (y >= 10) { y = String(y).split('').reduce(function (a, b) { return a + (+b); }, 0); }
    if (y === 0) y = 9;
    var male = gender === 1 || gender === '男' || gender === 'male';
    var gua;
    if (birthYear < 2000) {
      gua = male ? (10 - y) % 9 : (y + 5) % 9;
    } else {
      gua = male ? (9 - y) % 9 : (y + 6) % 9;
    }
    if (gua === 0) gua = 9;
    if (gua === 5) gua = male ? 2 : 8; // 男寄坤2、女寄艮8
    return gua;
  }

  function mingGuaName(gua) { return GUA_NAMES[gua] || ''; }
  function isEastFour(gua) { return gua === 1 || gua === 3 || gua === 4 || gua === 9; }

  // 大游年歌诀（8 句，每句从本卦起顺时针排 7 星）
  // 歌诀顺序：乾坎艮震巽离坤兑 8 宅
  var DAYOUNIAN = {
    乾: '六天五祸绝延生', 坎: '五天生延绝祸六', 艮: '六绝祸生延天五', 震: '延生祸绝五天六',
    巽: '天五六祸生绝延', 离: '六五绝延祸生天', 坤: '天延绝生祸五六', 兑: '生祸延绝六五天'
  };
  var STAR_FULL = { 生: '生气', 天: '天医', 延: '延年', 伏: '伏位', 绝: '绝命', 五: '五鬼', 六: '六煞', 祸: '祸害' };
  // 后天八卦顺时针方位（坎艮震巽离坤兑乾）
  var GUA_DIRS = { 坎: '北', 艮: '东北', 震: '东', 巽: '东南', 离: '南', 坤: '西南', 兑: '西', 乾: '西北' };
  var DIR_GUAS = { 北: '坎', 东北: '艮', 东: '震', 东南: '巽', 南: '离', 西南: '坤', 西: '兑', 西北: '乾' };
  var CLOCKWISE_GUAS = ['坎', '艮', '震', '巽', '离', '坤', '兑', '乾'];

  // 八星吉凶属性
  var STAR_QUALITY = {
    '生气': { quality: '吉', star: '贪狼', wx: '木', desc: '最吉，主发展、求财、婚姻、人丁' },
    '天医': { quality: '吉', star: '巨门', wx: '土', desc: '主健康、贵人、祛病消灾' },
    '延年': { quality: '吉', star: '武曲', wx: '金', desc: '主和顺、长寿、婚姻、多福' },
    '伏位': { quality: '吉', star: '左辅右弼', wx: '木', desc: '主柔顺平和、稳定守成' },
    '绝命': { quality: '凶', star: '破军', wx: '金', desc: '最凶，主冲突、病伤、绝嗣' },
    '五鬼': { quality: '凶', star: '廉贞', wx: '火', desc: '主暴躁、官非、火灾、盗贼' },
    '六煞': { quality: '凶', star: '文曲', wx: '水', desc: '主口舌是非、破财、桃花劫' },
    '祸害': { quality: '凶', star: '禄存', wx: '土', desc: '主口舌、疾病、劳苦、贫穷' }
  };

  // 计算某宅卦的八方吉凶（以宅卦为伏位，顺时针排）
  function bazhaiSectors(houseGua) {
    var guaName = GUA_NAMES[houseGua] || '坎';
    var song = DAYOUNIAN[guaName];
    var result = [];
    // 本卦=伏位，其余按顺时针
    var startIdx = CLOCKWISE_GUAS.indexOf(guaName);
    for (var i = 0; i < 8; i++) {
      var g = CLOCKWISE_GUAS[(startIdx + i) % 8];
      var dir = GUA_DIRS[g];
      var star = i === 0 ? '伏位' : (STAR_FULL[song.charAt(i - 1)] || '伏位');
      var info = STAR_QUALITY[star];
      result.push({
        gua: g, direction: dir, star: star,
        quality: info.quality, xing: info.star, wx: info.wx, desc: info.desc
      });
    }
    return result;
  }

  // 命卦八方吉凶（与宅卦同构：命卦为伏位）
  function mingGuaSectors(mingGua) {
    var sectors = bazhaiSectors(mingGua);
    return {
      mingGua: mingGua,
      guaName: GUA_NAMES[mingGua],
      eastFour: isEastFour(mingGua),
      group: isEastFour(mingGua) ? '东四命' : '西四命',
      sectors: sectors
    };
  }

  // ============ 二、玄空飞星 ============

  // 二十四山（从子起顺时针）及三元龙 sector（1=地元 2=天元 3=人元）
  var SHAN24 = ['子', '癸', '丑', '艮', '寅', '甲', '卯', '乙', '辰', '巽', '巳', '丙', '午', '丁', '未', '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥', '壬'];
  var SECTOR = [2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1];
  // 每山对应的宫位（后天八卦方位）
  var SHAN_PALACE = ['北', '北', '东北', '东北', '东北', '东', '东', '东', '东南', '东南', '东南', '南', '南', '南', '西南', '西南', '西南', '西', '西', '西', '西北', '西北', '西北', '北'];
  // 方位 → 洛书数
  var LUOSHU_DIR = { 北: 1, 西南: 2, 东: 3, 东南: 4, 中: 5, 西北: 6, 西: 7, 东北: 8, 南: 9 };
  var DIR_LUOSHU = {};
  for (var k in LUOSHU_DIR) DIR_LUOSHU[LUOSHU_DIR[k]] = k;
  // 飞星洛书轨迹（中→西北→西→东北→南→北→西南→东→东南）
  var FLY_ORDER = [5, 6, 7, 8, 9, 1, 2, 3, 4];

  // 九星信息
  var STAR_INFO = {
    1: { name: '一白贪狼', wx: '水', nature: '吉', color: '#3498db' },
    2: { name: '二黑巨门', wx: '土', nature: '大凶', color: '#e74c3c' },
    3: { name: '三碧禄存', wx: '木', nature: '凶', color: '#e67e22' },
    4: { name: '四绿文昌', wx: '木', nature: '吉', color: '#27ae60' },
    5: { name: '五黄廉贞', wx: '土', nature: '大凶', color: '#c0392b' },
    6: { name: '六白武曲', wx: '金', nature: '吉', color: '#f39c12' },
    7: { name: '七赤破军', wx: '金', nature: '凶', color: '#9b59b6' },
    8: { name: '八白左辅', wx: '土', nature: '大吉', color: '#f1c40f' },
    9: { name: '九紫右弼', wx: '火', nature: '吉', color: '#e74c3c' }
  };

  // 三元九运（1864 一运起，每运 20 年）
  function yunNum(year) {
    return Math.floor((year - 1864) / 20) % 9 + 1;
  }
  function yunName(year) {
    var y = yunNum(year);
    var yuan = year < 1924 ? '上元' : (year < 1984 ? '中元' : '下元');
    var names = { 1: '一运', 2: '二运', 3: '三运', 4: '四运', 5: '五运', 6: '六运', 7: '七运', 8: '八运', 9: '九运' };
    return yuan + names[y];
  }

  // 飞星布盘：centerNum 入中，reverse 决定顺逆；返回 9 个洛书位→星数
  function flyStars(centerNum, reverse) {
    var result = {};
    for (var i = 0; i < 9; i++) {
      var pos = FLY_ORDER[i];
      var num = reverse
        ? ((centerNum - 1 - i) % 9 + 9) % 9 + 1
        : ((centerNum - 1 + i) % 9) + 1;
      result[pos] = num;
    }
    return result;
  }

  // 山向盘顺逆判定（mikaboshi is_shan_xiang_flying_normal）
  // 返回 true = 逆飞、false = 顺飞
  function isReverse(starNum, sector) {
    var odd = starNum % 2 !== 0;      // 奇星=阳星
    var even = !odd;
    return (odd && sector === 1) || (even && sector > 1);
  }

  // 玄空排盘：year 建成年份，shanIndex 坐山（0-23 二十四山序号）
  function xuankongPan(year, shanIndex) {
    var shan = SHAN24[shanIndex];
    var palace = SHAN_PALACE[shanIndex];           // 坐山宫
    var palaceNum = LUOSHU_DIR[palace];            // 坐山宫洛书数
    var opposite = 10 - palaceNum;                 // 朝向宫洛书数（洛书对宫和为10：1↔9 2↔8 3↔7 4↔6）
    // 朝向二十四山：坐山 index + 12（180° 对宫）
    var xiangIndex = (shanIndex + 12) % 24;
    var xiang = SHAN24[xiangIndex];
    var xiangSector = SECTOR[xiangIndex];

    var yun = yunNum(year);
    // 运盘
    var unpan = flyStars(yun, false);
    // 山星：坐山宫运星入中
    var shanStar = unpan[palaceNum];
    var shanReverse = isReverse(shanStar, SECTOR[shanIndex]);
    var shanpan = flyStars(shanStar, shanReverse);
    // 向星：朝向宫运星入中
    var xiangStar = unpan[opposite];
    var xiangReverse = isReverse(xiangStar, xiangSector);
    var xiangpan = flyStars(xiangStar, xiangReverse);

    // 汇总 9 宫
    var palaces = FLY_ORDER.map(function (pos) {
      var dir = DIR_LUOSHU[pos];
      return {
        luoshu: pos,
        direction: dir,
        yun: unpan[pos],
        shan: shanpan[pos],
        xiang: xiangpan[pos],
        starName: STAR_INFO[unpan[pos]].name,
        nature: STAR_INFO[unpan[pos]].nature,
        color: STAR_INFO[unpan[pos]].color
      };
    });

    return {
      year: year,
      yun: yun,
      yunName: yunName(year),
      shan: shan,
      xiang: xiang,
      shanPalace: palace,
      xiangPalace: DIR_LUOSHU[opposite],
      shanStar: shanStar, shanReverse: shanReverse,
      xiangStar: xiangStar, xiangReverse: xiangReverse,
      palaces: palaces
    };
  }

  // 角度 → 二十四山序号（每山 15°，子=0°）
  function shanIndexFromDegree(deg) {
    return Math.floor(((deg % 360) + 360) % 360 / 15 + 0.5) % 24;
  }

  window.FengShui = {
    calcMingGua: calcMingGua,
    mingGuaName: mingGuaName,
    isEastFour: isEastFour,
    bazhaiSectors: bazhaiSectors,
    mingGuaSectors: mingGuaSectors,
    yunNum: yunNum,
    yunName: yunName,
    flyStars: flyStars,
    xuankongPan: xuankongPan,
    shanIndexFromDegree: shanIndexFromDegree,
    SHAN24: SHAN24,
    STAR_INFO: STAR_INFO,
    STAR_QUALITY: STAR_QUALITY,
    GUA_NAMES: GUA_NAMES
  };
})();
