// ============ 公共工具函数（从原网站提取） ============
window.Utils = (function () {
  // 五行映射
  function wuXingMap(t) {
    return ({ 金: "金", 庚: "金", 辛: "金", 申: "金", 酉: "金", 木: "木", 甲: "木", 乙: "木", 寅: "木", 卯: "木", 水: "水", 壬: "水", 癸: "水", 亥: "水", 子: "水", 火: "火", 丙: "火", 丁: "火", 巳: "火", 午: "火", 土: "土", 戊: "土", 己: "土", 辰: "土", 戌: "土", 丑: "土", 未: "土" })[t];
  }

  // 五行颜色
  var wuXingColorMap = { 金: "c-gold", 庚: "c-gold", 辛: "c-gold", 申: "c-gold", 酉: "c-gold", 木: "c-wood", 甲: "c-wood", 乙: "c-wood", 寅: "c-wood", 卯: "c-wood", 水: "c-water", 壬: "c-water", 癸: "c-water", 亥: "c-water", 子: "c-water", 火: "c-fire", 丙: "c-fire", 丁: "c-fire", 巳: "c-fire", 午: "c-fire", 土: "c-earth", 戊: "c-earth", 己: "c-earth", 辰: "c-earth", 戌: "c-earth", 丑: "c-earth", 未: "c-earth", 男: "c-water", 乾造: "c-water", 乾: "c-water", 女: "c-fire", 坤造: "c-fire", 坤: "c-fire",
    角木蛟: "c-wood", 亢金龙: "c-gold", 氐土貉: "c-earth", 尾火虎: "c-fire", 箕水豹: "c-water", 斗木獬: "c-wood", 牛金牛: "c-gold", 女土蝠: "c-earth", 室火猪: "c-fire", 壁水貐: "c-water", 奎木狼: "c-wood", 娄金狗: "c-gold", 胃土彘: "c-earth", 觜火猴: "c-fire", 参水猿: "c-water", 井木犴: "c-wood", 鬼金羊: "c-gold", 柳土獐: "c-earth", 翼火蛇: "c-fire", 轸水蚓: "c-water" };

  function wuXingColor(t, n, e) {
    n = n || "span"; e = e || 0;
    var r = wuXingMap(t) || t;
    var o = wuXingColorMap[r] || "";
    if (!o && 3 === String(t).length) { o = wuXingColorMap[String(t).substr(2, 1)] || ""; }
    if (e) { o = "c-suse"; }
    if ("" === n) { return t; }
    return '<' + n + ' class="' + o + '">' + t + '</' + n + '>';
  }

  // 十二长生
  var changShengMap = { 甲亥: "长生", 丙寅: "长生", 戊寅: "长生", 庚巳: "长生", 壬申: "长生", 乙午: "长生", 丁酉: "长生", 己酉: "长生", 辛子: "长生", 癸卯: "长生",
    甲子: "沐浴", 丙卯: "沐浴", 戊卯: "沐浴", 庚午: "沐浴", 壬酉: "沐浴", 乙巳: "沐浴", 丁申: "沐浴", 己申: "沐浴", 辛亥: "沐浴", 癸寅: "沐浴",
    甲丑: "冠带", 丙辰: "冠带", 戊辰: "冠带", 庚未: "冠带", 壬戌: "冠带", 乙辰: "冠带", 丁未: "冠带", 己未: "冠带", 辛戌: "冠带", 癸丑: "冠带",
    甲寅: "临官", 丙巳: "临官", 戊巳: "临官", 庚申: "临官", 壬亥: "临官", 乙卯: "临官", 丁午: "临官", 己午: "临官", 辛酉: "临官", 癸子: "临官",
    甲卯: "帝旺", 丙午: "帝旺", 戊午: "帝旺", 庚酉: "帝旺", 壬子: "帝旺", 乙寅: "帝旺", 丁巳: "帝旺", 己巳: "帝旺", 辛申: "帝旺", 癸亥: "帝旺",
    甲辰: "衰", 丙未: "衰", 戊未: "衰", 庚戌: "衰", 壬丑: "衰", 乙丑: "衰", 丁辰: "衰", 己辰: "衰", 辛未: "衰", 癸戌: "衰",
    甲巳: "病", 丙申: "病", 戊申: "病", 庚亥: "病", 壬寅: "病", 乙子: "病", 丁卯: "病", 己卯: "病", 辛午: "病", 癸酉: "病",
    甲午: "死", 丙酉: "死", 戊酉: "死", 庚子: "死", 壬卯: "死", 乙亥: "死", 丁寅: "死", 己寅: "死", 辛巳: "死", 癸申: "死",
    甲未: "墓", 丙戌: "墓", 戊戌: "墓", 庚丑: "墓", 壬辰: "墓", 乙戌: "墓", 丁丑: "墓", 己丑: "墓", 辛辰: "墓", 癸未: "墓",
    甲申: "绝", 丙亥: "绝", 戊亥: "绝", 庚寅: "绝", 壬巳: "绝", 乙酉: "绝", 丁子: "绝", 己子: "绝", 辛卯: "绝", 癸午: "绝",
    甲酉: "胎", 丙子: "胎", 戊子: "胎", 庚卯: "胎", 壬午: "胎", 乙申: "胎", 丁亥: "胎", 己亥: "胎", 辛寅: "胎", 癸巳: "胎",
    甲戌: "养", 丙丑: "养", 戊丑: "养", 庚辰: "养", 壬未: "养", 乙未: "养", 丁戌: "养", 己戌: "养", 辛丑: "养", 癸辰: "养" };

  function changShengColor(t, suse) {
    var c = changShengMap[t] || "";
    var colorMap = { 长生: "c-water", 沐浴: "c-water", 冠带: "c-water", 临官: "c-water", 帝旺: "c-water", 衰: "c-earth", 病: "c-earth", 死: "c-earth", 墓: "c-earth", 绝: "c-earth", 胎: "c-fire", 养: "c-fire" };
    if (suse) { return c; }
    return '<span class="' + (colorMap[c] || "") + '">' + c + '</span>';
  }

  // 十神简称
  var shiShenShortMap = { 比肩: "比", 劫财: "劫", 食神: "食", 伤官: "伤", 偏财: "财", 正财: "才", 七杀: "杀", 正官: "官", 偏印: "枭", 正印: "印", 日主: "日" };
  function shiShenShort(s) { return shiShenShortMap[s] || s; }

  // 干支加减
  var GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  var ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

  function ganZhiAdd(gz, n) {
    var g = gz.substr(0, 1), z = gz.substr(1, 1);
    var gi = GAN.indexOf(g), zi = ZHI.indexOf(z);
    return GAN[(gi + n + 10) % 10] + ZHI[(zi + n + 12) % 12];
  }
  function ganZhiMinus(a, b) {
    return ZHI.indexOf(a.substr(1, 1)) - ZHI.indexOf(b.substr(1, 1));
  }

  // 空亡（旬空）
  function xunKong(gz) {
    var g = gz.substr(0, 1), z = gz.substr(1, 1);
    var gi = GAN.indexOf(g), zi = ZHI.indexOf(z);
    // 找 gz 在 60 甲子中的位置（lunar.js UMD 模式下 LunarUtil 在 window 顶层）
    var LunarUtil = window.LunarUtil;
    var idx = -1;
    if (LunarUtil && LunarUtil.JIA_ZI) { idx = LunarUtil.JIA_ZI.indexOf(gz); }
    if (idx < 0) {
      // 回退：通过 gz 计算 60 甲子位置
      // idx = (6*gi) + (zi/2)
      idx = 6 * gi + Math.floor(zi / 2);
    }
    var xunStart = Math.floor(idx / 10) * 10;
    var k1 = ZHI[(xunStart + 10) % 12], k2 = ZHI[(xunStart + 11) % 12];
    return k1 + k2;
  }

  // 生肖
  function getShengXiao(zhi) {
    return { 子: "鼠", 丑: "牛", 寅: "虎", 卯: "兔", 辰: "龙", 巳: "蛇", 午: "马", 未: "羊", 申: "猴", 酉: "鸡", 戌: "狗", 亥: "猪" }[zhi] || "";
  }

  // 数字补零
  function pad(n, w) {
    w = w || 2;
    return String(n).padStart(w, "0");
  }

  return {
    wuXingMap: wuXingMap,
    wuXingColor: wuXingColor,
    changShengColor: changShengColor,
    shiShenShort: shiShenShort,
    ganZhiAdd: ganZhiAdd,
    ganZhiMinus: ganZhiMinus,
    xunKong: xunKong,
    getShengXiao: getShengXiao,
    pad: pad
  };
})();
