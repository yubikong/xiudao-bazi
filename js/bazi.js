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
      if (zhu[7] && zhu[7].zhi) {
        const liuShaMap = get12LiuShaMap(zhu[7].zhi);
        if (t >= 1 && t <= 8 && t !== 5) zhu[t].shenSha.push('流煞-' + liuShaMap[zhu[t].zhi]);
      }
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

  function get12LiuShaMap(zhi) {
    const n = '子丑寅卯辰巳午未申酉戌亥';
    const e = SS.liuYearMap;
    const r = n.indexOf(zhi);
    const i = {};
    for (let t = 0; t < n.length; t++) i[n[t]] = e[(t - r + 12) % 12];
    return i;
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
  });

  window.Bazi = {
    render: render,
    parseInput: parseInput,
    buildData: buildData
  };
})();
