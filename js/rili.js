// ============ 黄历页面逻辑（复刻原网站 + 增加二十八星宿判断） ============
(function () {
  const Solar = window.Solar;
  const HolidayUtil = window.HolidayUtil;
  const RD = window.RiliData;
  const U = window.Utils;

  // 星宿判断：返回 星宿五行+动物（如 角木蛟），吉凶用 huangDao/heiDao 颜色
  function getXingXiu(lunar, withColor) {
    const e = lunar.getXiu();
    const t = RD.XIU_ZHENG[e] || '';
    const o = RD.XIU_ANIMAL[e] || '';
    const n = lunar.getXiuLuck();
    const xiuName = e + t + o;
    if (withColor === false) {
      const cls = ('吉' === n) ? 'huangDao' : 'heiDao';
      return '<i class="' + cls + '">' + xiuName + ' [ ' + n + ' ]</i>';
    }
    return xiuName;
  }

  function getXingXiuShortSong(xiuName) {
    return RD.XINGXIU_SHORT_SONG[xiuName] || '获取不到星宿歌诀';
  }

  function getXingXiuLongSong(xiuName) {
    return RD.XINGXIU_LONG_SONG[xiuName] || '';
  }

  function getDongGong(solar) {
    const ec = solar.getLunar().getEightChar();
    ec.setSect(1);
    const monthZhi = ec.getMonthZhi();
    const dayZhi = ec.getDayZhi();
    const m = RD.DONG_GONG[monthZhi];
    if (m && m[dayZhi]) return m[dayZhi];
    return '';
  }

  // 董公是否为吉（严格）：董公择日文本有吉（good）标记且无任何凶（bad）标记
  // 宁缺毋滥——若整月无大吉日为正常现象
  function isDongGongGood(solar) {
    const dg = getDongGong(solar);
    if (!dg) return false;
    const good = (dg.match(/class="good"/g) || []).length;
    const bad = (dg.match(/class="bad"/g) || []).length;
    return good > 0 && bad === 0;
  }

  // 是否为"大吉"日：董公吉 且 二十八星宿吉
  function isDaJi(solar, lunar) {
    return isDongGongGood(solar) && lunar.getXiuLuck() === '吉';
  }

  function getZhiXingHtml(lunar) {
    const h = lunar.getZhiXing();
    let u = '';
    if ('除危定执成开'.indexOf(h) >= 0) u = 'huangDao';
    else if ('建满平破收闭'.indexOf(h) >= 0) u = 'heiDao';
    return '<i class="' + u + '">' + h + '日</i>';
  }

  function getTianShenHtml(lunar) {
    const type = lunar.getDayTianShenType();
    const u = ('黄道' === type) ? 'huangDao' : 'heiDao';
    return '<i class="' + u + '">' + lunar.getDayTianShen() + '</i>';
  }

  function getDistance(a, p) {
    let y = (a.getJulianDay() - p.getJulianDay()).toFixed(3);
    let m = y < 0 ? '-' : '';
    let D = Math.abs(y);
    if (D < 60 / 86400) m += '1分钟内';
    else if (D < 0.041666666666666664) m += '1小时内';
    else if (D < 1) {
      let i = Math.floor(24 * D);
      let s = Math.floor((24 * D - i) * 60);
      m += i + '小时 ' + s + '分钟';
    } else if (D > 365.25) {
      let i = Math.floor(D / 365.25);
      m += i + '年';
      D = (D - 365.25 * i).toFixed(1);
      m += ' ' + D + '天';
    } else {
      m += Number(D).toFixed(1) + '天';
    }
    m = m.replace(/\.0$/, '天').replace(/-0$/, '0天').replace(/ 0$/, '');
    return m;
  }

  function nineStarPanel(title, num) {
    const a = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九' };
    const l = ({ '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 }[String(num)[0]]) || parseInt(String(num)[0], 10);
    let e = '';
    const t = [8, 4, 6, 7, 0, 2, 3, 5, 1];
    const o = { 2: true, 3: true, 5: true, 7: true };
    for (let i = 0; i < 9; i++) {
      let s = '';
      if (!isNaN(l)) {
        const e2 = (l + t[i] - 1) % 9 + 1;
        const n = o[e2] ? 'bad' : 'good';
        let d = a[e2];
        if (2 === e2 || 5 === e2) d = '<span class="feixing-bad-circle">' + d + '</span>';
        s = '<i class="' + n + '">' + d + '</i>';
      }
      e += '<div class="feixing-cell">' + s + '</div>';
    }
    return '<div class="feixing-panel"><div class="feixing-title">' + title + '</div><div class="feixing-grid">' + e + '</div></div>';
  }

  function getHoursInfo(solar) {
    const arr = [];
    for (let i = 0; i < 12; i++) {
      const s = Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), 2 * i, 30, 0);
      const l = s.getLunar();
      const ec = l.getEightChar();
      arr.push({ solar: s, lunar: l, bazi: ec, ganZhi: ec.getTimeGan() + ec.getTimeZhi() });
    }
    return arr;
  }

  // ============ 详情面板渲染（统一单引号包裹 HTML 字符串） ============
  function renderInfo(w) {
    const solar = w.info.solar;
    const lunar = w.info.lunar;
    let e = '';

    // 1. 时辰
    e += '<div class="div_table table_birth">';
    e += '<div class="dtr birthinfo"><div class="col col0">时辰：</div>';
    e += '<div class="col left">' + solar.getYear() + '年' + solar.getMonth() + '月' + solar.getDay() + '日(' + lunar.getMonthInChinese() + '月' + lunar.getDayInChinese() + ')' + U.pad(solar.getHour()) + ':' + U.pad(solar.getMinute()) + ' 星期' + solar.getWeekInChinese() + '</div></div></div>';

    // 2. 节气
    e += '<div class="div_table table_jieqi"><div class="dtr jieqi"><div class="col col0">节气：</div>';
    let t = lunar.getPrevJieQi();
    let n = t.getSolar();
    e += '<div class="col left">' + t.getName() + '：' + n.getMonth() + '月' + n.getDay() + '日' + U.pad(n.getHour()) + ':' + U.pad(n.getMinute()) + '；';
    let r = lunar.getNextJieQi();
    n = r.getSolar();
    e += r.getName() + '：' + n.getMonth() + '月' + n.getDay() + '日' + U.pad(n.getHour()) + ':' + U.pad(n.getMinute()) + '；' + '司权：' + U.wuXingColor(w.zhu[2].zhi, 'b') + '（' + w.siQuan + '）</div></div></div>';

    // 3. 八字
    e += '<div class="div_table table_bazi"><div class="dtr dtrGanshen"><div class="col col0 small">干神：</div>';
    for (let i = 1; i <= 4; i++) {
      e += '<div class="col col' + i + ' small ganshen">' + (w.zhu[i].ganShen[0] ? w.zhu[i].ganShen[0].short : '') + '</div>';
    }
    e += '</div><div class="dtr tiangan"><div class="col col0 small">天干：</div>';
    for (let i = 1; i <= 4; i++) {
      e += '<div class="col col' + i + ' bazi">' + U.wuXingColor(w.zhu[i].gan) + '</div>';
    }
    e += '</div><div class="dtr dizhi"><div class="col col0 small">地支：</div>';
    for (let i = 1; i <= 4; i++) {
      e += '<div class="col col' + i + ' bazi">' + U.wuXingColor(w.zhu[i].zhi) + '</div>';
    }
    e += '</div></div>';

    // 4. 值日
    e += '<div class="div_table table_zhiri"><div class="dtr dayinfo"><div class="col col0">值日：</div><div class="col tl col-right">' + U.wuXingColor(w.zhu[3].naYin, 'span', 0) + '&nbsp;';
    e += getZhiXingHtml(lunar) + '&nbsp;';
    e += getTianShenHtml(lunar) + '&nbsp;';
    e += '<span class="click-getWordInfo">' + U.wuXingColor(getXingXiu(lunar, true), 'span', 0) + '</span>&nbsp;';
    const p = Solar.fromDate(new Date());
    let m = getDistance(solar, p);
    e += '<span>（距离此刻：' + m + '）</span></div></div></div>';

    // 5. 时辰
    const hours = getHoursInfo(solar);
    e += '<div class="div_table table_hours" style="border-top:1px solid #bbb;"><div class="dtr dayinfo"><div class="col col0">时辰：</div><div class="col tl col-right table">';
    for (let s = 0; s < 12; s++) {
      let a2 = 'hour';
      if (s % 2 == 1) a2 += ' hour2';
      if (hours[s].bazi.getTimeZhi() === w.zhu[4].zhi) a2 += ' cuttent-shi-chen';
      e += '<div class="' + a2 + '" style="width:1em; margin:0 1px; padding:0 2px; cursor:pointer; border:1px solid #bbb;border-radius:4px;">' + U.wuXingColor(hours[s].bazi.getTimeGan()) + U.wuXingColor(hours[s].bazi.getTimeZhi()) + '</div>';
    }
    e += '</div></div></div>';

    // 6. 黄道
    e += '<div class="div_table table_hoursHuangDao" style="border-bottom:1px solid #bbb;"><div class="dtr dayinfo"><div class="col col0">黄道：</div><div class="col tl col-right table">';
    for (let i = 0; i < 12; i++) {
      let a2 = 'hour';
      if (i % 2 == 1) a2 += ' hour2';
      const cls = ('黄道' === hours[i].lunar.getTimeTianShenType()) ? 'huangDao' : 'heiDao';
      e += '<div class="' + a2 + '" style="margin:0 4px;"><i class="' + cls + '" style="font-weight:normal">' + ('黄道' === hours[i].lunar.getTimeTianShenType() ? '吉' : '凶') + '</i></div>';
    }
    e += '</div></div></div>';

    // 7. 彭祖
    e += '<div class="div_table table_pengzu"><div class="dtr dayinfo"><div class="col col0">彭祖：</div><div class="col tl col-right">' + lunar.getPengZuGan() + '，' + lunar.getPengZuZhi() + '</div></div></div>';

    // 8. ★ 星宿（二十八星宿判断 - 本地版开放显示，长歌诀默认折叠）
    const xiuName = getXingXiu(lunar, true);
    e += '<div class="div_table table_xingxiu"><div class="dtr dayinfo"><div class="col col0">星宿：</div>';
    e += '<div class="col tl col-right">' + getXingXiu(lunar, false) + '（' + getXingXiuShortSong(xiuName) + '）';
    e += '<div class="xiu-long-toggle" style="cursor:pointer;"><span class="xiu-long-btn" style="color:#888;">歌诀▸</span><span class="xiu-long-text" style="display:none;"> ' + getXingXiuLongSong(xiuName) + '</span></div>';
    e += '</div></div></div>';

    // 9. 董公
    e += '<div class="div_table table_donggong"><div class="dtr dayinfo"><div class="col col0">董公：</div><div class="col tl col-right">' + getDongGong(solar) + '</div></div></div>';

    // 10. 九宫
    let x = lunar.getDayNineStar().toFullString();
    e += '<div class="div_table table_jiugong"><div class="dtr dayinfo"><div class="col col0">九宫：</div>';
    e += '<div class="col tl col-right">' + (x = U.wuXingColor(x.substring(0, 3)) + x.substring(3)) + '</div></div></div>';

    // 11. 宜忌
    e += '<div class="div_table table_yiji"><div class="dtr dayinfo"><div class="col col0">宜忌：</div><div class="col tl col-right">';
    e += '<i class="good">宜：' + lunar.getDayYi().join('，') + '</i><br/>';
    e += '<i class="bad">忌：' + lunar.getDayJi().join('，') + '</i>';
    e += '</div></div></div>';

    // 12. 神煞
    e += '<div class="div_table table_shenSha"><div class="dtr dayinfo"><div class="col col0">神煞：</div><div class="col tl col-right">';
    e += '<i class="good">吉神：' + lunar.getDayJiShen().join('，') + '</i><br/>';
    e += '<i class="bad">凶煞：' + lunar.getDayXiongSha().join('，') + '</i>';
    e += '</div></div></div>';

    // 13. 主神
    const dayGan = w.zhu[3].gan;
    e += '<div class="div_table table_zhushen"><div class="dtr dayinfo"><div class="col col0">神方：</div><div class="col tl col-right">';
    e += '<div>喜神方位（桃花）：' + RD.SHEN_SHA.xiShenFang[dayGan] + '</div>';
    e += '<div>财神方位（搞钱）：' + RD.SHEN_SHA.caiShenFang[dayGan] + '</div>';
    e += '<div>贵神方位（福气）：' + RD.SHEN_SHA.guiShenFang[dayGan] + '</div>';
    e += '</div></div></div>';

    // 14. 飞星
    const _ = String(lunar.getYearNineStar())[0] || '';
    const j = String(lunar.getMonthNineStar())[0] || '';
    const wk = String(lunar.getDayNineStar())[0] || '';
    const k = String(lunar.getTimeNineStar())[0] || '';
    e += '<div class="div_table table_feixing"><div class="dtr dayinfo"><div class="col col0">飞星：</div><div class="col tl col-right feixing-right"><div style="color:#888;text-align:center;">（上南下北，左东右西）</div><div class="feixing-wrap">' + nineStarPanel('年', _) + nineStarPanel('月', j) + nineStarPanel('日', wk) + nineStarPanel('时', k) + '</div></div></div></div>';

    return e;
  }

  // ============ 日历渲染 ============
  function renderCalendar(w) {
    const info = w.info;
    const solar = info.solar;
    const month = solar.getMonth();
    const year = solar.getYear();

    const first = new Date(year, month - 1, 1);
    const firstSolar = Solar.fromDate(first);
    const firstLunar = firstSolar.getLunar();
    const n = firstSolar.getWeek();
    const startOffset = (n === 0 ? 6 : n - 1);
    const startDate = new Date(year, month - 1, 1 - startOffset);
    const r = [];
    for (let s = 0; s < 50; s++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + s);
      const a = Solar.fromDate(d);
      const e = a.getLunar();
      const bazi = e.getEightChar();
      bazi.setSect(1);
      const now = new Date();
      const is_today = now.getFullYear() === a.getYear() && now.getMonth() === a.getMonth() - 1 && now.getDate() === a.getDay();
      const is_sel = solar.getYear() === a.getYear() && solar.getMonth() === a.getMonth() && solar.getDay() === a.getDay();
      const is_curr_month = a.getMonth() === month;
      r.push({ solar: a, lunar: e, bazi: bazi, is_today: is_today, is_sel: is_sel, is_curr_month: is_curr_month });
    }

    let g = '<div class="cal-head">';
    for (const i of ['一', '二', '三', '四', '五', '六', '日']) g += '<div class="cal-item">' + i + '</div>';
    g += '</div><div class="cal-body">';

    for (let s = 0; s <= 6; s++) {
      g += '<div class="cal-body-row">';
      for (let a = 0; a <= 6; a++) {
        const l = r[7 * s + a + 1];
        if (!l) { g += '<div class="cal-item cal-day"></div>'; continue; }
        const e = l.solar, t = l.lunar, o = l.bazi;
        let h = e.getDay();
        h = h < 10 ? '0' + h : h;
        const p = e.toYmdHms().replace(/[- :]/gim, '').substr(0, 12);
        const y = l.is_today ? 'today' : '';
        const m = l.is_sel ? 'selected' : '';
        const S = l.is_curr_month ? 'curr-month' : 'not-curr-month';
        const x = t.getJieQi();
        const _ = t.getMonth() !== month;
        const j = { '立春': '寅', '惊蛰': '卯', '清明': '辰', '立夏': '巳', '芒种': '午', '小暑': '未', '立秋': '申', '白露': '酉', '寒露': '戌', '立冬': '亥', '大雪': '子', '小寒': '丑' }[x];
        const f = e.getWeek();
        const wk = HolidayUtil.getHoliday(e.getYear(), e.getMonth(), e.getDay());
        let k = '', L = false;
        if (0 === f || 6 === f) L = true;
        if (wk) L = !wk.isWork();
        k = L ? 'holiday' : '';
        // 大吉：董公吉 + 二十八星宿吉（仅文字标注，不加边框）
        const daJi = isDaJi(e, t);

        g += '<div class="cal-item cal-day ' + S + ' ' + y + ' ' + m + ' ' + k + '" time="' + p + '" gan="' + o.getDayGan() + '" zhi="' + o.getDayZhi() + '">';
        g += '<div class="cal-item-day">' + h + '</div>';
        g += '<div class="cal-item-info">' + t.getDayInChinese() + '</div>';
        g += '<div class="cal-item-info">' + U.wuXingColor(o.getDayGan()) + U.wuXingColor(o.getDayZhi()) + '</div>';
        if (j) g += '<div class="cal-item-left-top">' + j + '月</div>';
        if (_) g += '<div class="cal-item-left-bottom">' + t.getMonthInChinese() + '月</div>';
        if (x) g += '<div class="cal-item-right-top">' + x + '</div>';
        if ('01' === h) g += '<div class="cal-item-top">' + e.getMonth() + '月</div>' + '<div class="cal-item-bottom">' + e.getYear() + '</div>';
        if (daJi) g += '<div class="cal-item-daji">大吉</div>';
        g += '</div>';
      }
      g += '</div>';
    }
    g += '</div>';
    return g;
  }

  // ============ 输入解析 ============
  function parseInput(v) {
    v = String(v || '').trim();
    v = v.replace(/[^\d]/g, '');
    if (v.length < 4) return null;
    const year = parseInt(v.substr(0, 4), 10);
    const month = v.length >= 6 ? parseInt(v.substr(4, 2), 10) : 6;
    const day = v.length >= 8 ? parseInt(v.substr(6, 2), 10) : 1;
    const hour = v.length >= 10 ? parseInt(v.substr(8, 2), 10) : 12;
    const minute = v.length >= 12 ? parseInt(v.substr(10, 2), 10) : 0;
    if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    try {
      return Solar.fromYmdHms(year, month, day, hour, minute, 0);
    } catch (e2) {
      return null;
    }
  }

  // ============ 月份跳转（保持同一天，目标月无此日则取月末） ============
  function shiftMonth(delta) {
    const solar = parseInput($('#input').val());
    if (!solar) return;
    let ny = solar.getYear(), nm = solar.getMonth() + delta;
    if (nm < 1) { nm = 12; ny--; }
    if (nm > 12) { nm = 1; ny++; }
    const lastDay = new Date(ny, nm, 0).getDate();
    const nd = Math.min(solar.getDay(), lastDay);
    const v = Solar.fromYmdHms(ny, nm, nd, solar.getHour(), solar.getMinute(), 0).toYmdHms().replace(/[- :]/gim, '').substr(0, 12);
    $('#input').val(v);
    render(v);
  }

  // ============ 主渲染 ============
  function render(vStr) {
    const solar = parseInput(vStr);
    if (!solar) {
      $('#calendar').html('');
      $('#info').html('');
      return;
    }
    const lunar = solar.getLunar();
    const bazi = lunar.getEightChar();
    bazi.setSect(1);

    const prev = lunar.getPrevJieQi();
    const d = solar.getJulianDay() - prev.getSolar().getJulianDay();

    const w = {
      info: { solar: solar, lunar: lunar, bazi: bazi },
      zhu: [],
      siQuan: d.toFixed(2)
    };
    const titles = ['造', '年柱', '月柱', '日柱', '时柱'];
    const gans = [bazi.getYearGan(), bazi.getMonthGan(), bazi.getDayGan(), bazi.getTimeGan()];
    const zhis = [bazi.getYearZhi(), bazi.getMonthZhi(), bazi.getDayZhi(), bazi.getTimeZhi()];
    const ganShens = [bazi.getYearShiShenGan(), bazi.getMonthShiShenGan(), '日主', bazi.getTimeShiShenGan()];
    const zhiShensList = [bazi.getYearShiShenZhi(), bazi.getMonthShiShenZhi(), bazi.getDayShiShenZhi(), bazi.getTimeShiShenZhi()];
    const hideGansList = [bazi.getYearHideGan(), bazi.getMonthHideGan(), bazi.getDayHideGan(), bazi.getTimeHideGan()];
    const naYins = [bazi.getYearNaYin(), bazi.getMonthNaYin(), bazi.getDayNaYin(), bazi.getTimeNaYin()];
    w.zhu[0] = { title: '造', gan: '', zhi: '', naYin: '' };
    for (let i = 1; i <= 4; i++) {
      const zhiShen = (hideGansList[i - 1] || []).map(function (g, idx) {
        const e2 = zhiShensList[i - 1][idx] || '';
        return { full: e2, short: U.shiShenShort(e2), gan: g };
      });
      w.zhu[i] = {
        title: titles[i],
        gan: gans[i - 1],
        zhi: zhis[i - 1],
        ganzhi: gans[i - 1] + zhis[i - 1],
        ganShen: [{ full: ganShens[i - 1], short: U.shiShenShort(ganShens[i - 1]), gan: gans[i - 1] }],
        zhiShen: zhiShen,
        naYin: naYins[i - 1]
      };
    }

    $('#calendar').html(renderCalendar(w));
    $('#info').html(renderInfo(w));
    // 月份标签
    const ml = document.getElementById('month-label');
    if (ml) ml.textContent = solar.getYear() + '年' + solar.getMonth() + '月';

    $('.calendar').off('click').on('click', '.cal-day', function () {
      const time = $(this).attr('time');
      $('#input').val(time);
      render(time);
    });

    // 点击时辰切换（原网站逻辑：点上半格=前一时辰，下半格=该时辰）
    $('#info').off('click.hour', '.table_hours .hour').on('click.hour', '.table_hours .hour', function (ev) {
      const s = $(this).index();
      let a = Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), 2 * s, 30, 0);
      // 点击格子上半部 → 该时辰前半小时（即上一时辰的后半段）
      const rect = ev.currentTarget.getBoundingClientRect();
      if (ev.pageY < rect.top + rect.height / 2) {
        a = Solar.fromJulianDay(a.getJulianDay() - 1 / 24);
      }
      const v = a.toYmdHms().replace(/[- :]/gim, '').substr(0, 12);
      $('#input').val(v);
      render(v);
    });

    // 星宿长歌诀折叠/展开
    $('#info').off('click.xiu', '.xiu-long-toggle').on('click.xiu', '.xiu-long-toggle', function () {
      const $t = $(this).find('.xiu-long-text');
      const $b = $(this).find('.xiu-long-btn');
      const hidden = $t.css('display') === 'none';
      $t.css('display', hidden ? 'inline' : 'none');
      $b.text(hidden ? '歌诀▾' : '歌诀▸');
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
    $('#input').val(v);
    render(v);

    $('#input').on('input', function () {
      render($(this).val());
    });
    $('#input').on('keypress', function (e2) {
      if (13 === e2.which) render($(this).val());
    });

    $('.btn_today').on('click', function () {
      const now = Solar.fromDate(new Date());
      const v2 = now.toYmdHms().replace(/[- :]/gim, '').substr(0, 12);
      $('#input').val(v2);
      render(v2);
    });

    // 月份跳转：左箭头=上个月，右箭头=下个月
    $('#month-prev').on('click', function () { shiftMonth(-1); });
    $('#month-next').on('click', function () { shiftMonth(1); });
  });

  window.Rili = {
    render: render,
    getXingXiu: getXingXiu,
    getXingXiuShortSong: getXingXiuShortSong,
    getXingXiuLongSong: getXingXiuLongSong,
    isDongGongGood: isDongGongGood,
    isDaJi: isDaJi
  };
})();
