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
  // 流昌流曲（流年/大限干定，iztro 公式：子=0 索引 [昌,曲]）
  var LIU_CHANG_QU = { 甲: [5, 9], 乙: [6, 8], 丙: [8, 6], 丁: [9, 5], 戊: [8, 6], 己: [9, 5], 庚: [11, 3], 辛: [0, 2], 壬: [2, 0], 癸: [3, 11] };
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

  // ============ 杂耀安星（按 iztro/文墨天机规则，年/月/日/时四系，子=0 索引） ============
  var CS = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
  var CS_START = { 2: 8, 3: 11, 4: 5, 5: 8, 6: 2 };   // 五行局→长生起始地支（水2申/木3亥/金4巳/土5申/火6寅）
  var MINGZHU = ['贪狼', '巨门', '禄存', '文曲', '廉贞', '武曲', '破军', '武曲', '廉贞', '文曲', '禄存', '巨门']; // 命宫支→命主
  var SHENZHU = ['火星', '天相', '天梁', '天同', '文昌', '天机', '火星', '天相', '天梁', '天同', '文昌', '天机']; // 年支→身主
  var HG = [4, 1, 10, 7, 4, 1, 10, 7, 4, 1, 10, 7];    // 华盖
  var XC = [9, 6, 3, 0, 9, 6, 3, 0, 9, 6, 3, 0];        // 咸池
  var GU = [2, 2, 5, 5, 5, 8, 8, 8, 11, 11, 11, 2];     // 孤辰
  var GUA = [10, 10, 1, 1, 1, 4, 4, 4, 7, 7, 7, 10];    // 寡宿
  var PS = [5, 1, 9, 5, 1, 9, 5, 1, 9, 5, 1, 9];        // 破碎
  var FL = [8, 9, 10, 5, 6, 7, 2, 3, 4, 11, 0, 1];      // 蜚廉
  var JS = [5, 2, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8];     // 劫煞
  var ZS = [6, 3, 0, 9, 6, 3, 0, 9, 6, 3, 0, 9];        // 灾煞
  var NJ = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 11];      // 年解
  var TC = [5, 6, 0, 5, 6, 8, 2, 6, 9, 11];             // 天厨（年干）
  var TG = [7, 4, 5, 2, 3, 9, 11, 9, 10, 6];            // 天官（年干）
  var TF = [9, 8, 0, 11, 3, 2, 6, 5, 6, 5];             // 天福（年干）
  var JL = [8, 6, 4, 2, 0];                             // 截空（阳干）
  var KW = [9, 7, 5, 3, 1];                             // 截空（阴干）
  var YS = [2, 0, 10, 8, 6, 4];                         // 阴煞（月）
  var TY = [10, 5, 4, 2, 7, 3, 11, 7, 2, 6, 10, 2];     // 天月（月）
  var TW = [5, 8, 2, 11];                               // 天巫（月）
  var TAOHUA = ['红鸾', '天喜', '咸池', '天姚'];          // 桃花系（高亮）
  var SUIQIAN = ['岁建', '晦气', '丧门', '贯索', '官符', '小耗', '大耗', '龙德', '白虎', '天德', '吊客', '病符']; // 岁前十二神
  var JIANGQIAN = ['将星', '攀鞍', '岁驿', '息神', '华盖', '劫煞', '灾煞', '天煞', '指背', '咸池', '月煞', '亡神']; // 将前十二神
  var JIANG_STAR = [0, 9, 6, 3, 0, 9, 6, 3, 0, 9, 6, 3]; // 年支→将星位（子0：申子辰子/巳酉丑酉/寅午戌午/亥卯未卯）
  var ZHI_POINT = { 巳: [25, 25], 午: [37.5, 25], 未: [62.5, 25], 申: [75, 25], 辰: [25, 37.5], 酉: [75, 37.5], 卯: [25, 62.5], 戌: [75, 62.5], 寅: [25, 75], 丑: [37.5, 75], 子: [62.5, 75], 亥: [75, 75] }; // 十二宫内缘点（朝中宫一侧，连线穿中宫可见）

  function getXingZuo(month, day) {
    var bd = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 23, 22];
    var s = ['水瓶座', '双鱼座', '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座'];
    var idx = day < bd[month - 1] ? (month - 2 + 12) % 12 : (month - 1) % 12;
    return s[idx];
  }

  function fixI(v) { return ((v % 12) + 12) % 12; }

  function calcMinorStars(yg, yz, M, D, H, soul, body) {
    var r = {};
    function s(n, i) { r[n] = fixI(i); }
    var ygi = GAN.indexOf(yg);
    var M1 = M - 1, D1 = D - 1;
    var hl = fixI(3 - yz);
    s('红鸾', hl); s('天喜', hl + 6);
    s('华盖', HG[yz]); s('咸池', XC[yz]);
    s('孤辰', GU[yz]); s('寡宿', GUA[yz]);
    s('破碎', PS[yz]); s('蜚廉', FL[yz]);
    s('劫煞', JS[yz]); s('灾煞', ZS[yz]);
    s('龙池', 4 + yz); s('凤阁', 10 - yz);
    s('天哭', 6 - yz); s('天虚', 6 + yz);
    s('天德', 9 + yz); s('月德', 5 + yz);
    s('天空', yz + 1);
    s('年解', NJ[yz]);
    s('天才', soul + yz); s('天寿', body + yz);
    s('天厨', TC[ygi]); s('天官', TG[ygi]); s('天福', TF[ygi]);
    s('截空', ygi % 2 === 0 ? JL[ygi % 5] : KW[ygi % 5]);
    // 月系
    s('解神', [8, 10, 0, 2, 4, 6][Math.floor(M1 / 2)]);
    s('天姚', 1 + M1); s('天刑', 9 + M1);
    s('阴煞', YS[M1 % 6]); s('天月', TY[M1]); s('天巫', TW[M1 % 4]);
    // 日系
    var zuo = fixI(4 + M1), you = fixI(10 - M1);
    s('三台', zuo + D1); s('八座', you - D1);
    var chang = fixI(10 - H), qu = fixI(4 + H);
    s('恩光', chang + D1 - 1); s('天贵', qu + D1 - 1);
    // 时系
    s('台辅', 6 + H); s('封诰', 2 + H);
    return r;
  }

  // ============ 核心排盘 ============
  function paiPan(solar, gender) {
    var lunar = solar.getLunar();
    var bazi = lunar.getEightChar();
    bazi.setSect(1);

    // 紫微年干支按立春换年（与八字一致）
    var yearGan = lunar.getYearInGanZhiExact().substr(0, 1);
    var yearZhi = lunar.getYearInGanZhiExact().substr(1, 1);
    var month = Math.abs(lunar.getMonth()); // 闰月返回负数，取绝对值（闰月按当月论）
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

    // 紫微安星（iztro/标准算法：生日+最小偏移 整除局数，按奇偶顺逆补位）
    var _day = day, _off = -1, _q = 0, _r = 0;
    do { _off++; var _dv = _day + _off; _q = Math.floor(_dv / ju); _r = _dv % ju; } while (_r !== 0);
    _q %= 12;
    var _zi = _q - 1;
    if (_off % 2 === 0) _zi += _off; else _zi -= _off;
    _zi = fixI(_zi); // iztro 索引（寅=0）
    var ziwei = (_zi + 2) % 12;       // 子=0
    var tianfu = (12 - _zi + 2) % 12; // 子=0（天府与紫微相对）

    var stars = {};
    // 紫微星系（iztro 标准隔位逆数）：紫微0 天机-1 太阳-3 武曲-4 天同-5 廉贞-8
    var ziweiSeq = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞'];
    var ziweiOff = [0, -1, -3, -4, -5, -8];
    for (var i = 0; i < ziweiSeq.length; i++) stars[ziweiSeq[i]] = (ziwei + ziweiOff[i] + 12) % 12;
    // 天府星系（顺行，iztro/安星诀"七杀空三是破军"）：天府0 太阴1 贪狼2 巨门3 天相4 天梁5 七杀6 破军10
    var tianfuSeq = ['天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];
    var tianfuOff = [0, 1, 2, 3, 4, 5, 6, 10];
    for (var j = 0; j < tianfuSeq.length; j++) stars[tianfuSeq[j]] = (tianfu + tianfuOff[j]) % 12;

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
    // 火星铃星按三合局起（申子辰火寅铃戌 / 寅午戌火丑铃卯 / 巳酉丑火卯铃戌 / 亥卯未火酉铃戌）
    if ('申子辰'.indexOf(yearZhi) >= 0) { huoStart = 2; lingStart = 10; }
    else if ('寅午戌'.indexOf(yearZhi) >= 0) { huoStart = 1; lingStart = 3; }
    else if ('巳酉丑'.indexOf(yearZhi) >= 0) { huoStart = 3; lingStart = 10; }
    else { huoStart = 9; lingStart = 10; }
    stars['火星'] = (huoStart + H) % 12;
    stars['铃星'] = (lingStart + H) % 12;
    // 地空从亥逆数至生时、地劫从亥顺数至生时
    stars['地空'] = (11 - H + 12) % 12;
    stars['地劫'] = (11 + H) % 12;
    var sanHe = window.ShenShaData ? window.ShenShaData.sanHe[yearZhi] : '';
    var yiMa = window.ShenShaData ? window.ShenShaData.yiMa[sanHe] : null;
    var tianMa = '寅';
    if (yiMa) { for (var tm in yiMa) { if (yiMa[tm] === '驿马') { tianMa = tm; break; } } }
    stars['天马'] = ZHI.indexOf(tianMa);

    // 生年四化
    var huaList = HUA[yearGan] || [];
    var hua = {};
    for (var k = 0; k < huaList.length; k++) hua[huaList[k][1]] = { star: huaList[k][0], idx: stars[huaList[k][0]] };

    // 十二宫 + 大限 + 宫干 + 杂耀/长生/小限
    var isYang = '甲丙戊庚壬'.indexOf(yearGan) >= 0;
    var shun = (isYang && gender === 1) || (!isYang && gender === 0);
    var palaces = [];
    var daXianStart = ju;
    var yinGan = GAN.indexOf(WU_HU[yearGan] || '丙'); // 寅宫天干序号
    var yearZhiIdx = ZHI.indexOf(yearZhi);
    var minorStars = calcMinorStars(yearGan, yearZhiIdx, month, day, H, mingGong, shenGong);
    var minorByZhi = {};
    for (var msk in minorStars) {
      var mz = minorStars[msk];
      (minorByZhi[mz] || (minorByZhi[mz] = [])).push(msk);
    }
    var csStart = CS_START[ju];
    var mingZhu = MINGZHU[mingGong];
    var shenZhu = SHENZHU[yearZhiIdx];
    var XX_START = { 2: 4, 6: 4, 10: 4, 8: 10, 0: 10, 4: 10, 5: 7, 9: 7, 1: 7, 11: 1, 3: 1, 7: 1 }; // 年支→小限起宫（寅午戌辰/申子辰戌/巳酉丑未/亥卯未丑）
    var xxStart = XX_START[yearZhiIdx];
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
      // 大限：顺行按地支顺排、逆行按地支逆排，从命宫起
      var flowPos = shun ? (zhiIdx - mingGong + 12) % 12 : (mingGong - zhiIdx + 12) % 12;
      var from = daXianStart + flowPos * 10, to = from + 9;
      // 长生
      var cs = CS[(zhiIdx - csStart + 12) % 12];
      // 小限（男顺女逆，每宫虚岁基数 + 12 循环，取前 6 个）
      var xxBase = gender === 1 ? 1 + ((zhiIdx - xxStart + 12) % 12) : 1 + ((xxStart - zhiIdx + 12) % 12);
      var xxAges = [xxBase];
      for (var xx = 1; xx < 6; xx++) xxAges.push(xxBase + xx * 12);
      // 岁前/将前十二神（男顺女逆）
      var sqPos = gender === 1 ? (zhiIdx - yearZhiIdx + 12) % 12 : (yearZhiIdx - zhiIdx + 12) % 12;
      var jsStar = JIANG_STAR[yearZhiIdx];
      var jqPos = gender === 1 ? (zhiIdx - jsStar + 12) % 12 : (jsStar - zhiIdx + 12) % 12;
      palaces.push({
        zhi: ZHI[zhiIdx], zhiIdx: zhiIdx, name: PALACE[p],
        stars: starNames, minor: minorByZhi[zhiIdx] || [], hua: huaIn,
        gongGan: GAN[gongGanIdx],
        isMing: zhiIdx === mingGong, isShen: zhiIdx === shenGong,
        daXian: from + '-' + to + '岁', changSheng: cs, xiaoXian: xxAges,
        suiQian: SUIQIAN[sqPos], jiangQian: JIANGQIAN[jqPos]
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
        stars: stars, isYang: isYang, mingZhu: mingZhu, shenZhu: shenZhu
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
    // 流年禄存/擎羊/陀罗 + 流昌/流曲（流年干定，iztro 公式）
    var luShen = window.ShenShaData ? window.ShenShaData.luShen[lnGan] : '寅';
    var luIdx = ZHI.indexOf(luShen);
    var lnStars = { '流禄': luIdx, '流羊': (luIdx + 1) % 12, '流陀': (luIdx - 1 + 12) % 12 };
    var lcq = LIU_CHANG_QU[lnGan];
    if (lcq) { lnStars['流昌'] = lcq[0]; lnStars['流曲'] = lcq[1]; }
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

  // ============ 常见格局检测（按《紫微斗数全书》成格规则） ============
  // src: { hua: 四化源, yang/tuo/lu: 羊陀禄星名（本命或流年）, extra: 额外星（流禄/流羊/流陀） }
  // 本命格局用生年四化+本命羊陀禄；大限格局用大限四化；流年格局用流年四化+流羊流陀流禄
  function detectGeJu(pan, src) {
    src = src || {};
    var info = pan.info;
    var stars = {};
    for (var sk in (info.stars || {})) stars[sk] = info.stars[sk];
    for (var ek in (src.extra || {})) stars[ek] = src.extra[ek];
    var huaSrc = src.hua || pan.hua || {};
    var YANG = src.yang || '擎羊', TUO = src.tuo || '陀罗', LU = src.lu || '禄存';
    var mingIdx = ZHI.indexOf(info.mingGong);
    var at = function (s) { var i = stars[s]; return i === undefined ? -1 : i; };
    var same = function (a, b) { return at(a) >= 0 && at(a) === at(b); };
    var dui = function (i) { return (i + 6) % 12; };                 // 对宫
    var jia = function (s) { var i = at(s); return i === (mingIdx + 11) % 12 || i === (mingIdx + 1) % 12; }; // 夹命宫
    var sanFang = {};                                                // 命宫三方四正
    [mingIdx, (mingIdx + 4) % 12, (mingIdx + 6) % 12, (mingIdx + 8) % 12].forEach(function (i) { sanFang[i] = true; });
    var inSf = function (s) { return sanFang[at(s)] === true; };
    var bright = function (s) { return (BRIGHT[s] && at(s) >= 0) ? BRIGHT[s][at(s)] : ''; };
    var isMiao = function (s) { return bright(s) === '庙' || bright(s) === '旺'; };
    var out = [];
    var push = function (type, name, desc) { out.push({ type: type, name: name, desc: desc }); };
    var mingStars = [];                       // 命宫所坐主星（14主星）
    (function () {
      for (var p = 0; p < pan.palaces.length; p++) {
        if (pan.palaces[p].zhiIdx === mingIdx) {
          for (var si = 0; si < pan.palaces[p].stars.length; si++) {
            if (STAR14.indexOf(pan.palaces[p].stars[si]) >= 0) mingStars.push(pan.palaces[p].stars[si]);
          }
        }
      }
    })();
    var huaStarAt = {};                       // 化星 → 所在宫
    for (var hk in huaSrc) { if (huaSrc[hk].idx !== undefined) huaStarAt[hk] = huaSrc[hk].idx; }

    // ===== 吉格（附《紫微斗数全书》《太微赋》歌诀出处） =====
    // 1. 紫微坐命
    if (at('紫微') === mingIdx) push('吉', '紫微坐命', '紫微坐命，帝王之命，具领导才能与权威，宜从政、管理。' + (isMiao('紫微') ? '紫微得地，格局更佳。' : '紫微落陷，威权有减。') + '【《紫微斗数全书》云：紫微帝座，至尊至贵，辅弼夹之而富贵。】');
    // 2. 紫府同宫
    if (same('紫微', '天府')) push('吉', '紫府同宫', '紫微天府同宫，财官双美，一生安稳富足，天府守财，主大器。' + '【古诀云：紫府同宫，终身福厚。】');
    // 3. 杀破狼（七杀破军贪狼会齐命宫三方）
    var sbp = ['七杀', '破军', '贪狼'].filter(function (s) { return inSf(s); });
    if (sbp.length >= 3) push('吉', '杀破狼', '七杀、破军、贪狼三星会齐命宫三方，变动开创之命，宜军警、创业、开拓性行业，急成急败，乱世英雄。' + '【《太微赋》云：杀破狼，七杀破军贪狼，主变动开创、四海纵横。】');
    // 4. 机月同梁
    var jy = ['天机', '太阴', '天同', '天梁'].filter(function (s) { return inSf(s); });
    if (jy.length >= 3) push('吉', '机月同梁', '机月同梁作吏人：天机、太阴、天同、天梁集于命宫三方，性格温和、策划力强，宜公职、文职、大型机构幕僚。' + '【《紫微斗数全书》云：机月同梁格，晋身可掌权，宜吏职公门。】');
    // 5. 府相朝垣
    if (inSf('天府') && inSf('天相')) push('吉', '府相朝垣', '天府天相在三方会照，财库稳固、食禄千钟，一生衣食无忧，多得贵人相助。' + '【《紫微斗数全书》云：府相朝垣格，食禄千钟。】');
    // 6. 阳梁昌禄
    if (inSf('太阳') && inSf('天梁') && (inSf('文昌') || (huaStarAt['禄'] !== undefined && sanFang[huaStarAt['禄']]))) push('吉', '阳梁昌禄', '太阳、天梁、文昌（禄存/化禄）三方会照，考试夺魁之格，宜学术、教育、法律、公职。' + '【《太微赋》云：阳梁昌禄，考试必胜之诀。】');
    // 7. 三奇嘉会（化禄权科同聚三方四正）
    var sanQiCnt = ['禄', '权', '科'].filter(function (h) { return huaStarAt[h] !== undefined && sanFang[huaStarAt[h]]; }).length;
    if (sanQiCnt >= 3) push('吉', '三奇嘉会', '化禄、化权、化科同聚命宫三方四正，名利双收、富贵最全之格，才华与机遇兼备。' + '【《紫微斗数全书》云：三奇嘉会格，万倾波涛，富贵至极。】');
    // 8. 火贪格
    if (same('火星', '贪狼')) push('吉', '火贪格', '火星贪狼同宫，暴发横财之象，财运来去急骤，宜军警武职，把握时机可成大业。' + '【《紫微斗数全书》云：火贪同位格，横发之时际遇殊，暴发横财。】');
    // 9. 铃贪格
    if (same('铃星', '贪狼')) push('吉', '铃贪格', '铃星贪狼同宫，偏财暴发，一生多意外之财，亦多波折，中年后发达。' + '【古诀云：铃贪同位格，财禄三局，偏财暴发。】');
    // 10. 日月同宫
    if (same('太阳', '太阴')) push('吉', '日月同宫', '太阳太阴同宫，阴阳调和，为人圆融，但日月相会一生多有起伏，宜平衡兼顾。' + '【《太微赋》云：日月同临，位居台辅，不作庸常之论。】');
    // 11. 日月并明
    if (isMiao('太阳') && isMiao('太阴')) push('吉', '日月并明', '太阳太阴各在庙旺之位，聪慧明理，事业感情两相宜，格局清贵。' + '【古诀云：日月并明，富贵荣华。】');
    // 12. 禄马交驰
    if (same(LU, '天马') || (huaStarAt['禄'] !== undefined && huaStarAt['禄'] === at('天马'))) push('吉', '禄马交驰', '禄马交驰，财源流动、愈动愈旺，宜贸易、物流、海外发展，动中得财。' + '【古诀云：禄马交驰，财官双美，动中得财。】');
    // 13. 文星拱命
    if ((jia('文昌') && jia('文曲')) || (inSf('文昌') && inSf('文曲'))) push('吉', '文星拱命', '文昌文曲拱照命宫，聪明好学、才华出众，利考试文书、学术研究。' + '【《紫微斗数全书》云：昌曲夹命，文星拱命，才华出众，科甲可期。】');
    // 14. 左右夹命
    if (jia('左辅') && jia('右弼')) push('吉', '左右夹命', '左辅右弼夹命，贵人环绕、人缘极佳，领导有方，宜团队管理与合伙事业。' + '【古诀云：辅弼夹命，贵人多助，终生受用。】');
    // 15. 坐贵向贵
    if ((at('天魁') === mingIdx && at('天钺') === dui(mingIdx)) || (at('天钺') === mingIdx && at('天魁') === dui(mingIdx))) push('吉', '坐贵向贵', '天魁天钺分居命宫与迁移宫，一生贵人扶持，逢凶化吉，利外出发展。' + '【《紫微斗数全书》云：坐贵向贵，主得贵人提携，一生无忧。】');
    // 16. 七杀朝斗
    if ((at('七杀') === 0 || at('七杀') === 6) && at('紫微') === dui(at('七杀'))) push('吉', '七杀朝斗', '七杀坐子午，对宫紫微相照，将星得地、威震四方，宜军警、竞技、开创先锋。' + '【古诀云：七杀朝斗格，威震边疆，将星得地。】');
    // 17. 日丽中天
    if (at('太阳') === 6) push('吉', '日丽中天', '太阳居午，日丽中天，光明磊落，主贵，利公职与名望，中年后发越。' + '【《紫微斗数全书》云：太阳居午，日丽中天，光耀门楣，主贵。】');
    // 18. 月朗天门
    if (at('太阴') === 11) push('吉', '月朗天门', '太阴居亥，月朗天门，清贵之命，才华内敛，女命尤佳。' + '【《紫微斗数全书》云：太阴在亥，月朗天门，女命尤为清贵。】');
    // 19. 明珠出海
    if (at('太阳') === 4) push('吉', '明珠出海', '太阳在辰入庙，光耀门楣、名声远播，宜文化、教育、政治。' + '【古诀云：太阳在辰，明珠出海，名利双收。】');

    // ===== 凶格 =====
    // 20. 命无正曜
    if (mingStars.length === 0) push('凶', '命无正曜', '命宫无十四主星坐守，个性受环境与对宫影响较大，宜借对宫星曜力量，命格变化多端。' + '【《紫微斗数全书》云：命无正曜格，一生多飘摇，进退失据。】');
    // 21. 羊陀夹命
    if (jia(YANG) && jia(TUO)) push('凶', '羊陀夹命', '羊陀夹命，行事多阻碍、劳碌受制，宜忍耐守成，不宜冒进。' + '【古诀云：羊陀夹命格，劳碌多灾，财帛难聚。】');
    // 22. 火铃夹命
    if (jia('火星') && jia('铃星')) push('凶', '火铃夹命', '火星铃星夹命，性格急躁、是非较多，需修心养性，晚运可佳。' + '【古诀云：火铃夹命格，一生多灾，性燥易怒。】');
    // 23. 空劫夹命
    if (jia('地空') && jia('地劫')) push('凶', '空劫夹命', '地空地劫夹命，钱财不聚、人生波折较多，宜务实守财。' + '【古诀云：空劫夹命格，财帛不聚，一生多劫。】');
    // 24. 刑囚夹印
    if (same('廉贞', '天相') && (at('廉贞') === 0 || at('廉贞') === 6) && at(YANG) === at('廉贞') && huaStarAt['忌'] === at('廉贞')) push('凶', '刑囚夹印', '廉贞天相在子午，廉贞化忌加擎羊，主官非诉讼、名誉受损，行事需谨慎守法。' + '【《紫微斗数全书》云：刑囚夹印格，一生多刑伤官非，纵有大志亦难伸。】');
    // 25. 马头带剑
    if (same(YANG, '天马')) push('凶', '马头带剑', '擎羊天马同宫，奔波劳碌、离乡背井之象，宜动中求财，注意意外。' + '【古诀云：马头带剑格，离乡背井，亦主武贵，动中求财。】');
    // 26. 日月反背
    if (at('太阳') === 11 && at('太阴') === 4) push('凶', '日月反背', '太阳在亥、太阴在巳，日月各落陷地，事业多阻、六亲缘薄，宜坚韧守成。' + '【古诀云：日月反背格，兄弟不睦，财帛散耗，一生劳碌。】');
    // 27. 巨机同临
    if (same('巨门', '天机')) push('凶', '巨机同临', '巨门天机同宫，口舌是非、心思过重，口才与智慧并用，宜学术、外交、咨询，谨防多疑。' + '【《紫微斗数全书》云：巨机同临格，主口舌是非，聪明反被聪明误。】');
    // 28. 贪狼陷地
    if (at('贪狼') === mingIdx && bright('贪狼') === '陷') push('凶', '贪狼陷地', '贪狼落陷坐命，欲望较强、易沉迷声色，宜自律修身。' + '【古诀云：贪狼落陷，主淫欲多情，宜修身养性。】');
    // 29. 廉贞破军
    if (same('廉贞', '破军')) push('凶', '廉贞破军', '廉贞破军同宫，人生大起大落，宜在变动中求发展，注意是非。' + '【古诀云：廉贞破军，一生起伏，多灾多难，宜守不宜攻。】');
    // 30. 羊陀夹忌
    (function () {
      if (huaStarAt['忌'] !== undefined) {
        var jiIdx = huaStarAt['忌'];
        if (at(YANG) === (jiIdx + 11) % 12 && at(TUO) === (jiIdx + 1) % 12) push('凶', '羊陀夹忌', '羊陀夹化忌之星，进退两难、煎熬痛苦，凡事多留余地。' + '【古诀云：羊陀夹忌格，做事多横逆，进退维谷。】');
      }
    })();
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
    // 当前大限对应的公历年份范围（虚岁 → 公历年 = 出生年 + 虚岁 - 1）
    var dxYear0 = info.solar.getYear() + (info.ju + daxianIdx * 10) - 1;
    var dxYear1 = dxYear0 + 9;
    // 流年条范围 = 当前大限 10 年（点击流年只移动高亮、范围不变）
    var liuYearStart = dxYear0, liuYearEnd = dxYear1;
    // liunian 不在当前大限范围内时收敛到大限首年（并同步回输入框）
    if (liuYear < liuYearStart || liuYear > liuYearEnd) {
      liuYear = liuYearStart;
      var lnInput = document.getElementById('zw-liunian');
      if (lnInput) lnInput.value = liuYear;
      ln = calcLiuNian(pan, liuYear);
    }
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

    // 出生信息已并入十二宫中央（不再单独显示顶部信息块，避免重复）

    // 十二宫盘面（4x4 grid，react-iztro 紧凑布局）
    h += '<div class="zw-grid">';
    // 三方四正连线（覆盖全盘：对宫→命宫→三方→命宫，react-iztro 几何）
    var sfZ = mingIdx;
    var sfPz = ZHI[sfZ], sfDg = ZHI[(sfZ + 6) % 12], sfQ4 = ZHI[(sfZ + 4) % 12], sfH4 = ZHI[(sfZ + 8) % 12];
    var sfPath = 'M' + ZHI_POINT[sfDg][0] + ' ' + ZHI_POINT[sfDg][1] +
      ' L' + ZHI_POINT[sfPz][0] + ' ' + ZHI_POINT[sfPz][1] +
      ' L' + ZHI_POINT[sfQ4][0] + ' ' + ZHI_POINT[sfQ4][1] +
      ' L' + ZHI_POINT[sfH4][0] + ' ' + ZHI_POINT[sfH4][1] +
      ' L' + ZHI_POINT[sfPz][0] + ' ' + ZHI_POINT[sfPz][1];
    h += '<svg class="zw-grid-sf" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="' + sfPath + '" class="zw-grid-sf-line"/></svg>';
    var byPos = {};
    for (var i = 0; i < pan.palaces.length; i++) byPos[pan.palaces[i].zhi] = pan.palaces[i];
    // 流年星（horo 行，始终显示）
    var lnPalaceStars = {};
    for (var sn in ln.stars) { var arr = lnPalaceStars[ln.stars[sn]] || (lnPalaceStars[ln.stars[sn]] = []); arr.push(sn); }
    // 大限运昌/运曲（大限宫干定）
    var dxCQ = LIU_CHANG_QU[dxGan];
    if (dxCQ) {
      var arrYC = lnPalaceStars[dxCQ[0]] || (lnPalaceStars[dxCQ[0]] = []); arrYC.push('运昌');
      var arrYQ = lnPalaceStars[dxCQ[1]] || (lnPalaceStars[dxCQ[1]] = []); arrYQ.push('运曲');
    }
    for (var r = 1; r <= 4; r++) {
      for (var c = 1; c <= 4; c++) {
        var cellZhi = null;
        for (var z in POS) { if (POS[z][0] === r && POS[z][1] === c) { cellZhi = z; break; } }
        if (!cellZhi) {
          // 中宫（2x2，恢复为紧凑信息布局）
          if (r === 2 && c === 2) {
            const yGZ = info.bazi.getYear(), mGZ = info.bazi.getMonth(), dGZ = info.bazi.getDay(), tGZ = info.bazi.getTime();
            h += '<div class="zw-center-cell">';
            h += '<div class="zw-center-bazi">';
            h += '<div class="zw-cb-row zw-cb-head"><span>年</span><span>月</span><span>日</span><span>时</span></div>';
            h += '<div class="zw-cb-row">' + U.wuXingColor(yGZ.substr(0, 1)) + U.wuXingColor(mGZ.substr(0, 1)) + U.wuXingColor(dGZ.substr(0, 1)) + U.wuXingColor(tGZ.substr(0, 1)) + '</div>';
            h += '<div class="zw-cb-row">' + U.wuXingColor(yGZ.substr(1, 1)) + U.wuXingColor(mGZ.substr(1, 1)) + U.wuXingColor(dGZ.substr(1, 1)) + U.wuXingColor(tGZ.substr(1, 1)) + '</div>';
            h += '</div>';
            h += '<div class="zw-center-info">' + info.mingGongGZ + ' · ' + info.juName + '</div>';
            h += '<div class="zw-center-info2">身宫' + info.shenGong + ' · 命主' + info.mingZhu + ' · 身主' + info.shenZhu + '</div>';
            h += '<div class="zw-center-info3">' + info.lunar.getYearInChinese() + '年' + info.lunar.getMonthInChinese() + '月' + info.lunar.getDayInChinese() + ' · 紫微' + info.ziwei + ' 天府' + info.tianfu + '</div>';
            h += '<div class="zw-center-info3">大限 ' + info.ju + '岁起运' + (info.shun ? '顺行' : '逆行') + ' · ' + info.yearGan + '年命</div>';
            h += '<div class="zw-center-info3 zw-c-ln">流年 ' + ln.year + ' ' + ln.gan + ln.zhi + ' · 虚岁' + ln.age + ' · 流命' + ZHI[ln.gongIdx] + '宫 小限' + ZHI[ln.xiaoXianIdx] + '宫</div>';
            h += '</div>';
          }
          // 其余中心格 (2,3)(3,2)(3,3) 已被中宫格 span 覆盖，不输出
          continue;
        }
        var pl = byPos[cellZhi];
        var isLnGong = (pl.zhiIdx === ln.gongIdx);
        var isXiaoXian = (pl.zhiIdx === ln.xiaoXianIdx);
        var isDxGong = (pl.zhiIdx === dxZhiIdx);
        // 重要星（主星+吉煞）竖排：两字上下、星与星横排；杂耀小星逐行堆叠；流年星粉
        var majorHtml = '';
        for (var s = 0; s < pl.stars.length; s++) {
          var nm = pl.stars[s];
          var huaMark = '';
          if (huaSrc) { for (var hk in huaSrc) { if (huaSrc[hk].star === nm) { huaMark = '<span class="zw-vhua ' + hk + '">' + hk + '</span>'; break; } } }
          var br = BRIGHT[nm] ? BRIGHT[nm][pl.zhiIdx] : '';
          var brHtml = br ? '<span class="zw-vbright" style="color:' + (BRIGHT_CLR[br] || '#888') + '">' + br + '</span>' : '';
          var wc = WX_CLS[STAR_WX[nm]] || '';
          var cls = STAR14.indexOf(nm) >= 0 ? ' zw-star-major' : '';
          majorHtml += '<span class="zw-vcell zw-star-click' + cls + '" data-star="' + nm + '">'
            + '<span class="zw-v1 ' + wc + '">' + nm.charAt(0) + brHtml + '</span>'
            + '<span class="zw-v2 ' + wc + '">' + nm.charAt(1) + huaMark + '</span>'
            + '</span>';
        }
        if (lnPalaceStars[pl.zhiIdx]) {
          var lns = lnPalaceStars[pl.zhiIdx];
          for (var li2 = 0; li2 < lns.length; li2++) majorHtml += '<span class="zw-lnstar">' + lns[li2] + '</span>';
        }
        var minorHtml = '';
        for (var mi2 = 0; mi2 < pl.minor.length; mi2++) {
          var mnm = pl.minor[mi2];
          minorHtml += '<span class="zw-minor-line' + (TAOHUA.indexOf(mnm) >= 0 ? ' zw-th' : '') + '">' + mnm + '</span>';
        }
        // 运限胶囊
        var fateHtml = '';
        if (isDxGong) fateHtml += '<span class="zw-fate zw-fate-dx">大限(' + pl.gongGan + ')</span>';
        if (isLnGong) fateHtml += '<span class="zw-fate zw-fate-ln">流年(' + ln.gan + ')</span>';
        if (isXiaoXian) fateHtml += '<span class="zw-fate zw-fate-xx">小限</span>';
        h += '<div class="zw-cell' + (pl.isMing ? ' ming' : '') + (pl.isShen ? ' shen' : '') + (isLnGong ? ' lngong' : '') + (isDxGong ? ' dxgong' : '') + '">';
        h += '<div class="zw-c-head"><span class="zw-c-name">' + pl.zhi + ' ' + pl.name + (pl.isMing ? ' ☯' : '') + (pl.isShen ? '·身' : '') + '</span><span class="zw-c-gz">' + pl.gongGan + pl.zhi + '</span></div>';
        h += '<div class="zw-c-sub">' + pl.daXian + ' · 十二长生·' + pl.changSheng + '</div>';
        h += '<div class="zw-c-stars">' + majorHtml + '</div>';
        if (minorHtml) h += '<div class="zw-c-minor">' + minorHtml + '</div>';
        if (fateHtml) h += '<div class="zw-c-fate">' + fateHtml + '</div>';
        h += '<div class="zw-c-footer">小限 ' + pl.xiaoXian.join(' ') + ' · ' + pl.suiQian + ' ' + pl.jiangQian + '</div>';
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

    // 大限条（一行 8 个大限，点击切换大限四化）
    h += '<div class="info-box"><div class="zw-bar-title">大限（' + (info.shun ? '顺行' : '逆行') + '·共8限）</div><div class="zw-bar zw-bar-8">';
    for (var dxi2 = 0; dxi2 < 8; dxi2++) {
      var dz2 = info.shun ? (mingIdx + dxi2) % 12 : (mingIdx - dxi2 + 12) % 12;
      var dp2 = null;
      for (var dq = 0; dq < pan.palaces.length; dq++) { if (pan.palaces[dq].zhiIdx === dz2) { dp2 = pan.palaces[dq]; break; } }
      var f2 = info.ju + dxi2 * 10;
      var cur2 = dxi2 === daxianIdx;
      h += '<div class="zw-bar-item' + (cur2 ? ' cur' : '') + '" data-dx="' + dxi2 + '">' + (dp2 ? U.wuXingColor(dp2.gongGan + ZHI[dz2]) : '') + '<span>' + f2 + '岁起</span></div>';
    }
    h += '</div></div>';

    // 流年条（一行 10 个，范围=当前大限 10 年，点击只移动高亮、范围不变）
    h += '<div class="info-box"><div class="zw-bar-title">流年（' + liuYearStart + '~' + liuYearEnd + '，点击切换）</div><div class="zw-bar zw-bar-10">';
    for (var ly2 = liuYearStart; ly2 <= liuYearEnd; ly2++) {
      var lso = Solar.fromYmdHms(ly2, 6, 1, 12, 0, 0);
      var lz = lso.getLunar().getYearInGanZhiExact();
      var cur3 = ly2 === liuYear;
      h += '<div class="zw-bar-item' + (cur3 ? ' cur' : '') + '" data-ln="' + ly2 + '">' + U.wuXingColor(lz) + '<span>' + ly2 + '</span></div>';
    }
    h += '</div></div>';

    // 常见格局（本命/大限/流年 三类，按《紫微斗数全书》成格规则，不同颜色）
    // 本命：仅固定星（生年四化 + 本命羊陀禄）；大限：大限变动星（运羊运陀运禄运昌运曲 + 大限四化）；
    // 流年：流年变动星（流羊流陀流禄流昌流曲 + 流年四化）
    var dxGan2 = info.yearGan, dxPalace2 = null;
    for (var dpk = 0; dpk < pan.palaces.length; dpk++) { if (pan.palaces[dpk].zhiIdx === dxZhiIdx) { dxPalace2 = pan.palaces[dpk]; break; } }
    if (dxPalace2) dxGan2 = dxPalace2.gongGan;
    var dxHua2 = {};
    var dh2 = HUA[dxGan2] || [];
    for (var dhk2 = 0; dhk2 < dh2.length; dhk2++) dxHua2[dh2[dhk2][1]] = { star: dh2[dhk2][0], idx: info.stars[dh2[dhk2][0]] };
    var gejuBen = detectGeJu(pan, { hua: pan.hua, yang: '擎羊', tuo: '陀罗', lu: '禄存' });
    // 大限变动星：运禄/运羊/运陀/运昌/运曲（大限宫干定）
    var dxLuI = ZHI.indexOf(window.ShenShaData ? window.ShenShaData.luShen[dxGan2] : '寅');
    var dxEx = { '运禄': dxLuI, '运羊': (dxLuI + 1) % 12, '运陀': (dxLuI - 1 + 12) % 12 };
    var dxCQ2 = LIU_CHANG_QU[dxGan2];
    if (dxCQ2) { dxEx['运昌'] = dxCQ2[0]; dxEx['运曲'] = dxCQ2[1]; }
    var gejuDx = detectGeJu(pan, { hua: dxHua2, yang: '运羊', tuo: '运陀', lu: '运禄', extra: dxEx });
    // 流年变动星：流禄/流羊/流陀/流昌/流曲（流年干定）
    var lnEx = { '流禄': ln.stars['流禄'], '流羊': ln.stars['流羊'], '流陀': ln.stars['流陀'] };
    if (ln.stars['流昌'] !== undefined) { lnEx['流昌'] = ln.stars['流昌']; lnEx['流曲'] = ln.stars['流曲']; }
    var gejuLn = detectGeJu(pan, { hua: ln.hua, yang: '流羊', tuo: '流陀', lu: '流禄', extra: lnEx });
    var gejuSections = [
      { label: '命盘格局', cls: 'zw-geju-ben', list: gejuBen },
      { label: '大限格局', cls: 'zw-geju-dx', list: gejuDx },
      { label: '流年格局', cls: 'zw-geju-ln', list: gejuLn }
    ];
    h += '<div class="info-box"><div class="zw-bar-title">常见格局（点击查看解说）</div>';
    for (var gs = 0; gs < gejuSections.length; gs++) {
      var sec = gejuSections[gs];
      h += '<div class="zw-geju-sec"><span class="zw-geju-label ' + sec.cls + '">' + sec.label + '</span><span class="zw-geju">';
      if (sec.list.length === 0) {
        h += '<span class="zw-geju-none">无</span>';
      } else {
        for (var gj4 = 0; gj4 < sec.list.length; gj4++) {
          h += '<span class="zw-geju-item ' + sec.cls + (sec.list[gj4].type === '凶' ? ' zw-geju-xiong' : '') + ' zw-geju-click" data-geju="' + sec.list[gj4].name + '" data-desc="' + sec.list[gj4].desc + '">' + sec.list[gj4].name + '</span>';
        }
      }
      h += '</span></div>';
    }
    h += '</div>';

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
