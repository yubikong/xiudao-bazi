// ============ 八字排盘逻辑（复刻原网站） ============
(function () {
  const Solar = window.Solar;
  const LunarUtil = window.LunarUtil;
  const RD = window.RiliData;
  const SS = window.ShenShaData;
  const U = window.Utils;

  // 十神映射
  const SHEN_MAP = {
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

  function lunarShiShen(gz) {
    return SHEN_MAP[gz] || '';
  }

  // 胎元命宫身宫
  function calcTaiYuan(bazi, lunar) {
    const sp = {};
    sp[0] = { gan: U.ganZhiAdd(bazi.getMonthGan(), 1), zhi: U.ganZhiAdd(bazi.getMonthZhi(), 3) };
    sp[0].ganzhi = sp[0].gan + sp[0].zhi;
    const zhiArr = '寅卯辰巳午未申酉戌亥子丑'.split('');
    const zhiMap = {}; const zhiIdx = {};
    for (let t = 0; t < zhiArr.length; t++) { zhiMap[t + 1] = zhiArr[t]; zhiIdx[zhiArr[t]] = t + 1; }
    const E = lunar.getPrevQi();
    let qiIdx = LunarUtil.JIE_QI.indexOf(E.getName()) / 2;
    if (0 === qiIdx) qiIdx = 12;
    let j = 26 - qiIdx - parseInt(zhiIdx[bazi.getTimeZhi()]);
    while (j > 12) j -= 12;
    let P = zhiMap[j];
    const startGan = { '甲': '丙', '己': '丙', '乙': '戊', '庚': '戊', '丙': '庚', '辛': '庚', '丁': '壬', '壬': '壬', '戊': '甲', '癸': '甲' };
    let F = U.ganZhiAdd(startGan[bazi.getYearGan()], (U.ganZhiMinus('寅', P) + 12) % 12);
    sp[1] = { gan: F, zhi: P, ganzhi: F + P };
    j = 2 + qiIdx + parseInt(zhiIdx[bazi.getTimeZhi()]);
    while (j > 12) j -= 12;
    let T = zhiMap[j];
    let A = U.ganZhiAdd(startGan[bazi.getYearGan()], (U.ganZhiMinus('寅', T) + 12) % 12);
    sp[2] = { gan: A, zhi: T, ganzhi: A + T };
    return sp;
  }

  // 计算神煞
  function calcShenSha(w) {
    const c = SS;
    const zhu = w.zhu;
    const S = (zhu[1].gan && '甲丙戊庚壬'.indexOf(zhu[1].gan) >= 0) === (1 === w.info.gender);
    for (let t = 0; t <= 9; t++) {
      if ('title' === zhu[t].type) { zhu[t].shenSha = '神煞'; continue; }
      if ('gap' === zhu[t].type) { zhu[t].shenSha = []; continue; }
      zhu[t].shenSha = [];
      let r = c.tianYi[zhu[1].gan], o = c.tianYi[zhu[3].gan];
      let u = r.indexOf(zhu[t].zhi) >= 0, a = o.indexOf(zhu[t].zhi) >= 0;
      if (u && a) zhu[t].shenSha.push('聚贵');
      else if (u) zhu[t].shenSha.push('年贵');
      else if (a) zhu[t].shenSha.push('日贵');
      let s = c.erDe[zhu[2].zhi];
      let f = s.indexOf(zhu[t].gan) >= 0, g = s.indexOf(zhu[t].zhi) >= 0;
      if (f || g) {
        if (s[0] === zhu[t].gan && s[1] === zhu[t].gan) zhu[t].shenSha.push('二德');
        else if (s[0] === zhu[t].gan || s[0] === zhu[t].zhi) zhu[t].shenSha.push('天德');
        else if (s[1] === zhu[t].gan || s[1] === zhu[t].zhi) zhu[t].shenSha.push('月德');
      }
      if (c.tianSheRi[zhu[2].zhi] === zhu[t].ganzhi && t >= 3) zhu[t].shenSha.push('天赦日');
      f = zhu[1].kongWang.indexOf(zhu[t].zhi) >= 0;
      g = zhu[3].kongWang.indexOf(zhu[t].zhi) >= 0;
      if (f && g) zhu[t].shenSha.push('空亡');
      else if (f) zhu[t].shenSha.push('空亡-年');
      else if (g) zhu[t].shenSha.push('空亡-日');
      if (c.kuiGang.indexOf(zhu[t].ganzhi) >= 0) zhu[t].shenSha.push('魁罡');
      if (c.luShen[zhu[3].gan] === zhu[t].zhi) zhu[t].shenSha.push('禄神');
      if (c.yangRen[zhu[3].gan] === zhu[t].zhi) zhu[t].shenSha.push('阳刃');
      if (c.yinRen[zhu[3].gan] === zhu[t].zhi) zhu[t].shenSha.push('阴刃');
      if (c.feiRen[zhu[3].gan] === zhu[t].zhi) zhu[t].shenSha.push('飞刃');
      if (c.jinYu[zhu[3].gan] === zhu[t].zhi) zhu[t].shenSha.push('金舆');
      if (c.wenChang[zhu[1].gan] === zhu[t].zhi) zhu[t].shenSha.push('文昌-年');
      if (c.wenChang[zhu[3].gan] === zhu[t].zhi) zhu[t].shenSha.push('文昌-日');
      let p = '';
      for (let n in c.taoHua) {
        if ((n.indexOf(zhu[1].zhi) >= 0 || n.indexOf(zhu[3].zhi) >= 0) && c.taoHua[n] === zhu[t].zhi) {
          if (n.indexOf(zhu[3].zhi) >= 0 && 1 === t) { p = '倒插桃花'; break; }
          p = '桃花';
        }
      }
      if (p) zhu[t].shenSha.push(p);
      if (c.hongLuan[zhu[1].zhi] === zhu[t].zhi) zhu[t].shenSha.push('红鸾');
      if (c.tianXi[zhu[2].zhi] === zhu[t].zhi) zhu[t].shenSha.push('天喜');
      for (let n in c.guGua) {
        if (n.indexOf(zhu[1].zhi) >= 0) {
          if (c.guGua[n][0] === zhu[t].zhi) zhu[t].shenSha.push('孤辰');
          if (c.guGua[n][1] === zhu[t].zhi) zhu[t].shenSha.push('寡宿');
        }
      }
      if (c.guNuan.indexOf(zhu[t].ganzhi) >= 0) zhu[t].shenSha.push('孤鸾');
      let v = c.baZhuan.indexOf(zhu[t].ganzhi) >= 0;
      let z = c.jiuChou.indexOf(zhu[t].ganzhi) >= 0;
      if (v && z) zhu[t].shenSha.push('八专九丑');
      else if (v) zhu[t].shenSha.push('八专');
      else if (z) zhu[t].shenSha.push('九丑');
      if (c.yinChaYangCuo.indexOf(zhu[t].ganzhi) >= 0) zhu[t].shenSha.push('阴差阳错');
      if ((c.hongYan[zhu[3].gan] === zhu[t].zhi || c.hongYan[zhu[1].gan] === zhu[t].zhi) && t > 0) zhu[t].shenSha.push('红艳');
      if (c.yinYang.indexOf(zhu[t].ganzhi) >= 0) zhu[t].shenSha.push('阴阳');
      let y = c.yiMa[c.sanHe[zhu[1].zhi]];
      let yv = y[zhu[t].zhi];
      if (yv) zhu[t].shenSha.push(yv);
      if ('地煞' === yv) zhu[t].shenSha.push('指背');
      if (c.sangMen[zhu[1].zhi] === zhu[t].zhi) zhu[t].shenSha.push('丧门');
      if (c.diaoKe[zhu[1].zhi] === zhu[t].zhi) zhu[t].shenSha.push('吊客');
      if (c.gouSha[zhu[1].zhi] === zhu[t].zhi) zhu[t].shenSha.push(S ? '勾煞' : '绞煞');
      if (c.jiaoSha[zhu[1].zhi] === zhu[t].zhi) zhu[t].shenSha.push(S ? '绞煞' : '勾煞');
      if (c.baiHu[zhu[1].zhi] === zhu[t].zhi) zhu[t].shenSha.push('白虎');
      if (c.guanFu[zhu[1].zhi] === zhu[t].zhi) zhu[t].shenSha.push('官符');
      if (c.bingFu[zhu[1].zhi] === zhu[t].zhi) zhu[t].shenSha.push('病符');
      if (c.siFu[zhu[1].zhi] === zhu[t].zhi) zhu[t].shenSha.push('死符');
      if (c.daHao[zhu[1].zhi] === zhu[t].zhi) zhu[t].shenSha.push('大耗');
      if (c.zhaiSha[zhu[1].zhi] === zhu[t].zhi) zhu[t].shenSha.push('宅煞');
      if (c.muSha[zhu[1].zhi] === zhu[t].zhi) zhu[t].shenSha.push('墓煞');
      if (c.sanQiu[zhu[2].zhi] === zhu[t].zhi) zhu[t].shenSha.push('三丘');
      if (c.wuMu[zhu[2].zhi] === zhu[t].zhi) zhu[t].shenSha.push('五墓');
      if (c.ziYi[zhu[1].zhi] === zhu[t].zhi) zhu[t].shenSha.push('自缢');
      if ((c.liuXia[zhu[3].gan] === zhu[t].zhi || c.liuXia[zhu[1].gan] === zhu[t].zhi) && t > 0) zhu[t].shenSha.push('流霞');
      if (c.xueTang[zhu[3].gan] === zhu[t].zhi) zhu[t].shenSha.push('学堂');
      if (c.poSui[zhu[1].zhi] && c.poSui[zhu[1].zhi] === zhu[t].zhi) zhu[t].shenSha.push('破碎');
      if (c.jinShen.indexOf(zhu[t].ganzhi) >= 0) zhu[t].shenSha.push('金神');
      if (c.tianKuMap[zhu[1].zhi] === zhu[t].zhi) zhu[t].shenSha.push('天哭');
      if (c.tianYiZhi[zhu[2].zhi] === zhu[t].zhi) zhu[t].shenSha.push('天医');
    }
    const L = '隔角';
    for (let t = 1; t <= 3; t++) {
      for (let n = t + 1; n <= 4; n++) {
        for (let e in c.geJiao) {
          let r = c.geJiao[e];
          if (r.indexOf(zhu[t].zhi) >= 0 && r.indexOf(zhu[n].zhi) >= 0 && zhu[t].zhi !== zhu[n].zhi) {
            if (zhu[t].shenSha.indexOf(L) < 0) zhu[t].shenSha.push(L);
            if (zhu[n].shenSha.indexOf(L) < 0) zhu[n].shenSha.push(L);
          }
        }
      }
    }
  }

  // 流年/流月/大运/童限信息数组
  function getLiuInfoArr(bazi, type, arr) {
    const r = [];
    for (let i = 0; i < arr.length; i++) {
      const o = arr[i], u = {};
      if ('yun' === type) {
        u.age = o.getStartAge();
        u.year = o.getStartYear();
        u.ganzhi = o.getGanZhi() || bazi.getMonthGan() + bazi.getMonthZhi();
        u.isTong = !o.getGanZhi(); // 童限（ganzhi为空）
      } else if ('year' === type) {
        u.age = o.getAge();
        u.year = o.getYear();
        u.ganzhi = o.getGanZhi();
      } else if ('month' === type) {
        u.monthC = o.getMonthInChinese();
        u.ganzhi = o.getGanZhi();
      } else if ('day' === type) {
        u.dayC = o.getDayInChinese();
        // 与黄历（rili.js）口径一致：EightChar.setSect(1) 取日干支
        const dayEc = o.getEightChar();
        dayEc.setSect(1);
        u.ganzhi = dayEc.getDayGan() + dayEc.getDayZhi();
      }
      u.gan = u.ganzhi.substr(0, 1);
      u.zhi = u.ganzhi.substr(1, 1);
      const c = {};
      c.full = lunarShiShen(bazi.getDayGan() + u.gan);
      c.short = U.shiShenShort(c.full);
      c.gan = u.gan;
      c.wuxing = U.wuXingMap(c.gan);
      u.ganShen = [c];
      u.zhiShen = [];
      const hideGan = LunarUtil.ZHI_HIDE_GAN[u.zhi] || [];
      for (let n = 0; n < hideGan.length; n++) {
        const e2 = {};
        e2.full = lunarShiShen(bazi.getDayGan() + hideGan[n]);
        e2.short = U.shiShenShort(e2.full);
        e2.gan = hideGan[n];
        e2.wuxing = U.wuXingMap(e2.gan);
        u.zhiShen.push(e2);
      }
      r.push(u);
    }
    return r;
  }

  // 司权
  function getSiQuan(zhi, days) {    const map = RD.SI_QUAN[zhi] || [];
    for (let e of map) {
      if (days < e[0]) return e[1];
    }
    return '';
  }

  // 农历月中文 → 数字（备用）
  const CN_MONTH_NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12 };
  // 月支 → 节（流月起算节气）
  const ZHI_JIE = { 寅: '立春', 卯: '惊蛰', 辰: '清明', 巳: '立夏', 午: '芒种', 未: '小暑', 申: '立秋', 酉: '白露', 戌: '寒露', 亥: '立冬', 子: '大雪', 丑: '小寒' };

  // 流日起点（流月换节的第一天）：切换流月时用该流月的节，否则用今天所在流月的节
  // 注意 liuNian.getLunar() 是出生年农历，不能用它的节气表；必须按流年（公历）查当年节气。
  // 寅~子月的节落在流年公历年内，丑月（小寒）落在次年年初；且立春可能落在上一个农历年，故跨农历年查找。
  function getLiuDayStartSolar(liuYueZhi, liuNian) {
    try {
      if (liuYueZhi && liuNian) {
        const jieName = ZHI_JIE[liuYueZhi];
        const y = liuNian.getYear();
        const targetYear = ('丑' === liuYueZhi) ? y + 1 : y;
        if (jieName && y >= 1 && y <= 9999) {
          for (let ly = y - 1; ly <= y + 1; ly++) {
            const tbl = Lunar.fromYmd(ly, 1, 1).getJieQiTable();
            const s = tbl[jieName];
            if (s && s.getYear() === targetYear && s.toYmd) {
              return Solar.fromYmd(s.getYear(), s.getMonth(), s.getDay());
            }
          }
        }
      }
    } catch (e) { /* fallthrough */ }
    try {
      return Solar.fromDate(new Date()).getLunar().getPrevJie(true).getSolar();
    } catch (e2) {
      return Solar.fromDate(new Date());
    }
  }

  // 流日数组：从流月换节第一天起 30 天，默认选中换节第一天（index 0）
  function genLiuDayArr(w, startSolar) {
    let _ds0 = startSolar || null;
    if (!_ds0) {
      try { _ds0 = Solar.fromDate(new Date()).getLunar().getPrevJie(true).getSolar(); }
      catch (e) { _ds0 = Solar.fromDate(new Date()); }
    }
    const objs = [];
    for (let dd = 0; dd < 30; dd++) {
      objs.push(_ds0.next(dd).getLunar());
    }
    const bazi = w.info.bazi;
    w.liuD.arr = getLiuInfoArr(bazi, 'day', objs);
    w.sel.st.day = 0;   // 默认选中换节第一天
    w.sel.def.day = 0;
    const _cd = w.liuD.arr[0];
    if (_cd) {
      w.zhu[9].gan = _cd.gan;
      w.zhu[9].zhi = _cd.zhi;
      w.zhu[9].ganzhi = _cd.ganzhi;
    }
  }

  // ============ 排盘数据准备 ============
  function buildData(solar, gender, opt) {
    opt = opt || {};
    const lunar = solar.getLunar();
    const bazi = lunar.getEightChar();
    bazi.setSect(opt.sect || 1);

    const w = {
      info: { solar: solar, lunar: lunar, bazi: bazi, gender: gender },
      now: { lunar: Lunar.fromDate(new Date()) },
      sel: { st: { yun: 1, year: 0, month: 0, day: 0 }, def: null },
      opt: { bPureBaZi: false },
      zhu: [], spzhu: [], yun: { arr: [] }, liuY: { arr: [] }, liuM: { arr: [] }, liuD: { arr: [] }
    };
    w.now.solar = w.now.lunar.getSolar();
    w.now.bazi = w.now.lunar.getEightChar();
    w.now.bazi.setSect(opt.sect || 1);

    // 四柱结构
    const gans = [bazi.getYearGan(), bazi.getMonthGan(), bazi.getDayGan(), bazi.getTimeGan()];
    const zhis = [bazi.getYearZhi(), bazi.getMonthZhi(), bazi.getDayZhi(), bazi.getTimeZhi()];
    const ganShens = [bazi.getYearShiShenGan(), bazi.getMonthShiShenGan(), '日主', bazi.getTimeShiShenGan()];
    const zhiShensList = [bazi.getYearShiShenZhi(), bazi.getMonthShiShenZhi(), bazi.getDayShiShenZhi(), bazi.getTimeShiShenZhi()];
    const hideGansList = [bazi.getYearHideGan(), bazi.getMonthHideGan(), bazi.getDayHideGan(), bazi.getTimeHideGan()];
    const naYins = [bazi.getYearNaYin(), bazi.getMonthNaYin(), bazi.getDayNaYin(), bazi.getTimeNaYin()];

    w.zhu[0] = { type: 'title', title: ({ 0: '坤造', 1: '乾造' })[gender] || '', gan: '天干', zhi: '地支' };
    w.zhu[1] = { type: 'year', title: '年柱', gan: gans[0], zhi: zhis[0] };
    w.zhu[2] = { type: 'month', title: '月柱', gan: gans[1], zhi: zhis[1] };
    w.zhu[3] = { type: 'day', title: '日柱', gan: gans[2], zhi: zhis[2] };
    w.zhu[4] = { type: 'hour', title: '时柱', gan: gans[3], zhi: zhis[3] };
    w.zhu[5] = { type: 'gap', title: '', gan: '', zhi: '' };

    // 大运
    let f = bazi.getYun(gender).getDaYun(11);
    const curYunIdx = (() => {
      for (let n = 0; n < f.length; n++) {
        if (f[n].getStartYear() <= w.now.lunar.getYear() && w.now.lunar.getYear() <= f[n].getEndYear()) return n;
      }
      return 0;
    })();
    w.sel.st.yun = curYunIdx;
    w.sel.def = { yun: curYunIdx };

    // 大运干支（如果是童限显示月柱）
    const dYunGanZhi = f[curYunIdx].getGanZhi() || bazi.getMonthGan() + bazi.getMonthZhi();
    w.zhu[6] = { type: 'yun', title: '大运', gan: dYunGanZhi.substr(0, 1), zhi: dYunGanZhi.substr(1, 1) };

    // 流年（当前大运的流年）
    const curYun = f[curYunIdx];
    const liuNianArr = curYun.getLiuNian();
    let curYearIdx = 0;
    for (let t = 0; t < liuNianArr.length; t++) {
      if (liuNianArr[t].getYear() === w.now.lunar.getYear()) { curYearIdx = t; break; }
    }
    w.sel.st.year = curYearIdx;
    const curLiuNian = liuNianArr[curYearIdx];
    w.zhu[7] = { type: 'liuYear', title: '流年', gan: curLiuNian.getGanZhi().substr(0, 1), zhi: curLiuNian.getGanZhi().substr(1, 1) };
    w.sel.def.year = curYearIdx;

    // 流月（当前流年的流月）
    const liuYueArr = curLiuNian.getLiuYue();
    let curMonthIdx = 0;
    for (let t = 0; t < liuYueArr.length; t++) {
      if (liuYueArr[t].getGanZhi() === bazi.getMonth()) { curMonthIdx = t; break; }
    }
    w.sel.st.month = curMonthIdx;
    w.sel.def.month = curMonthIdx;
    const curLiuYue = liuYueArr[curMonthIdx];
    w.zhu[8] = { type: 'liuMonth', title: '流月', gan: curLiuYue.getGanZhi().substr(0, 1), zhi: curLiuYue.getGanZhi().substr(1, 1) };
    // 流日：从当前流月换节第一天起 30 天，默认选中换节第一天；切换流月时随所选流月变动
    w.zhu[9] = { type: 'liuDay', title: '流日', gan: '', zhi: '' };
    genLiuDayArr(w, getLiuDayStartSolar(curLiuYue.getGanZhi().substr(1, 1), curLiuNian));

    // 胎元命宫身宫
    w.spzhu = calcTaiYuan(bazi, lunar);

    for (let t = 0; t <= 9; t++) {
      if (w.zhu[t].gan && w.zhu[t].zhi) w.zhu[t].ganzhi = w.zhu[t].gan + w.zhu[t].zhi;
      if ('title' === w.zhu[t].type) w.zhu[t].ganShen = '干神';
      else if ('gap' === w.zhu[t].type) w.zhu[t].ganShen = '';
      else if ('day' === w.zhu[t].type) w.zhu[t].ganShen = (1 === gender ? '男' : (0 === gender ? '女' : '日主'));
      else {
        const n = lunarShiShen(bazi.getDayGan() + w.zhu[t].gan);
        w.zhu[t].ganShen = [{ full: n, short: U.shiShenShort(n), gan: w.zhu[t].gan, wuxing: U.wuXingMap(w.zhu[t].gan) }];
      }
    }
    for (let t = 0; t <= 9; t++) {
      if ('title' === w.zhu[t].type) w.zhu[t].zhiShen = '藏气';
      else if ('gap' === w.zhu[t].type) w.zhu[t].zhiShen = '';
      else {
        const hideGan = LunarUtil.ZHI_HIDE_GAN[w.zhu[t].zhi] || [];
        w.zhu[t].zhiShen = hideGan.map(function (gan) {
          const n = lunarShiShen(bazi.getDayGan() + gan);
          return { full: n, short: U.shiShenShort(n), gan: gan, wuxing: U.wuXingMap(w.zhu[t].gan) };
        });
      }
    }
    for (let t = 0; t <= 9; t++) {
      if ('title' === w.zhu[t].type) w.zhu[t].naYin = '<a class="text_a" target="_blank" href="./baziHelp.html#naYin">纳音</a>';
      else if ('gap' === w.zhu[t].type) w.zhu[t].naYin = '';
      else {
        w.zhu[t].naYin = LunarUtil.NAYIN[w.zhu[t].gan + w.zhu[t].zhi] || '';
        w.zhu[t].nyWX = w.zhu[t].naYin.substr(-1);
      }
    }
    for (let t = 0; t <= 9; t++) {
      if ('title' === w.zhu[t].type) w.zhu[t].wangShuai = '<a class="text_a" target="_blank" href="./baziHelp.html#changSheng">长生</a>';
      else if ('gap' === w.zhu[t].type) w.zhu[t].wangShuai = '';
      else w.zhu[t].wangShuai = U.changShengColor(bazi.getDayGan() + w.zhu[t].zhi);
    }
    for (let t = 0; t <= 9; t++) {
      if ('title' === w.zhu[t].type) w.zhu[t].ziZuo = '<a class="text_a" target="_blank" href="./baziHelp.html#changSheng">自坐</a>';
      else if ('gap' === w.zhu[t].type) w.zhu[t].ziZuo = '';
      else w.zhu[t].ziZuo = U.changShengColor(w.zhu[t].gan + w.zhu[t].zhi);
    }
    for (let t = 0; t <= 9; t++) {
      if ('title' === w.zhu[t].type) w.zhu[t].kongWang = '<a class="text_a" target="_blank" href="./baziHelp.html#kongWang">空亡</a>';
      else if ('gap' === w.zhu[t].type) w.zhu[t].kongWang = '';
      else w.zhu[t].kongWang = U.xunKong(w.zhu[t].gan + w.zhu[t].zhi);
    }

    calcShenSha(w);

    // 排盘数组
    w.yun.arr = getLiuInfoArr(bazi, 'yun', f);
    const t2 = f[w.sel.st.yun];
    const n2 = t2.getLiuNian();
    w.liuY.arr = getLiuInfoArr(bazi, 'year', n2);
    const n3 = n2[w.sel.st.year].getLiuYue();
    w.liuM.arr = getLiuInfoArr(bazi, 'month', n3);

    return w;
  }

  // ============ 渲染 ============
  function renderPan(w) {
    const Y = w;
    const n = Y.info.gender;
    let i = '';

    // 出生信息
    i += '<div class="div_table table_birth">';
    i += '<div class="dtr birthinfo"><div class="col col0">出生</div>';
    const solar = Y.info.solar, lunar = Y.info.lunar;
    i += '<div class="col left">' + solar.getYear() + '年' + solar.getMonth() + '月' + solar.getDay() + '日(' + lunar.getMonthInChinese() + '月' + lunar.getDayInChinese() + ')' + U.pad(solar.getHour()) + ':' + U.pad(solar.getMinute()) + ' 星期' + solar.getWeekInChinese() + '</div></div></div>';

    // 节气
    const prevJie = lunar.getPrevJie();
    const prevSolar = prevJie.getSolar();
    const r = solar.getJulianDay() - prevSolar.getJulianDay();
    const o = getSiQuan(lunar.getMonthZhi(), r);
    i += '<div class="div_table table_jieqi"><div class="dtr jieqi"><div class="col col0">节气：</div>';
    i += '<div class="col left">' + prevJie.getName() + '：' + prevSolar.getMonth() + '月' + prevSolar.getDay() + '日' + U.pad(prevSolar.getHour()) + ':' + U.pad(prevSolar.getMinute()) + '；';
    const nextJie = lunar.getNextJie();
    const nextSolar = nextJie.getSolar();
    i += nextJie.getName() + '：' + nextSolar.getMonth() + '月' + nextSolar.getDay() + '日' + U.pad(nextSolar.getHour()) + ':' + U.pad(nextSolar.getMinute()) + '；';
    i += '司权：<span class="jsInfo" infoType="siQuan">' + U.wuXingColor(o, 'b') + '（' + r.toFixed(2) + '）</span></div></div></div>';

    // 宫位
    i += '<div class="dtr birthinfo"><div class="col col0">宫位</div><div class="col left poi taiMingShen">胎元：' + U.wuXingColor(Y.spzhu[0].ganzhi, 'b') + '；命宫：' + U.wuXingColor(Y.spzhu[1].ganzhi, 'b') + '；身宫：' + U.wuXingColor(Y.spzhu[2].ganzhi, 'b') + '</div></div></div>';

    // 四柱表
    let u = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // 默认不含流日（原网站点击流日后才显示）
    i += '<div class="div_table table_bazi"><div class="div_table bazipan_up">';

    // 标题行
    i += '<div class="dtr title">';
    for (let e of u) {
      const t = Y.zhu[e];
      let nn = t.title;
      if ('title' === t.type) nn = U.wuXingColor(nn);
      let a = 'col colItem col' + e;
      if (3 === e) a += ' jsInfo';
      i += '<div class="' + a + '">' + nn + '</div>';
    }
    i += '</div>';

    // 干神行
    i += '<div class="dtr dtrGanshen">';
    for (let e of u) {
      let t, nn = 'col colItem col' + e + ' small';
      if ('day' === Y.zhu[e].type) { t = U.wuXingColor(Y.zhu[e].ganShen); nn += ' ganshen riganshen'; }
      else if ('title' === Y.zhu[e].type || 'gap' === Y.zhu[e].type) t = Y.zhu[e].ganShen;
      else t = Y.zhu[e].ganShen[0].short;
      i += '<div class="' + nn + '" gan="' + Y.zhu[e].gan + '">' + t + '</div>';
    }
    i += '</div>';

    // 天干行
    i += '<div class="dtr tiangan">';
    for (let e of u) {
      let t = 'col colItem col' + e;
      const isCol = Y.zhu[e].type;
      if ('title' === isCol) { t += ' small center-center jsCopy'; i += '<div class="' + t + '" copyType="bazi">' + U.wuXingColor(Y.zhu[e].gan) + '</div>'; }
      else if (1 === e) { t += ' bazi jsInfo gantext'; i += '<div class="' + t + '" infoType="niangan">' + U.wuXingColor(Y.zhu[e].gan) + '</div>'; }
      else if (2 === e) { t += ' bazi jsInfo gantext'; i += '<div class="' + t + '" infoType="yuegan">' + U.wuXingColor(Y.zhu[e].gan) + '</div>'; }
      else if (3 === e) { t += ' bazi jsInfo gantext'; i += '<div class="' + t + '" infoType="rigan">' + U.wuXingColor(Y.zhu[e].gan) + '</div>'; }
      else if (4 === e) { t += ' bazi jsInfo gantext'; i += '<div class="' + t + '" infoType="shigan">' + U.wuXingColor(Y.zhu[e].gan) + '</div>'; }
      else if (6 === e) { t += ' bazi jsInfo gantext'; i += '<div class="' + t + '" infoType="yungan">' + U.wuXingColor(Y.zhu[e].gan) + '</div>'; }
      else { t += ' bazi gantext'; i += '<div class="' + t + '">' + U.wuXingColor(Y.zhu[e].gan) + '</div>'; }
    }
    i += '</div>';

    // 地支行
    i += '<div class="dtr dizhi">';
    for (let e of u) {
      let t = 'col colItem col' + e;
      if ('title' === Y.zhu[e].type) { t += ' small center-center jsCopy'; i += '<div class="' + t + '" copyType="zeRi">' + U.wuXingColor(Y.zhu[e].zhi) + '</div>'; }
      else if (1 === e) { t += ' bazi jsInfo'; i += '<div class="' + t + '" infoType="nianzhi">' + U.wuXingColor(Y.zhu[e].zhi) + '</div>'; }
      else if (2 === e) { t += ' bazi jsInfo'; i += '<div class="' + t + '" infoType="yuezhi">' + U.wuXingColor(Y.zhu[e].zhi) + '</div>'; }
      else if (3 === e) { t += ' bazi jsInfo'; i += '<div class="' + t + '" infoType="rizhi">' + U.wuXingColor(Y.zhu[e].zhi) + '</div>'; }
      else if (4 === e) { t += ' bazi jsInfo'; i += '<div class="' + t + '" infoType="shizhi">' + U.wuXingColor(Y.zhu[e].zhi) + '</div>'; }
      else { t += ' bazi'; i += '<div class="' + t + '">' + U.wuXingColor(Y.zhu[e].zhi) + '</div>'; }
    }
    i += '</div>';

    // 藏干行
    i += '<div class="dtr cangGan">';
    for (let e of u) {
      let t = 'col colItem col' + e + ' small', a = '';
      if ('title' === Y.zhu[e].type) { t += ' center-center'; a = Y.zhu[e].zhiShen; }
      else if ('gap' === Y.zhu[e].type) a = Y.zhu[e].zhiShen;
      else {
        a = Y.zhu[e].zhiShen.map(function (e2) {
          return '<div class="unit"><span class="gantext">' + U.wuXingColor(e2.gan, 'span') + '</span> <span class="ganshen">' + e2.short + '</span></div>';
        }).join('');
      }
      i += '<div class="' + t + '">' + a + '</div>';
    }
    i += '</div>';

    // 纳音行
    i += '<div class="dtr nayin">';
    for (let e of u) i += '<div class="col colItem col' + e + ' small">' + Y.zhu[e].naYin + '</div>';
    i += '</div>';

    // 旺衰行
    i += '<div class="dtr wangshuai">';
    for (let e of u) i += '<div class="col colItem col' + e + ' small">' + Y.zhu[e].wangShuai + '</div>';
    i += '</div>';

    // 自坐行
    i += '<div class="dtr zizuo">';
    for (let e of u) i += '<div class="col colItem col' + e + ' small">' + Y.zhu[e].ziZuo + '</div>';
    i += '</div>';

    // 空亡行
    i += '<div class="dtr kongwang">';
    for (let e of u) i += '<div class="col colItem col' + e + ' small">' + Y.zhu[e].kongWang + '</div>';
    i += '</div>';

    // 神煞行
    i += '<div class="dtr shensha">';
    for (let e of u) {
      let nn = 'col colItem col' + e;
      if (u.length <= 5) nn += ' pure';
      let r2 = '';
      if ('title' === Y.zhu[e].type) { nn += ' small center-center'; r2 = Y.zhu[e].shenSha; }
      else {
        nn += ' tiny';
        r2 = Y.zhu[e].shenSha.map(function (e2) {
          return '<div class="shensha-item">' + e2 + '</div>';
        }).join('');
      }
      i += '<div class="' + nn + '">' + r2 + '</div>';
    }
    i += '</div>';

    i += '</div>'; // bazipan_up

    // 大运流年区
    i += '<div class="div_table bazipan_down">';
    // 起运时间
    const startSolar = Y.info.bazi.getYun(Y.info.gender).getStartSolar();
    i += '<div class="dtrGap small bgray yunGap"><div class="tc">起运：' + startSolar.getYear() + '年' + startSolar.getMonth() + '月' + startSolar.getDay() + '日</div></div>';
    // 大运
    i += '<div class="dtr yunRow">';
    for (let e in Y.yun.arr) {
      const t = Y.yun.arr[e];
      const cur = parseInt(e) === Y.sel.st.yun;
      const a = cur ? ' current' : '';
      let gDisplay, zDisplay;
      if (t.isTong) {
        gDisplay = '童'; zDisplay = '限';
      } else {
        gDisplay = t.gan; zDisplay = t.zhi;
      }
      const c = t.ganShen[0].short;
      const d = t.zhiShen.length > 0 ? t.zhiShen[0].short : '';
      i += '<div class="yunCol small' + a + '" type="yun" ind="' + e + '">';
      i += '<div class="unit">' + String(t.year).padStart(4, '0') + '</div>';
      i += '<div class="unit">' + t.age + (t.age < 100 ? '岁' : '') + '</div>';
      i += '<div class="unit ganzhi gantext">' + U.wuXingColor(gDisplay) + '<span class="tiny ganshen">' + c + '</span></div>';
      i += '<div class="unit ganzhi">' + U.wuXingColor(zDisplay) + '<span class="tiny ganshen">' + d + '</span></div>';
      i += '</div>';
    }
    i += '</div>';

    // 流年
    i += '<div class="dtrGap small bgray yearGap"><div class="tc">流年（虚岁）</div></div>';
    i += '<div class="dtr yearRow">';
    for (let e in Y.liuY.arr) {
      const t = Y.liuY.arr[e];
      const cur = parseInt(e) === Y.sel.st.year;
      const a = cur ? ' current' : '';
      let extraCls = '';
      if (4 === parseInt(e)) extraCls = ' year5';
      const c = t.ganShen[0].short;
      const d = t.zhiShen.length > 0 ? t.zhiShen[0].short : '';
      i += '<div class="yunCol small' + a + extraCls + '" type="year" ind="' + e + '">';
      i += '<div class="unit">' + String(t.year).padStart(4, '0') + '</div>';
      i += '<div class="unit">' + t.age + (t.age < 100 ? '岁' : '') + '</div>';
      i += '<div class="unit ganzhi gantext">' + U.wuXingColor(t.gan) + '<span class="tiny ganshen">' + c + '</span></div>';
      i += '<div class="unit ganzhi">' + U.wuXingColor(t.zhi) + '<span class="tiny ganshen">' + d + '</span></div>';
      i += '</div>';
    }
    i += '</div>';

    // 流月
    i += '<div class="dtrGap small bgray monthGap"><div class="tc">流月</div></div>';
    i += '<div class="dtr monthRow">';
    for (let e in Y.liuM.arr) {
      const t = Y.liuM.arr[e];
      const cur = parseInt(e) === Y.sel.st.month;
      const a = cur ? ' current' : '';
      const c = t.ganShen[0].short;
      const d = t.zhiShen.length > 0 ? t.zhiShen[0].short : '';
      i += '<div class="yunCol small' + a + '" type="month" ind="' + e + '">';
      i += '<div class="unit">' + (t.monthC || '') + '</div>';
      i += '<div class="unit ganzhi gantext">' + U.wuXingColor(t.gan) + '<span class="tiny ganshen">' + c + '</span></div>';
      i += '<div class="unit ganzhi">' + U.wuXingColor(t.zhi) + '<span class="tiny ganshen">' + d + '</span></div>';
      i += '</div>';
    }
    i += '</div>';

    // 流日（流月换节第一天起，可点击切换）
    i += '<div class="dtrGap small bgray dayGap"><div class="tc">流日（换节起）</div></div>';
    i += '<div class="dtr dayRow">';
    for (let ed in Y.liuD.arr) {
      const td = Y.liuD.arr[ed];
      const curd = parseInt(ed) === Y.sel.st.day;
      const ad = curd ? ' current' : '';
      const cd = td.ganShen[0].short;
      const dd = td.zhiShen.length > 0 ? td.zhiShen[0].short : '';
      i += '<div class="yunCol small' + ad + '" type="day" ind="' + ed + '">';
      i += '<div class="unit">' + (td.dayC || '') + '</div>';
      i += '<div class="unit ganzhi gantext">' + U.wuXingColor(td.gan) + '<span class="tiny ganshen">' + cd + '</span></div>';
      i += '<div class="unit ganzhi">' + U.wuXingColor(td.zhi) + '<span class="tiny ganshen">' + dd + '</span></div>';
      i += '</div>';
    }
    i += '</div>';

    i += '</div>'; // bazipan_down
    i += '</div>'; // table_bazi

    return i;
  }

  // ============ 输入解析 ============
  function parseInput(v) {
    // 先捕获原始输入（sloppy 模式下 arguments 与 v 别名绑定，v 被替换后 arguments[0] 也变，故须先存 raw）
    const raw = String(v || '').trim();
    v = raw;
    // 八字反推：支持多种格式
    // 男：庚辰 丁亥 癸巳 甲寅
    // 女/坤造：壬寅 丁未 丙戌 丙申
    // 乾：壬寅，丁未，丙戌，丙申
    // 坤造 壬寅 丁未 丙戌 丙申
    // 直接四柱（默认男）：壬寅 丁未 丙戌 丙申
    const baZiMatch = v.match(/^(男|女|乾|坤|乾造|坤造)[:：\s]*(.*?)$/);
    if (baZiMatch) {
      const g = (baZiMatch[1] === '男' || baZiMatch[1] === '乾' || baZiMatch[1] === '乾造') ? 1 : 0;
      const rest = baZiMatch[2].replace(/[，,、\s]+/g, ' ').trim();
      const m = rest.match(/([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])/g);
      if (m && m.length >= 4) {
        try {
          // sect: 1=晚子时算明天，2=不算（默认1）
          const list = Solar.fromBaZi(m[0], m[1], m[2], m[3], 1, 1820);
          if (list && list.length > 0) {
            return { solar: list[0], gender: g, isLunar: false, baZiSource: m.slice(0, 4), baZiCount: list.length };
          }
        } catch (e) {}
      }
      return null; // 有性别标记但四柱解析失败
    }
    // 也支持无性别前缀的四柱输入（默认男）
    const noPrefixMatch = v.match(/([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])/g);
    if (noPrefixMatch && noPrefixMatch.length >= 4 && /[甲乙丙丁戊己庚辛壬癸]/.test(v)) {
      try {
        const list = Solar.fromBaZi(noPrefixMatch[0], noPrefixMatch[1], noPrefixMatch[2], noPrefixMatch[3], 1, 1820);
        if (list && list.length > 0) {
          return { solar: list[0], gender: 1, isLunar: false, baZiSource: noPrefixMatch.slice(0, 4), baZiCount: list.length };
        }
      } catch (e) {}
    }
    v = v.replace(/[^\d]/g, '');
    if (v.length < 4) return null;
    const year = parseInt(v.substr(0, 4), 10);
    const month = v.length >= 6 ? parseInt(v.substr(4, 2), 10) : 6;
    const day = v.length >= 8 ? parseInt(v.substr(6, 2), 10) : 1;
    const hour = v.length >= 10 ? parseInt(v.substr(8, 2), 10) : 12;
    const minute = v.length >= 12 ? parseInt(v.substr(10, 2), 10) : 0;
    if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23) return null;
    let gender = 1;
    if (/\+$/.test(raw)) gender = 1;
    if (/-$/.test(raw)) gender = 0;
    try {
      return { solar: Solar.fromYmdHms(year, month, day, hour, minute, 0), gender: gender, isLunar: false };
    } catch (e) {
      return null;
    }
  }

  // 八字反推：弹出对话框让用户输入四柱
  function fanTuiInput() {
    const html = `
      <div class="ft-dialog" id="ft-dialog">
        <div class="ft-mask"></div>
        <div class="ft-box">
          <div class="ft-title">八字反推
            <span class="ft-close">×</span>
          </div>
          <div class="ft-body">
            <p class="ft-tip">输入四柱（空格或逗号分隔），可选男/女/乾/坤前缀（默认男）</p>
            <textarea id="ft-text" placeholder="例：男：庚辰 丁亥 癸巳 甲寅&#10;或：乾 壬寅 丁未 丙戌 丙申&#10;或：庚辰丁亥癸巳甲寅" class="ft-textarea"></textarea>
            <div class="ft-presets">
              <span class="ft-preset" data-v="壬寅 丁未 丙戌 丙申">试例 1</span>
              <span class="ft-preset" data-v="庚辰 丁亥 癸巳 甲寅">试例 2</span>
              <span class="ft-preset" data-v="甲子 丙寅 辛酉 癸巳">试例 3</span>
            </div>
          </div>
          <div class="ft-foot">
            <button class="ft-cancel">取消</button>
            <button class="ft-ok">反推排盘</button>
          </div>
        </div>
      </div>
    `;
    $('#ft-dialog').remove();
    $('body').append(html);
    $('#ft-dialog').on('click', '.ft-mask, .ft-close, .ft-cancel', function() {
      $('#ft-dialog').remove();
    });
    $('#ft-dialog').on('click', '.ft-preset', function() {
      $('#ft-text').val($(this).data('v'));
    });
    $('#ft-dialog').on('click', '.ft-ok', function() {
      const v = $('#ft-text').val().trim();
      if (!v) { alert('请输入四柱'); return; }
      $('#ft-dialog').remove();
      $('#input').text(v);
      render(v);
    });
    $('#ft-text').focus();
  }

  // 主渲染
  let _w = null;
  // 窄屏下把各行的当前列滚动到可视区中央
  function scrollYunToCurrent() {
    if (window.innerWidth > 600) return;
    setTimeout(function () {
      const rows = document.querySelectorAll('#pan .yunRow, #pan .yearRow, #pan .monthRow, #pan .dayRow');
      rows.forEach(function (row) {
        const cur = row.querySelector('.yunCol.current');
        if (cur) row.scrollLeft = cur.offsetLeft - (row.clientWidth - cur.clientWidth) / 2;
      });
    }, 0);
  }

  // 按输入框末尾符号同步性别单选框
  function syncGenderRadio() {
    const t = $('#input').text();
    if (/-$/.test(t)) $('#gender_woman').prop('checked', true);
    else if (/\+\s*$/.test(t)) $('#gender_man').prop('checked', true);
  }

  function render(vStr) {
    const parsed = parseInput(vStr);
    if (!parsed) {
      $('#pan').html('<div class="tip"><p>录入一段日期信息到框中，如200012010322+代表2000年12月1日3点22分生男。<a target="_blank" href="./baziHelp.html">使用说明</a></p></div>');
      return;
    }
    const sect = $('#sect').prop('checked') ? 2 : 1;
    const w = buildData(parsed.solar, parsed.gender, { sect: sect });
    _w = w;
    $('#pan').html(renderPan(w));
    bindPanClick();
    scrollYunToCurrent();
  }

  // 绑定大运/流年/流月点击
  function bindPanClick() {
    $('#pan').off('click.yun', '.yunCol').on('click.yun', '.yunCol', function () {
      const type = $(this).attr('type');
      const ind = parseInt($(this).attr('ind'));
      if (type === 'yun') {
        // 童限（ind=0）不能切换流年
        _w.sel.st.yun = ind;
        _w.sel.def.yun = ind;
        _w.sel.st.year = 0;
        _w.sel.def.year = 0;
        _w.sel.st.month = 0;
        _w.sel.def.month = 0;
        // 重新计算大运流年流月
        const bazi = _w.info.bazi;
        const gender = _w.info.gender;
        const f = bazi.getYun(gender).getDaYun(11);
            const t2 = f[ind];
        const n2 = t2.getLiuNian();
        _w.yun.arr = getLiuInfoArr(bazi, 'yun', f);
        _w.liuY.arr = getLiuInfoArr(bazi, 'year', n2);
        // 流月：取第一个流年的流月（童限或大运1 都用第一个流年）
        if (n2.length > 0) {
          _w.liuM.arr = getLiuInfoArr(bazi, 'month', n2[0].getLiuYue());
          // 重置流日（回到今天农历月初一）
          genLiuDayArr(_w, getLiuDayStartSolar(null, null));
        }
        // 更新大运干支
        const dYunGanZhi = t2.getGanZhi() || bazi.getMonthGan() + bazi.getMonthZhi();
        _w.zhu[6].gan = dYunGanZhi.substr(0, 1);
        _w.zhu[6].zhi = dYunGanZhi.substr(1, 1);
        _w.zhu[6].ganzhi = dYunGanZhi;
        if (n2.length > 0) {
          const liuNian = n2[0];
          _w.zhu[7].gan = liuNian.getGanZhi().substr(0, 1);
          _w.zhu[7].zhi = liuNian.getGanZhi().substr(1, 1);
          _w.zhu[7].ganzhi = liuNian.getGanZhi();
          const liuYue = liuNian.getLiuYue()[0];
          _w.zhu[8].gan = liuYue.getGanZhi().substr(0, 1);
          _w.zhu[8].zhi = liuYue.getGanZhi().substr(1, 1);
        }
        // 重新计算神煞（流年神煞变化）
        calcShenSha(_w);
        // 重新渲染
        $('#pan').html(renderPan(_w));
        bindPanClick();
        scrollYunToCurrent();
      } else if (type === 'year') {
        _w.sel.st.year = ind;
        _w.sel.def.year = ind;
        const bazi = _w.info.bazi;
        const gender = _w.info.gender;
        const f = bazi.getYun(gender).getDaYun(11);
            const t2 = f[_w.sel.st.yun];
        const n2 = t2.getLiuNian();
        _w.liuY.arr = getLiuInfoArr(bazi, 'year', n2);
        _w.liuM.arr = getLiuInfoArr(bazi, 'month', n2[ind].getLiuYue());
        const liuNian = n2[ind];
        _w.zhu[7].gan = liuNian.getGanZhi().substr(0, 1);
        _w.zhu[7].zhi = liuNian.getGanZhi().substr(1, 1);
        _w.zhu[7].ganzhi = liuNian.getGanZhi();
        const liuYue = liuNian.getLiuYue()[0];
        _w.zhu[8].gan = liuYue.getGanZhi().substr(0, 1);        _w.zhu[8].zhi = liuYue.getGanZhi().substr(1, 1);
        // 重置流日（回到今天农历月初一）
        genLiuDayArr(_w, getLiuDayStartSolar(null, null));
        calcShenSha(_w);
        $('#pan').html(renderPan(_w));
        bindPanClick();
        scrollYunToCurrent();
      } else if (type === 'month') {
        _w.sel.st.month = ind;
        const bazi = _w.info.bazi;
        const gender = _w.info.gender;
        const f = bazi.getYun(gender).getDaYun(11);
            const t2 = f[_w.sel.st.yun];
        const n2 = t2.getLiuNian();
        const liuNian = n2[_w.sel.st.year];
        _w.liuM.arr = getLiuInfoArr(bazi, 'month', liuNian.getLiuYue());
        const liuYue = liuNian.getLiuYue()[ind];
        _w.zhu[8].gan = liuYue.getGanZhi().substr(0, 1);
        _w.zhu[8].zhi = liuYue.getGanZhi().substr(1, 1);
        // 流日随所选流月变动：该流月对应农历月初一起 30 天，默认选中初一
        genLiuDayArr(_w, getLiuDayStartSolar(liuYue.getGanZhi().substr(1, 1), liuNian));
        $('#pan').html(renderPan(_w));
        bindPanClick();
        scrollYunToCurrent();
      } else if (type === 'day') {
        _w.sel.st.day = ind;
        _w.sel.def.day = ind;
        const _td = _w.liuD.arr[ind];
        if (_td) {
          _w.zhu[9].gan = _td.gan;
          _w.zhu[9].zhi = _td.zhi;
          _w.zhu[9].ganzhi = _td.ganzhi;
        }
        $('#pan').html(renderPan(_w));
        bindPanClick();
        scrollYunToCurrent();
      }
    });

    // 点击日干/日支切换上下一天
    $('#pan').off('click.day', '[infoType="rigan"],[infoType="rizhi"]').on('click.day', '[infoType="rigan"],[infoType="rizhi"]', function () {
      const type = $(this).attr('infoType');
      const cur = _w.info.solar;
      const d = type === 'rigan' ? -1 : 1;
      const newDate = new Date(cur.getYear(), cur.getMonth() - 1, cur.getDay() + d, cur.getHour(), cur.getMinute());
      const genderStr = $('#gender_man').prop('checked') ? '+' : '-';
      const v = newDate.getFullYear() + U.pad(newDate.getMonth() + 1) + U.pad(newDate.getDate()) + U.pad(newDate.getHours()) + U.pad(newDate.getMinutes()) + genderStr;
      $('#input').html(v);
      render(v);
    });

    // 点击时干/时支切换上下时辰
    $('#pan').off('click.hour', '[infoType="shigan"],[infoType="shizhi"]').on('click.hour', '[infoType="shigan"],[infoType="shizhi"]', function () {
      const cur = _w.info.solar;
      const d = $(this).attr('infoType') === 'shigan' ? -2 : 2;
      let newH = cur.getHour() + d;
      if (newH < 0) newH += 24;
      if (newH >= 24) newH -= 24;
      const genderStr = $('#gender_man').prop('checked') ? '+' : '-';
      const v = cur.getYear() + U.pad(cur.getMonth()) + U.pad(cur.getDay()) + U.pad(newH) + U.pad(cur.getMinute()) + genderStr;
      $('#input').html(v);
      render(v);
    });

    // 点击年干/年支、月干/月支
    $('#pan').off('click.year', '[infoType="niangan"],[infoType="nianzhi"]').on('click.year', '[infoType="niangan"],[infoType="nianzhi"]', function () {
      const cur = _w.info.solar;
      const d = $(this).attr('infoType') === 'niangan' || $(this).attr('infoType') === 'nianzhi' ? (($(this).attr('infoType').endsWith('gan')) ? -1 : 1) : 0;
      // 年切换
      const newY = cur.getYear() + d;
      const genderStr = $('#gender_man').prop('checked') ? '+' : '-';
      const v = newY + U.pad(cur.getMonth()) + U.pad(cur.getDay()) + U.pad(cur.getHour()) + U.pad(cur.getMinute()) + genderStr;
      $('#input').html(v);
      render(v);
    });
    $('#pan').off('click.month', '[infoType="yuegan"],[infoType="yuezhi"]').on('click.month', '[infoType="yuegan"],[infoType="yuezhi"]', function () {
      const cur = _w.info.solar;
      const d = $(this).attr('infoType') === 'yuegan' ? -1 : 1;
      const newM = cur.getMonth() + d;
      let newY = cur.getYear();
      if (newM < 1) { newY -= 1; }
      if (newM > 12) { newY += 1; }
      const genderStr = $('#gender_man').prop('checked') ? '+' : '-';
      const v = newY + U.pad(((newM - 1) % 12 + 12) % 12 + 1) + U.pad(cur.getDay()) + U.pad(cur.getHour()) + U.pad(cur.getMinute()) + genderStr;
      $('#input').html(v);
      render(v);
    });
  }

  // ============ 初始化 ============
  $(function () {
    const params = new URLSearchParams(location.search);
    let v = params.get('v');
    if (!v) {
      const now = Solar.fromDate(new Date());
      v = now.toYmdHms().replace(/[- :]/gim, '').substr(0, 12);
    }
    // 性别：URL gender 参数优先，其次识别 v 末尾的 +/- 符号
    const gParam = params.get('gender');
    const vSign = String(v).match(/[-+]$/);
    if (gParam) {
      $('#gender_' + (gParam === '0' ? 'woman' : 'man')).prop('checked', true);
    } else if (vSign) {
      $('#gender_' + (vSign[0] === '-' ? 'woman' : 'man')).prop('checked', true);
    }
    const suffix = $('#gender_man').prop('checked') ? '+' : '-';
    const numericV = String(v).replace(/[^\d]/g, '');
    // 防御：渲染异常不应阻断后续事件绑定（导航等）
    try {
      if (numericV.length >= 4) {
        $('#input').html(numericV + suffix);
        render(numericV + suffix);
      } else {
        $('#input').html(v);
        render(v);
      }
    } catch (err) {
      $('#pan').html('<div class="tip"><p>排盘失败：' + (err && err.message ? err.message : err) + '</p></div>');
    }

    // 输入框变化
    $('#input').on('input', function () {
      syncGenderRadio();
      render($(this).text());
    });
    $('#input').on('keypress', function (e) {
      if (13 === e.which) { e.preventDefault(); syncGenderRadio(); render($(this).text()); }
    });

    // 八字反推
    $('.fanTui, [class*=fanTui]').on('click', function (e) {
      e.preventDefault();
      fanTuiInput();
    });

    // 此刻
    $('.nowBazi').on('click', function () {
      const now = Solar.fromDate(new Date());
      const v2 = now.toYmdHms().replace(/[- :]/gim, '').substr(0, 12);
      const g = $('#gender_man').prop('checked') ? '+' : '-';
      $('#input').html(v2 + g);
      render(v2 + g);
    });

    // 性别（数字日期：更新符号后重排；四柱：解析时按乾坤前缀定性别）
    $('input[name=gender]').on('change', function () {
      const g = $('#gender_man').prop('checked') ? '+' : '-';
      const cur = $('#input').text();
      const numeric = cur.replace(/[^\d]/g, '');
      if (numeric.length >= 4) {
        $('#input').html(numeric + g);
        render(numeric + g);
      } else {
        render(cur);
      }
    });

    // 晚子时
    $('#sect').on('change', function () {
      render($('#input').text());
    });

    // 黄历跳转（同页跳转，避免弹窗拦截）
    $('.riliAnchor').on('click', function (e) {
      e.preventDefault();
      const v2 = String($('#input').text()).replace(/[^\d]/g, '');
      if (v2.length >= 12) {
        location.href = 'rili.html?v=' + v2;
      } else {
        location.href = 'rili.html';
      }
    });

    // 斗数跳转（紫微，同页跳转，携带八字当前日期；数字日期与四柱输入均可解析）
    $('.doushuAnchor').on('click', function (e) {
      e.preventDefault();
      const parsed = parseInput($('#input').text());
      const gender = $('#gender_man').prop('checked') ? 1 : 0;
      if (parsed && parsed.solar) {
        const v2 = parsed.solar.toYmdHms().replace(/[- :]/gim, '').substr(0, 12);
        location.href = 'doushu.html?v=' + v2 + '&gender=' + gender;
      } else {
        location.href = 'doushu.html';
      }
    });

    // 金口诀锚点（跳转到独立页面）
    $('.jkjAnchor').on('click', function (e) {
      const $a = $(this);
      const href = $a.attr('href') || '';
      if (href && href !== '#' && !href.startsWith('#')) {
        // 跳转到独立页面（带当前时间）
        e.preventDefault();
        const v2 = String($('#input').text()).replace(/[^\d]/g, '');
        const gender = $('#gender_man').prop('checked') ? 1 : 0;
        const sep = href.indexOf('?') >= 0 ? '&' : '?';
        const url = href + sep + 'v=' + v2 + '&gender=' + gender;
        window.location.href = url;
      }
    });

    // 复制排盘 / 自动分析 / AI 分析
    $('#bz-copy-btn').on('click', function () { if (_w) clipCopy(bzCopy(), this); });
    $('#bz-auto-btn').on('click', function () { toggleBzAuto(); });
    $('#bz-ai-btn').on('click', function () { if (_w) clipCopy(bzAI(), this); });
  });

  // ============ 复制排盘 / AI 分析 ============
  function clipCopy(text, btn) {
    function ok() { if (btn) { const o = btn.textContent; btn.textContent = '已复制✓'; setTimeout(function () { btn.textContent = o; }, 1200); } }
    function fb() {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) {}
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok).catch(fb);
    else fb();
  }
  function bzBirth() {
    const s = _w.info.solar, lunar = s.getLunar();
    return '北京时间' + s.getYear() + '年' + s.getMonth() + '月' + s.getDay() + '日 ' + U.pad(s.getHour()) + ':' + U.pad(s.getMinute()) + '（农历' + lunar.getMonthInChinese() + '月' + lunar.getDayInChinese() + '）（' + (_w.info.gender === 1 ? '男' : '女') + '）';
  }
  function bzYun() {
    var list = _w.yun.arr.filter(function (y) { return !y.isTong; }).slice(0, 6);
    return list.map(function (y) { return y.ganzhi + '（' + y.year + '）'; }).join(' ');
  }
  function bzShenSha() {
    return '年柱神煞：' + ((_w.zhu[1].shenSha || []).join('、') || '无') + '\n' +
      '月柱神煞：' + ((_w.zhu[2].shenSha || []).join('、') || '无') + '\n' +
      '日柱神煞：' + ((_w.zhu[3].shenSha || []).join('、') || '无') + '\n' +
      '时柱神煞：' + ((_w.zhu[4].shenSha || []).join('、') || '无');
  }
  function bzPillars() {
    return _w.zhu[1].ganzhi + ' ' + _w.zhu[2].ganzhi + ' ' + _w.zhu[3].ganzhi + ' ' + _w.zhu[4].ganzhi;
  }
  var BZ_AI_PROMPT =
    '你是一位深谙子平命理的资深命理师（梁湘润体系），精通《子平母法总则》《子平八字大突破》《女命详解女命通会》《大流年判例》。' +
    '请严格基于以下盘面数据（已由程序排定，勿自行排盘、勿编造数据）分析，按梁氏"推理层面"顺序推进，分点输出。\n\n' +
    '【整体判断流程】（按此顺序，勿颠倒）\n' +
    '1. 调候用神（第一优先，急中之急）：穷通宝鉴法，盛夏（四五六七月）查水、隆冬（十十一十二月）查火；庚日午月先论调候壬水，非先论正官当令；调候佳者纵无财官旺支亦可论吉\n' +
    '2. 刑冲合会拱：四柱刑冲合会拱夹、隔柱拱夹、双冲双合连年效应、冲提大运\n' +
    '3. 格局/财官：财官须地支"禄旺专位"（临官/帝旺/墓库/拱出禄旺位）方论，非天干字面；月支取格，透专取格为上\n' +
    '4. 神煞（从严取）：以贵人、桃花为主，略带驿马、孤寡，其余从简；天月德可解部分凶、不能解羊刃之凶\n' +
    '5. 六亲：年柱只判与父母缘份不作福业论；日支自坐独立（31-45最切身）；时支主福业晚年、其五行可制伏不良神煞\n' +
    '6. 日干强弱（放末位，只是入门初阶）：旺衰=月令、强弱=四柱生助统观，合成旺强/旺弱/衰强/衰弱四类；查根气轻重（临官帝旺>长生>墓库余气）；极旺顺其强、极弱顺其弱\n' +
    '7. 大运流年：四柱大运流年六柱合看、大运为先、流年为主轴；大运干支逐干逐支作用（干仍生支、干仍克支，只是力弱）；大运只是桥梁、应验在流年流月\n\n' +
    '【需要判断的内容】（逐条给出判断，勿省略）\n' +
    '1. 调候用神确定：四柱本具调候者大运入其禄旺位吉；本无此字者入旺位亦不作吉\n' +
    '2. 日主强弱综合判定（两轴四类，勿只答"强/弱"），并给身能否托财官的临界判断（坐绝归绝/四柱无根方论不能托）\n' +
    '3. 格局定名（月支取格）+ 用神三范围（调候/通关/扶抑）分别论 + 张神峰病药论核对\n' +
    '4. 财官成否：禄旺专位否？财官在天干地支无根者好运亦不济\n' +
    '5. 十神双轨解读：属性（六亲/事象）与心性（性格）分开，正偏严格区分（正印/偏印、食神/伤官、正财/偏财）\n' +
    '6. 若为女命：夫星用官/用杀（依日干×月支调候取舍，夫星=调候用神者优先）；官杀混杂分层处理（身强弱/排列/支藏有根/调候专用/月令旺位）；夫星带合之轻重\n' +
    '7. 岁运吉凶：重点查流年与日主双冲（通常凶）、岁运并临（凶，次于冲提）、伏吟/反吟、犯太岁（不作凶论）、先双冲后双合第二年凶\n' +
    '8. 神煞吉凶：依神煞干支五行与日主生克（生入克入/生出克出）论，勿字面直断\n\n' +
    '【常见错误避免】（梁氏明列之忌，严格遵守，逐条校验后再下断语）\n' +
    '- 强弱不可忽强忽弱；日主强弱只是初阶，中和只算"不是坏命"，不足以论福禄祯祥\n' +
    '- 正印须地支有临官位方论旺，否则不必以旺论；比劫须通根（临官/帝旺/墓库/余气/长生）方可用\n' +
    '- 比劫禄刃印搭配"三不可"：比劫+禄不可另见刃印，比劫+刃不可另见印禄，比劫+印不可另见禄刃；四柱比劫双出天干再遇禄刃印支大凶\n' +
    '- 禄冲吉、刃冲凶；双午不冲子（子非羊刃时）；丑未冲依轻断但不可天比地冲\n' +
    '- 调候优先于格局：勿见财官印即作吉论；"财生官、印生身"在特定月令可能是虚的\n' +
    '- 论财官须禄旺专位，勿以天干字面乱论；身弱不能托财官须至坐绝归绝临界，不抵此项不足论此说\n' +
    '- 用神勿笼统言五行（"喜庚辛而申酉未必佳，喜寅卯而甲乙反为忌"），须具体到字；勿专执日干、勿硬选用神（用神失效时忌强选一神）；天罗地网等煞限非用神能挽救\n' +
    '- 官杀混杂勿作一体同论，须分层（身强弱/排列/支藏/调候专用/月令旺位）；夫星=调候用神被合之凶优先于合夫星之凶\n' +
    '- 犯太岁不可定为凶论（任何人7岁67岁必犯）；三合六合非一律论吉（"合多者命不发福而多媚态"）\n' +
    '- 神煞吉凶在五行生克不在字面（劫煞为日主所克反化祸为福）\n' +
    '- 勿以功名标准断平民命：区分指标命学（用神论功名贵贱）与生态命学/财官派（论妻财子禄家计），普通命有日主财官禄位即可托\n' +
    '- 吉凶非全有全无：吉命不可能六项皆大吉、凶命亦非事事皆凶；先双冲后双合（或先双合后双冲）第二年论凶\n' +
    '- 勿误信书中所附八字即真推演，十之八九为后人凑例\n\n' +
    '以问者最关心之事为第一优先，按轻重缓急排列结论；专业术语加白话括注。';

  function bzCopy() {
    return '【八字排盘】' + bzBirth() + '\n\n【四柱】\n' + bzPillars() + '\n\n【大运】\n' + bzYun() + '\n\n【神煞】\n' + bzShenSha();
  }
  function bzAI() {
    return BZ_AI_PROMPT + '\n\n【八字排盘数据】\n出生：' + bzBirth() + '\n\n【四柱】\n' + bzPillars() + '\n\n【大运】\n' + bzYun() + '\n\n【神煞】\n' + bzShenSha();
  }

  // ============ 自动分析（梁湘润《子平母法总则》可程序化规则） ============
  var AA_WX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  var AA_SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  var AA_KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  var AA_YANG = { 木: '甲', 火: '丙', 土: '戊', 金: '庚', 水: '壬' };
  var AA_CHONG = { 子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳' };

  // ============ 梁湘润查表数据（已核实） ============
  var CS_START = { 甲: '亥', 乙: '午', 丙: '寅', 丁: '酉', 戊: '寅', 己: '酉', 庚: '巳', 辛: '子', 壬: '申', 癸: '卯' };
  var CS_NAMES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
  var CS_GENERAL = {
    '长生': '有创造/开拓/发展能力，遇阻碍易灰心意懒；最宜大单位独当一面开拓、研究业务，不宜白手起家硬拼、不宜贷款性发展',
    '沐浴': '敬慎自检之象；女性沐浴者人品美貌又干练，能控制对象（勿与桃花混淆）',
    '冠带': '自尊心过强，喜欢支配他人，不愿为人支配，容易树敌；女性有男性气概，好指使丈夫但对娘家照顾',
    '临官': '临官即建禄；月支临官为建禄格、日主自坐为坐禄、时支为归禄。独立自主、坚韧刚强、有领导力、踏实务实；负面为主观固执、竞争心强、易生是非；月令建禄多无祖屋，一见财官自然成福；忌身旺无依与比劫夺财，喜财官食伤流通',
    '帝旺': '最旺盛一支；阳日主帝旺即羊刃格，盛极欲衰、强中有力不从心；男子与父母缘薄、与岳母家人投缘；女子凌驾丈夫难以和谐',
    '衰': '保守成熟不勉强，人世之途皆有阅历——满足中之守成',
    '病': '举止缓慢、太多选择；自坐病者乃敏感之人，爱恨极端、有洁癖、坚毅有风度；阴日主病支者性格畏缩、兄弟不睦',
    '死': '「死」为命终之意，忌讳字面',
    '墓': '对亲属有疏远感，夫妻平淡相处',
    '绝': '绝非绝望，作哲学启导，先静后变；喜群体生活、不宜艰苦持久之事，只宜艺术/流行职业，不宜作领袖',
    '胎': '理想性的人，宜设计性自由职业；先天体质弱、通常幼子、有二度婚姻之兆、安于目前生涯',
    '养': '能承受家业但与兄弟不和；与母亲有深厚情谊；女命中年丧夫、天性悲观无积极性，但生活尚佳'
  };
  var CS_SPECIFIC = {
    '甲亥': '生于冬季多水不生木，有耐劳耐怨之坚忍性格', '戊寅': '土木相制，自我色彩淡薄',
    '庚巳': '须明见壬水为吉；一生逆境中成长，越艰辛越有成就', '癸卯': '等同天乙贵人，若无冲刑，有托于人必有善意回应；聪明，学养专长',
    '甲子': '生于冬季者作事须自力更生、久久始成；女子有感情纠缠之苦', '甲丑': '作事须依赖他人，冬木乏力，不喜冲劲',
    '乙辰': '安份守成、乐天知命之人', '丙辰': '女命婚姻不佳、男命辛勤中有成',
    '乙寅': '气度宽宏修养甚佳，只宜守成、缺乏冲劲', '丙午': '作事大胆不惧艰辛；女性对象以魁罡格为宜',
    '辛申': '柔金只宜壬水，忌癸食神之水', '壬子': '忌生于卯月（背禄逐马），不论男女皆婚姻不佳',
    '癸亥': '天干透壬水乃不受约束之人；女命有丧夫之虞',
    '甲辰': '水上漂流之巨大木材，可造就之材', '乙丑': '四柱无火，一生怕事、畏首畏尾',
    '丁辰': '等同伤官合杀库，略带骄与肃杀之气，不宜从商', '戊未': '以劫财作等量观，用衰金衰木搭配为佳',
    '己辰': '春土须丙，无丙则不成', '庚戌': '日主即魁罡，性格刚烈，有丁方吉；女命魁罡仪表佳、个性刚烈',
    '癸戌': '财库透官，最喜有冲，否则亦是一个书生', '乙亥': '女命家庭婚姻尤为不吉',
    '庚子': '女命家庭婚姻尤为不吉', '癸申': '不宜冬生、夜生；水太旺则主飘泊',
    '甲未': '季夏须四柱明见水，否则多病', '乙戌': '墓与财星同柱重叠者多有意外之财，但金钱看得重',
    '己子': '四柱须有木火；多生、夜生者婚姻不能安定', '庚寅': '虽是财旺地，过程从机会而得，有易失易得之虞',
    '辛卯': '日主辛卯与父亲难睦；亦为淫欲煞，女命婚姻有阻碍', '壬巳': '不喜天干有丁字合壬',
    '癸午': '生于午蒸发过甚，多为他人劳碌、自身所得有限，习称过路财神',
    '戊子': '日柱自坐得佳妻；生于冬季则四柱须有甲、丙', '己亥': '视同正官，无冲刑者一生安稳',
    '庚卯': '得佳妻及妻助，只忌干出比劫，遇者灭福', '辛寅': '为人灵俐有人缘、有意外之财，但作事少决断力',
    '壬午': '视同财官双美；慎于异性交往，引来无谓祸灾', '癸巳': '与家长父亲相处不和谐，亦易为娱乐所拖累',
    '甲戌': '在日柱则婚姻不佳；有六合者先凶后吉', '乙未': '有良好的兄弟情谊及同窗协助',
    '丁戌': '自坐入库，为人保守，不宜投机性及流动性商人', '戊丑': '活动能力很强，纵处逆境亦有贵人相助',
    '己戌': '在月支先破损而后得家属相助', '辛丑': '家族观念影响深刻，多为亲属所包围',
    '壬未': '若无冲刑，继承家业而作内部实际掌权之人', '癸辰': '个性含蓄，守成有余而发展不足'
  };
  var TIANYUAN_XIANWU = {
    甲: { 子: '时支印禄，女命损子', 丑: '正官入墓，家业日渐消损', 寅: '男命财吉，子女性格刚强', 卯: '不得祖先之荫福', 辰: '印库得实权，冲则不验', 巳: '不得父产，但能得妻助', 午: '自身努力，得妻助、晚年吉', 未: '正官贵人劫库，清闲岁月', 申: '日绝透偏印，为家计奔波', 酉: '官印相连、守成公正', 戌: '伤官入库、父母不全', 亥: '若入官场，则终久无下场' },
    乙: { 子: '双妻之命，职位辛劳', 丑: '子息有体弱不吉', 寅: '晚年发越，中年多聚散', 卯: '日禄归时，妨妻', 辰: '有权但名位不实；女命晚婚旺夫', 巳: '双妻之命', 午: '有女缘、有意外之财', 未: '时支日墓，夫妇反目', 申: '为他人谋事', 酉: '体弱、旺处即倾', 戌: '伤官坐自库，自骄失人缘', 亥: '中年灰心事业' },
    丙: { 子: '吉祥', 丑: '同柱伤官生财、事倍功半', 寅: '自力白手起家', 卯: '财印坐根、吉祥', 辰: '杀坐官库、女命不吉', 巳: '正官入墓，不得祖产', 午: '钱财难聚，时多时少', 未: '有实无名，为他家辛劳', 申: '夫妻反目，婚外有情', 酉: '晚年平顺', 戌: '名利双收', 亥: '波折较多' },
    丁: { 子: '专位七杀，无祖上之荫蔽', 丑: '得暗财之助力、双妻', 寅: '得入仕途、近贵', 卯: '女命不利夫子', 辰: '印坐杀库，有重权', 巳: '中年灰心', 午: '至老仍为家计奔波', 未: '比坐印库、女命丧子', 申: '晚年大富', 酉: '钱财多聚多散', 戌: '时好时坏（起伏不定）', 亥: '性刚毅、晚年吉' },
    戊: { 子: '三起三落、意外致富', 丑: '中年守成、双妻', 寅: '一生反覆（性格刚毅）', 卯: '清闲职位', 辰: '财库、双亲难保', 巳: '归禄出印、妻先亡', 午: '双妻之命，性重引是非', 未: '劫坐官库，双亲难保', 申: '子息佳，晚年发达', 酉: '女命夫妻缘薄（福禄较悭）', 戌: '五十岁大发', 亥: '首妻必换' },
    己: { 子: '干合坐财，晚年发、妻无缘', 丑: '时支杀库、艺术宗教', 寅: '女命妨子', 卯: '七杀专位、晚年性孤', 辰: '偏财入库、双亲无缘', 巳: '比财合柱，失又复得', 午: '身体有疾', 未: '晚年守成，有一清闲岁月', 申: '身体有意外伤害', 酉: '食神专位、财来财去', 戌: '偏印入库、双亲无缘', 亥: '晚年体弱' },
    庚: { 子: '时支伤官，一世辛劳', 丑: '劫库之时、手足乏情', 寅: '刚剉于柔，财官来得迟，晚发', 卯: '失月气，因妻显旺（得妻助）', 辰: '喜秋生（金水清纯则贵）', 巳: '遐龄寿考（健康长寿）', 午: '中年退休', 未: '财库守身、知足常乐', 申: '不利父亲、自由之业', 酉: '掌权贵（带刃合财，师令统摄十州）', 戌: '官库之支、孤僻人口稀少', 亥: '多生大吉' },
    辛: { 子: '虚化之命，财多外散', 丑: '劫库之支，双亲难靠', 寅: '先难后得、守成一生', 卯: '先败后成', 辰: '食伤坐库、无贵人相助', 巳: '伤官生财、妻、子皆吉', 午: '财官连坐、名誉四方', 未: '未地逢衰，财库不利父亲（双亲缘薄）', 申: '合化于劫，早年退休', 酉: '性刚毅', 戌: '七杀入库，不利父亲', 亥: '平顺之造' },
    壬: { 子: '印刃之柱、艺术之士', 丑: '自坐印库，他乡外立', 寅: '比坐财，先难后易', 卯: '专为伤官，女吉男孤僻', 辰: '自坐劫库，手足不和', 巳: '中年守成', 午: '财旺、妻再立', 未: '晚年发越', 申: '偏印坐根，女命损子', 酉: '晚年纳福吉祥', 戌: '生财辛勤，累积致富', 亥: '中年灰心' },
    癸: { 子: '妻子另立', 丑: '身旺无化，性僻强徒；失月气者虚诈之命', 寅: '不贵而家必殷富', 卯: '女命子息佳', 辰: '守财俭朴', 巳: '声誉甚佳', 午: '合财于旺支，晚年大发', 未: '时柱七杀格，多有闲事牵累', 申: '自有贵人相助', 酉: '女命丧子', 戌: '中年退休', 亥: '夜生大吉' }
  };
  // 调候用神（十干×十二月，穷通宝鉴法）
  var FU_DIAOHOU = {
    甲: { 寅: '丙', 卯: '庚', 辰: '庚', 巳: '癸', 午: '癸', 未: '癸', 申: '庚', 酉: '庚', 戌: '庚', 亥: '庚', 子: '丁', 丑: '丁' },
    乙: { 寅: '丙', 卯: '丙', 辰: '癸', 巳: '癸', 午: '癸', 未: '癸', 申: '丙', 酉: '癸', 戌: '癸', 亥: '丙', 子: '丙', 丑: '丙' },
    丙: { 寅: '壬', 卯: '壬', 辰: '壬', 巳: '壬', 午: '壬', 未: '壬', 申: '壬', 酉: '壬', 戌: '甲', 亥: '甲', 子: '壬', 丑: '壬' },
    丁: { 寅: '甲', 卯: '庚', 辰: '甲', 巳: '甲', 午: '壬', 未: '甲', 申: '甲', 酉: '甲', 戌: '甲', 亥: '甲', 子: '甲', 丑: '甲' },
    戊: { 寅: '丙', 卯: '丙', 辰: '甲', 巳: '甲', 午: '壬', 未: '癸', 申: '丙', 酉: '丙', 戌: '甲', 亥: '甲', 子: '丙', 丑: '丙' },
    己: { 寅: '丙', 卯: '甲', 辰: '丙', 巳: '癸', 午: '癸', 未: '癸', 申: '丙', 酉: '丙', 戌: '甲', 亥: '丙', 子: '丙', 丑: '丙' },
    庚: { 寅: '戊', 卯: '丁', 辰: '甲', 巳: '壬', 午: '壬', 未: '丁', 申: '丁', 酉: '丁', 戌: '甲', 亥: '丁', 子: '丁', 丑: '丙' },
    辛: { 寅: '己', 卯: '壬', 辰: '壬', 巳: '壬', 午: '壬', 未: '壬', 申: '壬', 酉: '壬', 戌: '壬', 亥: '壬', 子: '丙', 丑: '丙' },
    壬: { 寅: '庚', 卯: '戊', 辰: '甲', 巳: '壬', 午: '癸', 未: '辛', 申: '戊', 酉: '甲', 戌: '甲', 亥: '戊', 子: '戊', 丑: '丙' },
    癸: { 寅: '辛', 卯: '庚', 辰: '丙', 巳: '辛', 午: '庚', 未: '庚', 申: '丁', 酉: '辛', 戌: '辛', 亥: '庚', 子: '丙', 丑: '丙' }
  };
  // 夫星取用（女命）：日干×月支 → ['杀'/'官'/'同', 备注]
  var FU_QUYONG = {
    甲: { 寅: ['杀', '忌丙合辛官'], 卯: ['杀', '忌卯双透干'], 辰: ['杀', '庚杀调候'], 巳: ['同', ''], 午: ['同', ''], 未: ['同', ''], 申: ['杀', ''], 酉: ['杀', ''], 戌: ['杀', ''], 亥: ['杀', ''], 子: ['杀', ''], 丑: ['杀', '忌辛官归库'] },
    乙: { 寅: ['官', '不忌庚官引绝'], 卯: ['官', '忌比肩出天干'], 辰: ['同', ''], 巳: ['同', ''], 午: ['同', ''], 未: ['同', ''], 申: ['官', ''], 酉: ['同', ''], 戌: ['同', ''], 亥: ['官', ''], 子: ['官', ''], 丑: ['官', '忌辛杀归库'] },
    丙: { 寅: ['杀', '壬杀调候'], 卯: ['杀', ''], 辰: ['杀', '忌癸官入库'], 巳: ['杀', ''], 午: ['杀', ''], 未: ['杀', ''], 申: ['杀', ''], 酉: ['杀', ''], 戌: ['同', ''], 亥: ['同', ''], 子: ['杀', ''], 丑: ['杀', ''] },
    丁: { 寅: ['同', ''], 卯: ['同', ''], 辰: ['官', '忌癸杀入库'], 巳: ['同', ''], 午: ['官', '壬官调候，忌天干比肩'], 未: ['同', ''], 申: ['同', ''], 酉: ['同', ''], 戌: ['同', ''], 亥: ['同', ''], 子: ['同', ''], 丑: ['同', ''] },
    戊: { 寅: ['同', ''], 卯: ['同', ''], 辰: ['杀', '甲杀调候'], 巳: ['杀', '甲杀调候'], 午: ['同', ''], 未: ['杀', '忌乙官归库'], 申: ['官', '忌甲杀引绝'], 酉: ['杀', '忌乙官引绝'], 戌: ['杀', '甲杀调候'], 亥: ['杀', '甲杀调候'], 子: ['同', ''], 丑: ['同', ''] },
    己: { 寅: ['同', ''], 卯: ['官', '甲官调候'], 辰: ['同', ''], 巳: ['同', ''], 午: ['同', ''], 未: ['官', '忌乙杀归库'], 申: ['杀', '忌甲官引绝'], 酉: ['官', '忌乙杀引绝'], 戌: ['官', '甲官调候'], 亥: ['官', ''], 子: ['官', ''], 丑: ['官', ''] },
    庚: { 寅: ['杀', '穷通宝鉴：先用丙暖庚性，丙杀调候为夫优先（戊为忌神非调候）'], 卯: ['官', '丁官调候'], 辰: ['官', '穷通宝鉴：三月庚土旺金顽，丁官炼金为夫优先'], 巳: ['杀', '忌丁壬合官'], 午: ['杀', '忌丁壬合官'], 未: ['官', ''], 申: ['官', ''], 酉: ['官', ''], 戌: ['杀', '忌丁官归库'], 亥: ['官', '忌丙杀引绝'], 子: ['官', '不忌丁官引绝'], 丑: ['杀', '丙杀调候'] },
    辛: { 寅: ['同', ''], 卯: ['官', ''], 辰: ['官', ''], 巳: ['官', ''], 午: ['官', ''], 未: ['官', ''], 申: ['官', ''], 酉: ['官', ''], 戌: ['官', '忌丁杀归库'], 亥: ['官', ''], 子: ['官', '丙官调候，忌壬伤官'], 丑: ['官', '丙官调候，忌壬伤官'] },
    壬: { 寅: ['同', ''], 卯: ['杀', '戊杀调候'], 辰: ['杀', '忌甲合己官'], 巳: ['同', '待核'], 午: ['官', '忌癸合戊杀'], 未: ['同', ''], 申: ['杀', '戊杀调候'], 酉: ['杀', '忌甲合己官'], 戌: ['杀', '忌甲合己官'], 亥: ['杀', '戊杀调候'], 子: ['杀', '戊杀调候'], 丑: ['同', ''] },
    癸: { 寅: ['同', '待核'], 卯: ['同', ''], 辰: ['同', ''], 巳: ['同', ''], 午: ['同', ''], 未: ['同', ''], 申: ['杀', '夫取己杀，表头原注戊官夫最佳'], 酉: ['同', ''], 戌: ['同', ''], 亥: ['同', ''], 子: ['同', ''], 丑: ['同', ''] }
  };
  // 兰台诀六十甲子喜见（女命）：日柱 → 喜见条件
  var LANTAI = {
    '甲子': '己未时 壬寅时 戊寅时 癸巳时 甲午时 丙午时 戊午时 亥时 申酉戌日时', '乙丑': '己未时 戊寅时 辛亥时 癸巳时 亥时 申酉戌日时',
    '丙寅': '戊寅时 巳午未日 巳午未时', '丁卯': '巳午未日 巳午未时',
    '戊辰': '壬戌时 癸亥时 寅卯辰日 寅卯辰时', '己巳': '辛亥时 庚寅时 寅卯辰日 巳午未月',
    '庚午': '甲午时 丙子时 庚子时 辰戌丑未日', '辛未': '巳时 辰戌丑未时 辰戌丑未日',
    '壬申': '乙丑时 甲辰时 乙巳时 癸卯时 丑时 申酉戌日时 申酉戌月', '癸酉': '己丑时 甲辰时 乙巳时 癸亥时 辛亥时 丁巳时 己巳时 戊午时 丑时 申酉戌时 申酉戌日 申酉戌月',
    '甲戌': '壬戌时 癸亥时 壬辰时 巳午未日', '乙亥': '丁巳时 巳午未时 巳午未日',
    '丙子': '辛亥时 乙亥时 寅卯辰时 寅卯辰日 申子辰时', '丁丑': '辛亥时 乙亥时 寅卯辰时 寅卯辰日 申子辰全',
    '戊寅': '辰戌丑未时 辰戌丑未日 申酉戌月', '己卯': '辰戌丑未时 辰戌丑未日 申酉戌月',
    '庚辰': '壬辰时 戊寅时 戊戌时 癸亥时 癸巳时 申酉戌时 申酉戌日', '辛巳': '申酉戌日',
    '壬午': '壬子时 癸丑时 癸卯时 寅卯辰时 寅卯辰日', '癸未': '壬子时 癸丑时 丑时 寅卯辰时 寅卯辰日',
    '甲申': '壬寅时 寅卯辰时 寅卯辰日 申子辰全', '乙酉': '丁巳时 乙巳时 己巳时 辛亥时 寅卯辰时 寅卯辰日',
    '丙戌': '辛亥时 乙亥时 辰戌丑未时 辰戌丑未日', '丁亥': '壬辰时 辛亥时 乙亥时 辰戌丑未时 辰戌丑未日',
    '戊子': '春寅时 春卯时 巳午未时 巳午未日', '己丑': '春寅时 春卯时 辛亥时 巳午未时 巳午未日',
    '庚寅': '甲寅时 巳午未时 巳午未日', '辛卯': '己未时 己日 寅卯辰日时 申酉戌月',
    '壬辰': '癸酉时 壬戌时 寅卯时 丑时 寅卯辰日 申子辰全', '癸巳': '辛亥时 丑时 寅卯辰时 寅卯辰日',
    '甲午': '丙子时 戊子时 癸巳时 巳时 申酉戌时 申酉戌日', '乙未': '己未时 癸巳时 申酉戌时 申酉戌日',
    '丙申': '乙亥时 辛亥时 巳午未日', '丁酉': '乙亥时 辛亥时 乙巳时 己巳时 丁巳时 巳午未时 巳午未日 申酉戌月',
    '戊戌': '寅卯辰时 寅卯辰日', '己亥': '庚午时',
    '庚子': '甲午时 辰戌丑未时 辰戌丑未日', '辛丑': '辛亥时 巳时 辰戌丑未时 辰戌丑未日',
    '壬寅': '癸卯时 戊寅时 癸巳时 丑时 寅卯辰时 寅卯辰日', '癸卯': '戊寅时 癸巳时 丑时 寅卯辰时 寅卯辰日',
    '甲辰': '壬辰时 己未时 壬寅时 癸酉时 壬戌时 癸亥时 甲戌时 巳午未时 巳午未日 丙戌丁亥全夜生',
    '乙巳': '辛亥时 壬申时 癸酉时 戊寅时 甲戌时 巳午未时 巳午未日 丙戌丁亥俱全又值夜生',
    '丙午': '乙亥时 辛亥时 壬子时 戊子时 庚午时 辛未时 壬辰时 春寅时 春卯时 酉时 申子辰全又值冬生 寅卯辰时 寅卯辰日',
    '丁未': '乙亥时 辛亥时 壬子时 戊子时 庚午时 辛未时 壬辰时 春寅时 春卯时 酉时 申子辰全又值冬生 寅卯辰时 寅卯辰日',
    '戊申': '丙辰时值秋生 辰戌丑未时 辰戌丑未日', '己酉': '辛亥时 丁巳时值五月生 己巳时 乙巳时 丙辰时',
    '庚戌': '癸巳时 辛巳时 乙丑时 巳时 申酉戌日', '辛亥': '壬辰时 乙丑时 申酉戌时 申酉戌日',
    '壬子': '壬午时 癸未时 丙午时 癸卯时 丑时 寅卯辰时 寅卯辰日', '癸丑': '壬午时 癸未时 辛亥时 癸卯时 丑时 寅卯辰时 寅卯辰日',
    '甲寅': '寅卯辰时 寅卯辰日 申子辰全', '乙卯': '寅卯时 己亥时秋 戊申时秋 寅卯辰日',
    '丙辰': '壬戌时冬 癸亥时冬 辰戌丑未时 辰戌丑未日', '丁巳': '辛亥时 乙亥时 辰戌丑未时 辰戌丑未日',
    '戊午': '癸酉时 辛酉时 戊子时 庚子时 卯时 亥子丑时 巳午未时 巳午未日', '己未': '乙未时 己酉时 癸酉时 辛卯时 甲子时 乙丑时 巳午未时 巳午未日',
    '庚申': '巳时 寅卯辰日 寅卯辰时', '辛酉': '戊午时 辛亥时 丁巳时 乙巳时 己巳时 巳时 寅卯辰时 寅卯辰日',
    '壬戌': '甲辰时 甲戌时 癸卯时 辰时 丑时 寅卯辰时 寅卯辰日', '癸亥': '甲戌时 甲辰时 丑时 辰时'
  };

  function csOf(dg, zhi) {
    var start = CS_START[dg];
    if (!start) return '';
    var ZS = '子丑寅卯辰巳午未申酉戌亥';
    var i1 = ZS.indexOf(start), i2 = ZS.indexOf(zhi);
    var isYang = '甲丙戊庚壬'.indexOf(dg) >= 0;
    var idx = isYang ? (i2 - i1 + 12) % 12 : (i1 - i2 + 12) % 12;
    return CS_NAMES[idx];
  }

  function bzAuto() {
    if (!_w) return [];
    const dg = _w.zhu[3].gan, dz = _w.zhu[3].zhi;
    const ganArr = [_w.zhu[1].gan, _w.zhu[2].gan, _w.zhu[3].gan, _w.zhu[4].gan];
    const zhiArr = [_w.zhu[1].zhi, _w.zhu[2].zhi, _w.zhu[3].zhi, _w.zhu[4].zhi];
    const ssGan = ganArr.map(function (g) { return g === dg ? '日主' : lunarShiShen(dg + g); });
    const ssZhi = [1, 2, 3, 4].map(function (t) { return (_w.zhu[t].zhiShen && _w.zhu[t].zhiShen[0]) ? _w.zhu[t].zhiShen[0].full : ''; });
    const shenSha = [1, 2, 3, 4].map(function (t) { return _w.zhu[t].shenSha || []; });
    const dgWX = AA_WX[dg];
    const yinWX = AA_SHENG[dgWX];             // 印五行
    const caiWX = AA_KE[dgWX];                // 财五行
    const guanWX = Object.keys(AA_KE).find(function (w) { return AA_KE[w] === dgWX; }); // 官五行（克我）
    const yinLu = SS.luShen[AA_YANG[yinWX]] || '';   // 印禄支
    const caiLu = SS.luShen[AA_YANG[caiWX]] || '';   // 财禄支
    const lu = SS.luShen[dg] || '';                  // 日禄支
    const ren = SS.yangRen[dg] || '';                // 日刃支（阳干才有）
    const hasBi = ssGan.indexOf('比肩') >= 0;
    const hasJie = ssGan.indexOf('劫财') >= 0;
    const hasYinZhi = !!yinLu && zhiArr.indexOf(yinLu) >= 0;
    const hasYinGan = ssGan.indexOf('正印') >= 0 || ssGan.indexOf('偏印') >= 0;
    const hasRenZhi = !!ren && zhiArr.indexOf(ren) >= 0;
    const renInMoon = zhiArr[1] === ren, renInShi = zhiArr[3] === ren;
    const hasTianYueDe = shenSha.some(function (arr) { return arr.indexOf('天德') >= 0 || arr.indexOf('月德') >= 0; });
    const out = [];
    function push(cat, name, text, geju) { out.push({ cat: cat, name: name, text: text, geju: geju || false }); }

    // 提纲十神
    var TIGANG = {
      '比肩': '月支建禄，身强；中年前起伏不定、数起数落；独立创业不宜合伙',
      '劫财': '月令劫财/阳刃，难聚财、短暂财运；天干见杀只能守本行',
      '食神': '一生不忧衣食、得亲长荫佑；守成有余缺进取',
      '伤官': '中年得妻/女人相助，宜晚婚',
      '偏财': '守成安稳、随世俗式守成之命',
      '偏印': '才艺多变；四见以上投资失败',
      '正印': '七杀慢慢积财；伤官生财不稳定'
    };
    if (TIGANG[ssZhi[1]]) push('提纲十神', ssZhi[1] + '当令', TIGANG[ssZhi[1]], true);

    // 状态组合判则
    if (hasBi && hasJie) push('状态判则', '比劫俱透', '比肩、劫财同透天干，天透地藏，力量等同羊刃之强', true);
    if (hasRenZhi) {
      if (hasYinZhi && hasBi) push('状态判则', '一印一羊刃·比肩', '印禄与羊刃并见，天干又透比肩，主刑妻', true);
      if (hasYinZhi && hasJie) push('状态判则', '一印一羊刃·劫财', '印禄与羊刃并见，天干又透劫财，主自身凶', true);
      if (renInMoon && renInShi && caiLu && dz === caiLu) push('状态判则', '月刃时刃·日支财临官', '月、时二支皆羊刃，日支又坐财临官，主凶', true);
      if (renInShi && ssZhi[2] === '偏财') push('状态判则', '时支羊刃·自坐偏财', '时支羊刃、日主自坐偏财专旺，不利子女（近似）', true);
      var renSanHe = SS.sanHe[ren] || '';
      var renHeCount = renSanHe ? renSanHe.split('').filter(function (z) { return z !== ren && zhiArr.indexOf(z) >= 0; }).length : 0;
      if (renHeCount >= 2) push('状态判则', '羊刃三合', '羊刃' + ren + '与' + renSanHe + '成三合，主丧妻/凶（参考）', true);
      if (hasYinGan && hasTianYueDe) push('状态判则', '羊刃·印禄·天月德', '羊刃见印禄旺、天月德同柱，贵人不能解羊刃之凶（参考）', true);
    }
    if (dz === lu && zhiArr[3] === lu && hasJie) push('状态判则', '日时归禄·透劫财', '日、时二支归禄，天干又透劫财，主刑凶/孤凶', true);
    if (dz === lu) {
      var luChong = AA_CHONG[lu];
      if (luChong && zhiArr.indexOf(luChong) >= 0) push('状态判则', '禄逢冲', '日坐禄逢冲，禄冲吉，主变动而吉（参考）', true);
    }
    if (ren && dz === ren) {
      var renChong = AA_CHONG[ren];
      if (renChong && zhiArr.indexOf(renChong) >= 0) push('状态判则', '刃逢冲', '日坐羊刃逢冲，刃冲凶，主凶灾（参考）', true);
    }
    if (dgWX === '金' && '亥子丑'.indexOf(zhiArr[1]) >= 0 && !zhiArr.some(function (z) { return z === '巳' || z === '午'; })) push('状态判则', '冬金无火', '冬金日时无火，主孤（参考）');
    if (ssZhi[3] === '正财') push('状态判则', '时支专位正财', '时支专位正财，主克母、无母缘（参考）', true);

    // 财官
    if (caiLu && zhiArr.indexOf(caiLu) >= 0) push('财官', '财星禄旺', '财星' + caiWX + '之禄' + caiLu + '入地支，财有禄旺专位（参考）');
    var guanLu = SS.luShen[AA_YANG[guanWX]] || '';
    if (guanLu && zhiArr.indexOf(guanLu) >= 0) push('财官', '官星禄旺', '官星' + guanWX + '之禄' + guanLu + '入地支，官有禄旺专位（参考）');
    var hasCaiGan = ssGan.indexOf('正财') >= 0 || ssGan.indexOf('偏财') >= 0;
    var hasGuanGan = ssGan.indexOf('正官') >= 0 || ssGan.indexOf('七杀') >= 0;
    if (hasCaiGan && hasGuanGan && hasYinGan) push('财官', '天干财官印齐见', '天干财、官、印齐见，易成循环相克，不吉（参考）');

    // 大运
    push('大运', '财官四柱论', '年支主1-15岁童少年（父母缘）、月支主23-30岁（女命最重）、日支主31-45岁自坐最切身、时支主50岁至寿终（福业、可制不良神煞）');
    push('大运', '大运总则', '大运十年一换、流年一年一迁；大运为先、流年为主轴，四柱大运流年六柱合看（参考）');

    // 调候用神（梁湘润女命调候总表·穷通宝鉴法）
    var dh = FU_DIAOHOU[dg] ? FU_DIAOHOU[dg][zhiArr[1]] : '';
    if (dh) push('调候用神', dg + '日' + zhiArr[1] + '月', '月令调候用神取「' + dh + '」，其余喜忌概从缓论（参考）');

    // 夫星取用 / 兰台喜见（仅女命）
    if (_w.info.gender === 0) {
      var fq = FU_QUYONG[dg] ? FU_QUYONG[dg][zhiArr[1]] : null;
      if (fq) {
        var qyTxt = fq[0] === '杀' ? '宜以七杀为夫星（优于正官）' : (fq[0] === '官' ? '宜以正官为夫星（优于七杀）' : (fq[0] === '同' ? '官杀皆可（夫星与调候无关）' : ''));
        push('夫星取用（女命）', dg + '日' + zhiArr[1] + '月', qyTxt + (fq[1] ? '；注意：' + fq[1] : '') + '（参考）');
      }
      var lt = LANTAI[_w.zhu[3].ganzhi];
      if (lt) {
        var lthit = lanTaiHit(lt);
        if (lthit) push('兰台喜见（女命）', _w.zhu[3].ganzhi + '日', '命中喜见：' + lthit + '（参考）');
      }
    }

    // 日主十二生旺库（日干对月/日/时三支，不取年支；每支独立一行）
    [[1, '月支'], [2, '日支'], [3, '时支']].forEach(function (tp) {
      var cs = csOf(dg, zhiArr[tp[0]]);
      if (!cs) return;
      var txt = CS_GENERAL[cs] || '';
      var sp = CS_SPECIFIC[dg + zhiArr[tp[0]]];
      if (sp) txt += '；' + sp;
      if (txt) push('日主十二生旺库', tp[1] + zhiArr[tp[0]] + '（' + cs + '）', txt);
    });

    // 天元咸巫十二时断（时柱 → 断语）
    var ty = TIANYUAN_XIANWU[dg] ? TIANYUAN_XIANWU[dg][zhiArr[3]] : '';
    if (ty) push('天元咸巫十二时断', dg + '日' + zhiArr[3] + '时', ty + '（参考）');

    // 日主五行财富（梁氏分则·可计算规则）
    var caiRules = [];
    var moonZhi2 = zhiArr[1], moonSS2 = ssZhi[1];
    var caiDangLing = (moonSS2 === '正财' || moonSS2 === '偏财');
    var shiShang = (moonSS2 === '食神' || moonSS2 === '伤官');
    function zhiInSet(set) { return set.split('').filter(function (z) { return zhiArr.indexOf(z) >= 0; }); }
    if (dg === '丙' && moonZhi2 === '辰' && zhiInSet('申子').length >= 1) caiRules.push('丙日辰月：地支见申子辰会，最喜（官杀局生身调候）');
    if (dg === '丙' && moonZhi2 === '酉' && (hasBi || hasJie) && ssGan.indexOf('辛') >= 0) caiRules.push('丙日酉月：天干见比劫又见辛（丙辛合），财被合劫，主破财柔弱');
    if ((dg === '甲' || dg === '乙') && '巳午未'.indexOf(moonZhi2) >= 0 && shiShang && hasJie) caiRules.push('夏木（' + dg + '日' + moonZhi2 + '月）：食伤生财又见劫财，喜劫财相助');
    if (dg === '乙' && moonZhi2 === '酉' && zhiInSet('巳丑').length >= 1) caiRules.push('乙日酉月：地支会巳酉丑金局，从杀格');
    if ((dg === '庚' || dg === '辛') && caiDangLing && (hasBi || hasJie)) caiRules.push(dg + '日' + moonZhi2 + '月财星当令，天干又出比劫，大忌比劫夺财');
    if (dg === '庚' && '申酉'.indexOf(moonZhi2) >= 0 && zhiArr.indexOf('卯') >= 0) caiRules.push('庚日秋生建禄，地支带卯（财之禄），吉祥');
    if ((dg === '壬' || dg === '癸') && caiDangLing && shiShang) caiRules.push(dg + '日' + moonZhi2 + '月财当令，又见食伤生财，忌（泄身）');
    if ((dg === '壬' || dg === '癸')) {
      var hzch = '亥子丑'.split('').every(function (z) { return zhiArr.indexOf(z) >= 0; });
      var szch = '申子辰'.split('').every(function (z) { return zhiArr.indexOf(z) >= 0; });
      if (hzch || szch) caiRules.push(dg + '日地支会全水局（' + (hzch ? '亥子丑' : '申子辰') + '），最忌食伤与印');
    }
    if (dg === '己' && dz === '卯' && ssGan.indexOf('正官') >= 0) caiRules.push('己卯日坐杀（卯中乙木）透正官，喜比、印之运大为吉昌');
    if (caiRules.length) push('日主五行财富', dg + '日', caiRules.join('\n'), true);

    return out;
  }

  function lanTaiHit(condStr) {
    var sZhi = _w.zhu[4].zhi, rZhi = _w.zhu[3].zhi, mZhi = _w.zhu[2].zhi, sGZ = _w.zhu[4].ganzhi;
    var zArr = [_w.zhu[1].zhi, _w.zhu[2].zhi, _w.zhu[3].zhi, _w.zhu[4].zhi];
    var GZ = '[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]';
    var Z = '[子丑寅卯辰巳午未申酉戌亥]';
    var hit = [];
    condStr.split(/\s+/).forEach(function (c) {
      if (!c) return;
      // 时柱干支：己未时
      if (new RegExp('^' + GZ + '时$').test(c)) { if (sGZ === c.substr(0, 2)) hit.push(c); return; }
      // 三合"全"
      if (new RegExp('^' + Z + '{3}全').test(c)) {
        var set3 = c.substr(0, 3);
        var cnt = set3.split('').filter(function (z) { return zArr.indexOf(z) >= 0; }).length;
        if (cnt >= 3) hit.push(c); return;
      }
      // 地支集 + 日时/日/时/月
      var m = c.match(new RegExp('^(' + Z + '{2,4})(日时|时|日|月)?$'));
      if (m) {
        var set = m[1], scope = m[2] || '';
        if ((!scope || scope.indexOf('时') >= 0) && set.indexOf(sZhi) >= 0) { hit.push(c); return; }
        if ((!scope || scope.indexOf('日') >= 0) && set.indexOf(rZhi) >= 0) { hit.push(c); return; }
        if (scope === '月' && set.indexOf(mZhi) >= 0) { hit.push(c); return; }
        return;
      }
      // 单地支时：丑时 / 巳时
      if (new RegExp('^' + Z + '时$').test(c)) { if (sZhi === c.charAt(0)) hit.push(c); return; }
      // 春X时 / 酉时等带季条件
      if (new RegExp('^春' + Z + '时$').test(c)) {
        var seasonZ = { 寅: '寅卯辰', 卯: '寅卯辰', 辰: '寅卯辰', 巳: '巳午未', 午: '巳午未', 未: '巳午未', 申: '申酉戌', 酉: '申酉戌', 戌: '申酉戌', 亥: '亥子丑', 子: '亥子丑', 丑: '亥子丑' };
        var sz = c.charAt(1);
        if (seasonZ[sz] && seasonZ[sz].indexOf(sZhi) >= 0) hit.push(c);
        return;
      }
      // 复杂条件（夜生/冬生/秋生/值X月生/某日）：提取干支或地支判断
      var gz = c.match(new RegExp(GZ));
      if (gz && sGZ === gz[0]) { hit.push(c); return; }
      var z = c.match(new RegExp(Z + '{2,4}'));
      if (z && (z[0].indexOf(sZhi) >= 0 || z[0].indexOf(rZhi) >= 0)) { hit.push(c); }
    });
    return hit.join('、');
  }

  function toggleBzAuto() {
    var $p = $('#bz-auto-panel');
    if (!$p.length) return;
    if ($p.is(':visible')) { $p.hide(); return; }
    if (!_w) { $p.html('<div class="aa-tip">尚未排盘</div>').show(); return; }
    var items = bzAuto();
    var gejuItems = items.filter(function (it) { return it.geju; });
    var otherItems = items.filter(function (it) { return !it.geju; });
    var h = '';
    function renderGroup(list) {
      var lastCat = '';
      list.forEach(function (it) {
        if (it.cat !== lastCat) { if (lastCat) h += '</div>'; h += '<div class="aa-sec"><div class="aa-title">' + it.cat + '</div>'; lastCat = it.cat; }
        h += '<div class="aa-row"><span class="aa-name">' + it.name + '</span>：' + it.text.replace(/\n/g, '<br>') + '</div>';
      });
      if (lastCat) h += '</div>';
    }
    // 格局参考（需综合判断）
    if (gejuItems.length) {
      h += '<div class="aa-sec"><div class="aa-title">格局参考（需结合全局综合判断）</div>';
      var lastCat2 = '';
      gejuItems.forEach(function (it) {
        if (it.cat !== lastCat2) { if (lastCat2) h += '</div><div class="aa-sec">'; h += '<div class="aa-title">' + it.cat + '</div>'; lastCat2 = it.cat; }
        h += '<div class="aa-row"><span class="aa-name">' + it.name + '</span>：' + it.text.replace(/\n/g, '<br>') + '</div>';
      });
      h += '</div>';
      h += '<div class="aa-tip">⚠ 以上为格局判定信息（建禄/羊刃/从杀/财官局等），仅提示可能成格方向，须结合全局五行、月令当令、日主强弱与刑冲合会综合判断，勿单独据以直接下吉凶结论。</div>';
    }
    renderGroup(otherItems);
    h += '<div class="aa-tip">以上依梁湘润《子平母法总则》《女命详解》《大突破》可程序化规则及查表计算，仅供参考；查表部分（调候/夫星/兰台/天元咸巫/十二生旺库）个别条目因原书 OCR 缺失待核。</div>';
    $p.html(h).show();
  }

  window.Bazi = {
    render: render,
    parseInput: parseInput,
    buildData: buildData,
    copyPan: bzCopy,
    copyAI: bzAI
  };
})();
